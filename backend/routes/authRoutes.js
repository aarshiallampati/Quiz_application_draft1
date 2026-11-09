const router = require('express').Router();
const { register, login, getMe, changePassword, getStudents } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.get('/students', protect, authorize('admin'), getStudents);

module.exports = router;
