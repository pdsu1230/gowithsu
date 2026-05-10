const express = require('express');
const path = require('path');
const multer = require('multer');
const AdminController = require('../controllers/adminController');
const { ensureUploadDirectory } = require('../services/uploadPath.service');

const router = express.Router();

const imagesDir = ensureUploadDirectory();

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, imagesDir);
	},
	filename: (_req, file, cb) => {
		const ext = path.extname(file.originalname || '').toLowerCase();
		const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, safeName);
	}
});

const upload = multer({
	storage,
	limits: {
		fileSize: 8 * 1024 * 1024
	},
	fileFilter: (_req, file, cb) => {
		const isImage = String(file.mimetype || '').startsWith('image/');
		cb(isImage ? null : new Error('Chỉ hỗ trợ upload file ảnh.'), isImage);
	}
});

router.get('/tours', AdminController.getTours);
router.post('/tours', AdminController.createTour);
router.put('/tours/:id', AdminController.updateTour);
router.delete('/tours/:id', AdminController.deleteTour);
router.post('/upload-images', (req, res, next) => {
	upload.array('images', 20)(req, res, (error) => {
		if (error) {
			if (error.code === 'LIMIT_FILE_SIZE') {
				return res.status(400).json({ message: 'Mỗi ảnh tối đa 8MB.' });
			}

			return res.status(400).json({ message: error.message || 'Upload ảnh thất bại.' });
		}

		return AdminController.uploadImages(req, res, next);
	});
});

router.get('/bookings', AdminController.getBookings);
router.get('/bookings/history', AdminController.getHistoryBookings);
router.get('/bookings/:bookingId/members', AdminController.getBookingMembers);
router.delete('/members/:memberId', AdminController.deleteMember);
router.patch('/bookings/:bookingId/date', AdminController.updateBookingDate);
router.get('/export/tour/:tourId/:date', AdminController.exportTour);
router.get('/export/week', AdminController.exportWeek);
router.get('/overview', AdminController.getOverviewStats);

module.exports = router;
