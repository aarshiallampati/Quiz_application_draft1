const Submission = require('../models/Submission');
const Question = require('../models/Question');
const User = require('../models/User');

// ── GET /api/analytics/quiz/:quizId ────────────────────────
exports.getQuizAnalytics = async (req, res, next) => {
    try {
        const submissions = await Submission.find({
            quiz: req.params.quizId,
            status: { $in: ['submitted', 'graded'] },
        });

        if (!submissions.length) {
            return res.json({
                totalSubmissions: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                passRate: 0,
            });
        }

        const scores = submissions.map((s) => s.percentage);
        const passed = submissions.filter((s) => s.passed).length;

        res.json({
            totalSubmissions: submissions.length,
            averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            passRate: Math.round((passed / submissions.length) * 100),
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/analytics/question/:quizId ────────────────────
exports.getQuestionAnalytics = async (req, res, next) => {
    try {
        const submissions = await Submission.find({
            quiz: req.params.quizId,
            status: { $in: ['submitted', 'graded'] },
        }).populate('answers.question', 'text options');

        const questions = await Question.find({ quiz: req.params.quizId });
        const analytics = [];

        for (const q of questions) {
            const qId = q._id.toString();
            const relevant = [];

            for (const sub of submissions) {
                const ans = sub.answers.find((a) => a.question?._id?.toString() === qId || a.question?.toString() === qId);
                if (ans) relevant.push(ans);
            }

            const total = relevant.length || 1;
            const correct = relevant.filter((a) => a.isCorrect).length;

            // Find most common wrong answer
            const wrongCounts = {};
            relevant
                .filter((a) => !a.isCorrect)
                .forEach((a) => {
                    const key = JSON.stringify(a.selectedOptions);
                    wrongCounts[key] = (wrongCounts[key] || 0) + 1;
                });

            let mostCommonWrongAnswer = null;
            let maxCount = 0;
            for (const [key, count] of Object.entries(wrongCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    mostCommonWrongAnswer = JSON.parse(key);
                }
            }

            // Average time per question
            const avgTime = relevant.length
                ? Math.round(relevant.reduce((s, a) => s + (a.timeTaken || 0), 0) / relevant.length)
                : 0;

            analytics.push({
                questionId: q._id,
                questionText: q.text,
                correctPercentage: Math.round((correct / total) * 100),
                mostCommonWrongAnswer,
                averageTime: avgTime,
                totalAttempts: relevant.length,
            });
        }

        res.json(analytics);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/analytics/student/:studentId ──────────────────
exports.getStudentAnalytics = async (req, res, next) => {
    try {
        const studentId = req.params.studentId;
        const student = await User.findById(studentId).select('name email department');

        const submissions = await Submission.find({
            student: studentId,
            status: { $in: ['submitted', 'graded'] },
        })
            .populate('quiz', 'title subject')
            .sort('submittedAt');

        // Score history
        const scoreHistory = submissions.map((s) => ({
            quizId: s.quiz?._id,
            quizTitle: s.quiz?.title,
            subject: s.quiz?.subject,
            percentage: s.percentage,
            passed: s.passed,
            date: s.submittedAt,
        }));

        // Improvement trend (moving average of last 5)
        const trend = [];
        for (let i = 0; i < scoreHistory.length; i++) {
            const window = scoreHistory.slice(Math.max(0, i - 4), i + 1);
            const avg = Math.round(window.reduce((s, x) => s + x.percentage, 0) / window.length);
            trend.push({ index: i + 1, movingAvg: avg, actual: scoreHistory[i].percentage });
        }

        // Weak concepts — subjects where avg < 60%
        const subjectScores = {};
        submissions.forEach((s) => {
            const subj = s.quiz?.subject || 'General';
            if (!subjectScores[subj]) subjectScores[subj] = [];
            subjectScores[subj].push(s.percentage);
        });

        const weakConcepts = [];
        for (const [subject, scores] of Object.entries(subjectScores)) {
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            if (avg < 60) weakConcepts.push({ subject, averageScore: avg });
        }

        res.json({
            student,
            totalQuizzes: submissions.length,
            averageScore: submissions.length
                ? Math.round(submissions.reduce((s, x) => s + x.percentage, 0) / submissions.length)
                : 0,
            scoreHistory,
            improvementTrend: trend,
            weakConcepts,
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/analytics/overview ─────────────────────────────
exports.getOverviewAnalytics = async (req, res, next) => {
    try {
        const { department, semester } = req.query;
        let studentFilter = {};
        if (department) studentFilter.department = department;
        if (semester) studentFilter.semester = Number(semester);

        // Find relevant students first
        const students = await User.find(studentFilter).select('_id');
        const studentIds = students.map((s) => s._id);

        const matchQuery = {
            student: { $in: studentIds },
            status: { $in: ['submitted', 'graded'] },
        };

        const [submissions, totalQuizzes, totalStudents] = await Promise.all([
            Submission.find(matchQuery).populate('quiz', 'subject'),
            require('../models/Quiz').countDocuments(),
            User.countDocuments({ role: 'student' }),
        ]);

        const totalAttempts = submissions.length;
        const avgScore = totalAttempts
            ? Math.round(submissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / totalAttempts)
            : 0;

        // Subject-wise stats
        const subjectScores = {};
        const quizMap = {}; // quizId -> { title, subject, scores: [] }

        submissions.forEach((s) => {
            const subj = s.quiz?.subject || 'General';
            if (!subjectScores[subj]) subjectScores[subj] = [];
            subjectScores[subj].push(s.percentage);

            if (s.quiz) {
                const qId = s.quiz._id.toString();
                if (!quizMap[qId]) {
                    quizMap[qId] = {
                        title: s.quiz.title,
                        subject: s.quiz.subject,
                        scores: [],
                    };
                }
                quizMap[qId].scores.push(s.percentage);
            }
        });

        const quizScores = {
            labels: Object.keys(subjectScores),
            scores: Object.keys(subjectScores).map((s) => {
                const scores = subjectScores[s];
                return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            }),
        };

        const quizDetails = Object.values(quizMap).map((q) => ({
            title: q.title,
            subject: q.subject,
            avgScore: Math.round(q.scores.reduce((a, b) => a + b, 0) / q.scores.length),
            totalAttempts: q.scores.length,
        }));

        // Monthly/Weekly participation (last 7 days for now as trend)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const dailyAttempts = last7Days.map((date) => {
            const count = submissions.filter((s) => s.submittedAt?.toISOString().split('T')[0] === date).length;
            return count;
        });

        res.json({
            overview: {
                totalQuizzes,
                totalStudents,
                totalAttempts,
                avgScore,
            },
            quizScores,
            quizDetails,
            monthlyAttempts: {
                labels: last7Days.map(d => d.split('-').slice(1).join('/')), // MM/DD
                scores: dailyAttempts,
            },
        });
    } catch (error) {
        next(error);
    }
};
