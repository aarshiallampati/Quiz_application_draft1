const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    assignQuiz,
    getStudentQuizzes,
    addQuestion,
    getQuestions,
    deleteQuestion,
} = require('../controllers/quizController');

// Student routes (MUST be before /:id to avoid param conflict)
router.get('/student/my-quizzes', protect, authorize('student'), getStudentQuizzes);

// Admin CRUD
router.post('/', protect, authorize('admin'), createQuiz);
router.get('/', protect, authorize('admin'), getQuizzes);
router.put('/:id', protect, authorize('admin'), updateQuiz);
router.delete('/:id', protect, authorize('admin'), deleteQuiz);
router.post('/:id/assign', protect, authorize('admin'), assignQuiz);

// Shared
router.get('/:id', protect, getQuizById);

// Questions
router.post('/:id/questions', protect, authorize('admin'), addQuestion);
router.get('/:id/questions', protect, getQuestions);
router.delete('/question/:questionId', protect, authorize('admin'), deleteQuestion);

module.exports = router;
