const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const { analyzeWrongAnswers } = require('../services/aiService');
const { generateResultPDF } = require('../services/pdfService');
const { sendEmail } = require('../services/emailService');

// ── POST /api/submission/start/:quizId ─────────────────────
exports.startQuiz = async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.quizId).populate('questions');
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Check max attempts
        const attempts = await Submission.countDocuments({
            student: req.user._id,
            quiz: quiz._id,
            status: { $in: ['submitted', 'graded'] },
        });
        if (attempts >= quiz.maxAttempts) {
            return res.status(400).json({ message: 'Maximum attempts reached' });
        }

        // Resume or create attempt
        let submission = await Submission.findOne({
            student: req.user._id,
            quiz: quiz._id,
            status: 'in-progress',
        });
        if (!submission) {
            submission = await Submission.create({
                student: req.user._id,
                quiz: quiz._id,
                startedAt: new Date(),
            });
        }

        res.json({
            submissionId: submission._id,
            quiz: {
                _id: quiz._id,
                title: quiz.title,
                duration: quiz.duration,
                totalMarks: quiz.totalMarks,
                shuffleQuestions: quiz.shuffleQuestions,
                questions: (() => {
                    let qs = quiz.questions.map((q) => ({
                        _id: q._id,
                        text: q.text,
                        questionText: q.text,
                        type: q.type,
                        options: q.options.map((o) => o.text),
                        marks: q.marks,
                    }));
                    if (quiz.shuffleQuestions) {
                        for (let i = qs.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [qs[i], qs[j]] = [qs[j], qs[i]];
                        }
                    }
                    if (quiz.numberOfQuestions > 0 && quiz.numberOfQuestions < qs.length) {
                        qs = qs.slice(0, quiz.numberOfQuestions);
                    }
                    return qs;
                })(),
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/submission/submit/:quizId ────────────────────
exports.submitQuiz = async (req, res, next) => {
    try {
        const { answers: rawAnswers } = req.body;
        // Normalize answers to object format: { questionId: { selected, timeTaken } }
        let answers = {};
        if (Array.isArray(rawAnswers)) {
            rawAnswers.forEach(ans => {
                const qId = ans.question || ans.questionId;
                if (qId) {
                    answers[qId] = {
                        selected: ans.selectedOptions !== undefined ? ans.selectedOptions : ans.selected,
                        timeTaken: ans.timeTaken || 0
                    };
                }
            });
        } else {
            answers = rawAnswers || {};
        }

        const quiz = await Quiz.findById(req.params.quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        let submission = await Submission.findOne({
            student: req.user._id,
            quiz: quiz._id,
            status: 'in-progress',
        });
        if (!submission) {
            return res.status(400).json({ message: 'No active attempt found' });
        }

        const questions = await Question.find({ quiz: quiz._id });
        const totalMarks = questions.reduce((s, q) => s + (q.marks || 1), 0);

        let score = 0;
        const gradedAnswers = [];
        const wrongAnswers = [];

        for (const q of questions) {
            const qId = q._id.toString();
            const raw = answers[qId];

            // Support both { selected, timeTaken } and bare value
            let selectedRaw, timeTaken = 0;
            if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.selected !== undefined) {
                selectedRaw = raw.selected;
                timeTaken = raw.timeTaken || 0;
            } else {
                selectedRaw = raw;
            }

            let isCorrect = false;
            let marksAwarded = 0;
            let selectedOptions = [];

            if (q.type === 'MSQ') {
                // ── Partial scoring: score = correct_selected / total_correct ──
                selectedOptions = Array.isArray(selectedRaw) ? selectedRaw : [];
                const correctIndices = q.options
                    .map((o, i) => (o.isCorrect ? i : -1))
                    .filter((i) => i >= 0);

                const correctSelected = selectedOptions.filter((i) => correctIndices.includes(i)).length;
                const wrongSelected = selectedOptions.filter((i) => !correctIndices.includes(i)).length;

                if (wrongSelected === 0 && correctSelected > 0) {
                    const partial = (correctSelected / correctIndices.length) * (q.marks || 1);
                    marksAwarded = Math.round(partial * 100) / 100;
                    isCorrect = correctSelected === correctIndices.length;
                }
            } else if (q.type === 'MCQ' || q.type === 'TrueFalse') {
                // Unwrap single-element array (frontend sends selectedOptions: [index])
                const unwrapped = Array.isArray(selectedRaw) && selectedRaw.length === 1
                    ? selectedRaw[0]
                    : selectedRaw;
                const selected = typeof unwrapped === 'number' ? unwrapped : -1;
                selectedOptions = [selected];
                const correctIdx = q.options.findIndex((o) => o.isCorrect);
                isCorrect = selected === correctIdx;
                if (isCorrect) marksAwarded = q.marks || 1;
            } else {
                // ShortAnswer / FillBlank — needs manual or AI grading
                selectedOptions = [];
                isCorrect = false;
            }

            score += marksAwarded;

            gradedAnswers.push({
                question: q._id,
                selectedOptions,
                textAnswer: typeof selectedRaw === 'string' ? selectedRaw : undefined,
                isCorrect,
                marksAwarded,
                timeTaken,
            });

            if (!isCorrect) {
                wrongAnswers.push({
                    questionId: q._id,
                    questionText: q.text,
                    studentAnswer: selectedOptions,
                    correctAnswer: q.options.filter((o) => o.isCorrect).map((o) => o.text),
                    subject: q.subject || quiz.subject,
                    explanation: q.explanation,
                });
            }
        }

        const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
        const passed = percentage >= (quiz.passingScore || 40);
        const elapsed = Math.round((Date.now() - new Date(submission.startedAt).getTime()) / 1000);

        submission.answers = gradedAnswers;
        submission.score = Math.round(score * 100) / 100;
        submission.totalMarks = totalMarks;
        submission.percentage = percentage;
        submission.passed = passed;
        submission.timeTaken = elapsed;
        submission.submittedAt = new Date();
        submission.status = 'submitted';

        // ── AI analysis (async best-effort) ────────────────────
        try {
            if (wrongAnswers.length > 0) {
                const analysis = await analyzeWrongAnswers(wrongAnswers);
                if (analysis?.length) submission.aiAnalysis = analysis;
            }
        } catch (aiErr) {
            console.warn('AI analysis skipped:', aiErr.message);
        }

        await submission.save();

        // ── PDF report + email (fire-and-forget) ───────────────
        setImmediate(async () => {
            try {
                const populated = await Submission.findById(submission._id)
                    .populate('student', 'name email')
                    .populate('quiz', 'title subject')
                    .populate('answers.question', 'text options marks');

                const pdfPath = await generateResultPDF(populated);
                if (pdfPath) {
                    submission.reportUrl = pdfPath;
                    await submission.save();

                    if (populated.student?.email) {
                        // Build rich email HTML with analysis + YouTube links
                        let analysisHtml = '';
                        if (populated.aiAnalysis?.length) {
                            analysisHtml = `
                <h3 style="color:#dc3545;margin-top:24px;">📋 Wrong Answer Analysis</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                ${populated.aiAnalysis.map((a, i) => `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:12px 8px;vertical-align:top;">
                            <strong style="color:#0d6efd;">${i + 1}. ${a.concept || 'General'}</strong><br/>
                            <span style="color:#666;">Why wrong:</span> ${a.whyWrong || ''}<br/>
                            <span style="color:#198754;">✅ Correct:</span> ${a.correctExplanation || ''}<br/>
                            <span style="color:#6f42c1;">💡 Tip:</span> ${a.studyTip || ''}
                            ${a.youtubeLinks?.length ? `
                                <br/><span style="color:#dc3545;">🎥 Videos:</span>
                                ${a.youtubeLinks.map(l => `<a href="${l.url}" style="color:#0d6efd;text-decoration:underline;margin-left:4px;">${l.title}</a>`).join(' | ')}
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
                </table>`;
                        }

                        await sendEmail(
                            populated.student.email,
                            `EduQuiz Pro — Your result for "${populated.quiz.title}"`,
                            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:linear-gradient(135deg,#0d6efd,#6610f2);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                        <h1 style="color:#fff;margin:0;">EduQuiz Pro</h1>
                        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;">Quiz Result Report</p>
                    </div>
                    <div style="padding:24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;">
                        <h2 style="margin-top:0;">Hi ${populated.student.name},</h2>
                        <p>Here are your results for <strong>${populated.quiz.title}</strong>:</p>
                        <div style="background:${passed ? '#d1e7dd' : '#f8d7da'};padding:16px;border-radius:8px;text-align:center;margin:16px 0;">
                            <h1 style="margin:0;color:${passed ? '#198754' : '#dc3545'};">${percentage}%</h1>
                            <p style="margin:4px 0 0;font-size:18px;">${passed ? '✅ Passed' : '❌ Failed'}</p>
                            <p style="margin:4px 0 0;color:#666;">${score} / ${totalMarks} marks</p>
                        </div>
                        ${analysisHtml}
                        <p style="margin-top:24px;color:#666;">📎 Your detailed PDF report is attached.</p>
                    </div>
                </div>`,
                            pdfPath,
                        );
                    }
                }
            } catch (e) {
                console.warn('Report generation/email skipped:', e.message);
            }
        });

        res.json({
            attemptId: submission._id,
            score: Math.round(score * 100) / 100,
            totalMarks,
            percentage,
            passed,
            timeTaken: elapsed,
            aiAnalysis: submission.aiAnalysis || [],
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/submission/:submissionId/result ────────────────
exports.getResult = async (req, res, next) => {
    try {
        const submission = await Submission.findById(req.params.submissionId)
            .populate('quiz', 'title subject passingScore')
            .populate('student', 'name email enrollmentId')
            .populate('answers.question', 'text options explanation type marks');

        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        res.json(submission);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/submission/history ─────────────────────────────
exports.getHistory = async (req, res, next) => {
    try {
        const submissions = await Submission.find({
            student: req.user._id,
            status: { $in: ['submitted', 'graded'] },
        })
            .populate('quiz', 'title subject')
            .sort('-submittedAt');
        res.json(submissions);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/submission/quiz/:quizId/results  (admin) ──────
exports.getQuizResults = async (req, res, next) => {
    try {
        const submissions = await Submission.find({
            quiz: req.params.quizId,
            status: { $in: ['submitted', 'graded'] },
        })
            .populate('student', 'name email enrollmentId')
            .sort('-percentage');
        res.json(submissions);
    } catch (error) {
        next(error);
    }
};
// ── GET /api/submission/latest/result (student) ─────────────
exports.getLatestResult = async (req, res, next) => {
    try {
        const submission = await Submission.findOne({
            student: req.user._id,
            status: { $in: ['submitted', 'graded'] },
        })
            .populate('quiz', 'title subject passingScore')
            .populate('student', 'name email enrollmentId')
            .populate('answers.question', 'text options explanation type marks')
            .sort('-submittedAt');

        if (!submission) return res.status(404).json({ message: 'No submissions found' });

        res.json(submission);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/submission/all  (admin) ────────────────────────
exports.getAllResults = async (req, res, next) => {
    try {
        const submissions = await Submission.find({
            status: { $in: ['submitted', 'graded'] },
        })
            .populate('student', 'name email enrollmentId')
            .populate('quiz', 'title subject')
            .sort('-submittedAt')
            .limit(100);
        res.json(submissions);
    } catch (error) {
        next(error);
    }
};
