const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
        },
        answers: [
            {
                question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
                selectedOptions: [Number],
                textAnswer: String,
                isCorrect: Boolean,
                marksAwarded: { type: Number, default: 0 },
                timeTaken: { type: Number, default: 0 }, // seconds per question
            },
        ],
        score: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        passed: { type: Boolean, default: false },
        timeTaken: { type: Number }, // total seconds
        startedAt: { type: Date, default: Date.now },
        submittedAt: { type: Date },
        status: {
            type: String,
            enum: ['in-progress', 'submitted', 'graded'],
            default: 'in-progress',
        },
        // AI analysis after submission
        aiAnalysis: [
            {
                question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
                concept: String,
                whyWrong: String,
                correctExplanation: String,
                studyTip: String,
                youtubeLinks: [{ title: String, url: String }],
            },
        ],
        reportUrl: String, // path to generated PDF
    },
    { timestamps: true },
);

module.exports = mongoose.model('Submission', submissionSchema);
