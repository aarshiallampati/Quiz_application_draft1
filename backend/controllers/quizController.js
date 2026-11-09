const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');

// ── POST /api/quiz  (admin) ────────────────────────────────
exports.createQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json(quiz);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/quiz  (admin — all quizzes) ───────────────────
exports.getQuizzes = async (req, res, next) => {
    try {
        const quizzes = await Quiz.find({ isArchived: { $ne: true } })
            .populate('createdBy', 'name email')
            .sort('-createdAt');
        res.json(quizzes);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/quiz/:id ──────────────────────────────────────
exports.getQuizById = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('questions');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json(quiz);
    } catch (error) {
        next(error);
    }
};

// ── PUT /api/quiz/:id  (admin) ─────────────────────────────
exports.updateQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
        res.json(quiz);
    } catch (error) {
        next(error);
    }
};

// ── DELETE /api/quiz/:id  (admin — archive, not hard-delete)
exports.deleteQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        quiz.isArchived = true;
        quiz.isPublished = false;
        await quiz.save();

        res.json({ message: 'Quiz archived' });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/quiz/:id/assign  (admin) ─────────────────────
exports.assignQuiz = async (req, res, next) => {
    try {
        const { studentIds, groups } = req.body;
        // studentIds: array of user ObjectIds
        // groups: [{ department, semester }]

        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Direct student assignment
        if (studentIds?.length) {
            const uniqueIds = [...new Set([...quiz.assignedTo.map(String), ...studentIds])];
            quiz.assignedTo = uniqueIds;
        }

        // Group assignment (department + semester)
        if (groups?.length) {
            quiz.assignedGroups = [...(quiz.assignedGroups || []), ...groups];
        }

        quiz.isPublished = true;
        await quiz.save();

        res.json({
            message: 'Quiz assigned successfully',
            assignedTo: quiz.assignedTo.length,
            assignedGroups: quiz.assignedGroups.length,
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/quiz/student/my-quizzes  (student) ────────────
exports.getStudentQuizzes = async (req, res, next) => {
    try {
        const now = new Date();
        const student = req.user;

        // Assignment filter (applies to both modes)
        const assignmentFilter = {
            $or: [
                { assignedTo: student._id },
                {
                    assignedGroups: {
                        $elemMatch: {
                            department: student.department,
                            semester: student.semester,
                        },
                    },
                },
                // Top-level department/semester match
                {
                    department: student.department,
                    semester: student.semester,
                },
                // Open quiz — no specific assignment
                {
                    assignedTo: { $size: 0 },
                    assignedGroups: { $size: 0 },
                    department: { $exists: false },
                    semester: { $exists: false },
                },
                // Open quiz saved with blank department/semester (still unassigned)
                {
                    assignedTo: { $size: 0 },
                    assignedGroups: { $size: 0 },
                    department: { $in: [null, ''] },
                    semester: null,
                }
            ],
        };

        const quizzes = await Quiz.find({
            isPublished: true,
            isArchived: { $ne: true },
            // Both filters have to apply. A single object can't hold two $or keys.
            $and: [
                assignmentFilter,
                {
                    $or: [
                        { quizMode: 'immediate' },
                        {
                            quizMode: 'scheduled',
                            scheduledStart: { $lte: now },
                            scheduledEnd: { $gte: now },
                        },
                        {
                            quizMode: { $exists: false },
                            $or: [
                                { scheduledEnd: { $gte: now } },
                                { scheduledEnd: null },
                            ],
                        },
                    ],
                },
            ],
        })
            .select('-questions')
            .sort('-createdAt');

        res.json(quizzes);
    } catch (error) {
        next(error);
    }
};

// ── POST /api/quiz/:id/questions  (admin) ──────────────────
exports.addQuestion = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        const question = await Question.create({ ...req.body, quiz: quiz._id });

        quiz.questions.push(question._id);
        quiz.totalMarks += question.marks || 1;
        await quiz.save();

        res.status(201).json(question);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/quiz/:id/questions ────────────────────────────
exports.getQuestions = async (req, res, next) => {
    try {
        const questions = await Question.find({ quiz: req.params.id });
        res.json(questions);
    } catch (error) {
        next(error);
    }
};

// ── DELETE /api/quiz/question/:questionId  (admin) ─────────
exports.deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        await Quiz.findByIdAndUpdate(question.quiz, {
            $pull: { questions: question._id },
            $inc: { totalMarks: -(question.marks || 1) },
        });
        await question.deleteOne();

        res.json({ message: 'Question deleted' });
    } catch (error) {
        next(error);
    }
};
//
