const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
    startQuiz,
    submitQuiz,
    getResult,
    getHistory,
    getQuizResults,
    getAllResults,
    getLatestResult,
} = require('../controllers/submissionController');

// Student
router.post('/start/:quizId', protect, authorize('student'), startQuiz);
router.post('/submit/:quizId', protect, authorize('student'), submitQuiz);
router.get('/history', protect, authorize('student'), getHistory);
router.get('/latest/result', protect, authorize('student'), getLatestResult);

// Shared
router.get('/:submissionId/result', protect, getResult);

// Admin
router.get('/all', protect, authorize('admin'), getAllResults);
router.get('/quiz/:quizId/results', protect, authorize('admin'), getQuizResults);

module.exports = router;
