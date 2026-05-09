const path = require('path');
const express = require('express');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { requireAdminPage, requireAdminApi } = require('./middleware/adminAuth');
const { initDatabase } = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/Images', express.static(path.join(__dirname, 'Images')));

app.use('/api', publicRoutes);
app.use('/api/admin', requireAdminApi, adminRoutes);

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

  app.listen(PORT, () => {
    console.log(`Tour booking app listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start application', error);
  process.exit(1);
});
