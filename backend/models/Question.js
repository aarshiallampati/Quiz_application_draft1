const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
    {
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
        },
        text: {
            type: String,
            required: [true, 'Question text is required'],
        },
        type: {
            type: String,
            enum: ['MCQ', 'MSQ', 'TrueFalse', 'ShortAnswer', 'FillBlank'],
            default: 'MCQ',
        },
        options: [
            {
                text: { type: String, required: true },
                isCorrect: { type: Boolean, default: false },
            },
        ],
        explanation: {
            type: String,
        },
        concept: {
            type: String,
            trim: true,
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },
        subject: {
            type: String,
            trim: true,
        },
        marks: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('Question', questionSchema);
