const express = require('express');
const PublicController = require('../controllers/publicController');
const { loginAdmin, logoutAdmin, getAdminSession } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/discover/featured-tour', PublicController.getDiscoverTour);
router.get('/discover/random-tour', PublicController.getRandomTour);
router.get('/discover/suggested-tour', PublicController.getSuggestedTour);
router.get('/tours', PublicController.getTours);
router.get('/tours/upcoming-schedule', PublicController.getUpcomingSchedule);
router.get('/tours/featured-upcoming', PublicController.getFeaturedUpcomingTours);
router.get('/tours/:id', PublicController.getTourById);
router.post('/booking', PublicController.createBooking);
router.post('/admin/login', loginAdmin);
router.post('/admin/logout', logoutAdmin);
router.get('/admin/session', getAdminSession);

module.exports = router;
