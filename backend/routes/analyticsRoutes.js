const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
    getQuizAnalytics,
    getQuestionAnalytics,
    getStudentAnalytics,
    getOverviewAnalytics,
} = require('../controllers/analyticsController');

router.get('/overview', protect, authorize('admin'), getOverviewAnalytics);
router.get('/quiz/:quizId', protect, authorize('admin'), getQuizAnalytics);
router.get('/question/:quizId', protect, authorize('admin'), getQuestionAnalytics);
router.get('/student/:studentId', protect, getStudentAnalytics);

module.exports = router;
