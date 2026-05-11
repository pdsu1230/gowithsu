const fs = require('fs');
const path = require('path');

function parseEnvFile(content) {
  const parsed = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (!key) {
      return;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  });

  return parsed;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const envValues = parseEnvFile(fs.readFileSync(filePath, 'utf8'));

  Object.entries(envValues).forEach(([key, value]) => {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });

  console.log(`Loaded environment variables from ${filePath}`);
  return true;
}

function loadEnvironmentVariables() {
  const candidateFiles = [
    path.join('/etc/secrets', '.env'),
    path.join('/etc/secrets', 'render.env'),
    path.join(__dirname, '.env')
  ];

  candidateFiles.forEach(loadEnvFile);
}

loadEnvironmentVariables();

const express = require('express');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { requireAdminPage, requireAdminApi } = require('./middleware/adminAuth');
const { initDatabase } = require('./database/client');
const { resolveUploadDirectory, ensureUploadDirectory } = require('./services/uploadPath.service');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = resolveUploadDirectory();
const heroImagesDir = path.join(__dirname, 'public', 'images', 'hero');

function getHeroImageList() {
  try {
    const entries = fs.readdirSync(heroImagesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => /\.(avif|gif|jpe?g|png|webp)$/i.test(fileName))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }))
      .map((fileName) => ({
        src: `/images/hero/${encodeURIComponent(fileName)}`,
        alt: `Ảnh hero ${fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')}`
      }));
  } catch (_error) {
    return [];
  }
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Images', express.static(uploadDir));

app.use('/api', publicRoutes);
app.use('/api/admin', requireAdminApi, adminRoutes);

app.get('/api/hero-images', (req, res) => {
  res.json(getHeroImageList());
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'booking.html'));
});

app.get('/tours', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tours.html'));
});

app.get('/tour/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tour-detail.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/admin', requireAdminPage, (req, res) => {
  res.redirect('/admin/overview');
});

app.get('/admin/tours', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-tours.html'));
});

app.get('/admin/bookings', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-bookings.html'));
});

app.get('/admin/history', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-history.html'));
});

app.get('/admin/overview', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-overview.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.'
  });
});

async function startServer() {
  await initDatabase();
  ensureUploadDirectory();

  app.listen(PORT, () => {
    console.log(`Tour booking app listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
