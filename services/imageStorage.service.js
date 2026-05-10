const fs = require('fs');
const path = require('path');
const { ensureUploadDirectory } = require('./uploadPath.service');

function isSupabaseStorageConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_BUCKET
  );
}

function buildSafeFileName(originalName) {
  const ext = path.extname(String(originalName || '')).toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

async function uploadToSupabase(file) {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  const fileName = buildSafeFileName(file.originalname);
  const folder = String(process.env.SUPABASE_UPLOAD_PREFIX || 'tour-images').replace(/^\/+|\/+$/g, '');
  const objectKey = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(objectKey, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Upload ảnh lên Supabase thất bại.');
  }

  const { data } = supabase
    .storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(objectKey);

  return {
    url: data.publicUrl,
    fileName
  };
}

function uploadToLocal(file) {
  const imagesDir = ensureUploadDirectory();
  const fileName = buildSafeFileName(file.originalname);
  const targetPath = path.join(imagesDir, fileName);

  fs.writeFileSync(targetPath, file.buffer);

  return {
    url: `/Images/${fileName}`,
    fileName
  };
}

async function uploadImages(files) {
  if (isSupabaseStorageConfigured()) {
    const results = [];
    for (const file of files) {
      const item = await uploadToSupabase(file);
      results.push(item);
    }
    return results;
  }

  return files.map((file) => uploadToLocal(file));
}

module.exports = {
  isSupabaseStorageConfigured,
  uploadImages
};
