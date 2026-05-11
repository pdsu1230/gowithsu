const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) {
      continue;
    }

    const idx = line.indexOf('=');
    if (idx === -1) {
      continue;
    }

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) {
      process.env[key] = value;
    }
  }
}

function assertConfig() {
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_BUCKET'
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

function walkImages(dir) {
  const results = [];
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkImages(fullPath));
      continue;
    }

    if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function buildStorageKey(localPath, rootDir, sourceLabel) {
  const rel = toPosix(path.relative(rootDir, localPath));
  const prefix = String(process.env.SUPABASE_UPLOAD_PREFIX || 'tour-images').replace(/^\/+|\/+$/g, '');
  return `${prefix}/migrated/${sourceLabel}/${rel}`;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.avif') return 'image/avif';
  return 'application/octet-stream';
}

function getPublicUrl(supabase, key) {
  const { data } = supabase.storage.from(process.env.SUPABASE_BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

function localPathCandidates(localPath, rootDir, sourceLabel) {
  const rel = toPosix(path.relative(rootDir, localPath));
  const base = path.basename(localPath);

  if (sourceLabel === 'public-images') {
    return [`/images/${rel}`, `/images/${base}`];
  }

  return [`/Images/${rel}`, `/Images/${base}`];
}

async function uploadAllImages(supabase) {
  const projectRoot = path.join(__dirname, '..');
  const publicImagesRoot = path.join(projectRoot, 'public', 'images');
  const dynamicImagesRoot = path.join(projectRoot, 'Images');

  const jobs = [
    { root: publicImagesRoot, label: 'public-images' },
    { root: dynamicImagesRoot, label: 'images' }
  ];

  const urlMap = new Map();
  let uploadedCount = 0;
  const failedFiles = [];

  for (const job of jobs) {
    const files = walkImages(job.root);
    for (const filePath of files) {
      const key = buildStorageKey(filePath, job.root, job.label);
      const content = fs.readFileSync(filePath);
      try {
        const { error } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET)
          .upload(key, content, {
            upsert: true,
            contentType: getContentType(filePath)
          });

        if (error) {
          failedFiles.push({ filePath, reason: error.message });
          continue;
        }

        const publicUrl = getPublicUrl(supabase, key);
        for (const candidate of localPathCandidates(filePath, job.root, job.label)) {
          urlMap.set(candidate, publicUrl);
        }
        uploadedCount += 1;
      } catch (error) {
        failedFiles.push({ filePath, reason: error.message });
      }
    }
  }

  return { urlMap, uploadedCount, failedFiles };
}

function replaceUrlsInText(text, urlMap) {
  let updated = text;
  for (const [localUrl, remoteUrl] of urlMap.entries()) {
    if (updated.includes(localUrl)) {
      updated = updated.split(localUrl).join(remoteUrl);
    }
  }
  return updated;
}

async function updateTourImageFields(pool, urlMap) {
  const selectResult = await pool.query('SELECT id, image_url, image_urls FROM tours');
  let updatedRows = 0;

  for (const row of selectResult.rows) {
    const nextImageUrl = row.image_url ? replaceUrlsInText(row.image_url, urlMap) : row.image_url;
    const nextImageUrls = row.image_urls ? replaceUrlsInText(row.image_urls, urlMap) : row.image_urls;

    if (nextImageUrl !== row.image_url || nextImageUrls !== row.image_urls) {
      await pool.query('UPDATE tours SET image_url = $1, image_urls = $2 WHERE id = $3', [
        nextImageUrl,
        nextImageUrls,
        row.id
      ]);
      updatedRows += 1;
    }
  }

  return updatedRows;
}

async function main() {
  loadEnv();
  assertConfig();

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    const { urlMap, uploadedCount, failedFiles } = await uploadAllImages(supabase);
    const updatedTours = await updateTourImageFields(pool, urlMap);

    console.log(`Uploaded images: ${uploadedCount}`);
    console.log(`Mapped URL entries: ${urlMap.size}`);
    console.log(`Updated tours: ${updatedTours}`);
    console.log(`Failed uploads: ${failedFiles.length}`);
    for (const item of failedFiles.slice(0, 20)) {
      console.log(`- ${item.filePath} :: ${item.reason}`);
    }
    console.log('Image sync completed successfully.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Image sync failed:', error.message);
  process.exit(1);
});
