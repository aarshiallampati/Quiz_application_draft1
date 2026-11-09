const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
    logEvent,
    uploadSnapshot,
    uploadMiddleware,
    getSession,
    getDashboard,
} = require('../controllers/proctorController');

// Student (during quiz)
router.post('/log-event', protect, logEvent);
router.post('/snapshot', protect, uploadMiddleware, uploadSnapshot);

// Admin / shared
router.get('/session/:submissionId', protect, getSession);
router.get('/dashboard', protect, authorize('admin'), getDashboard);

module.exports = router;
