const mongoose = require('mongoose');

const proctorLogSchema = new mongoose.Schema(
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
        submission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Submission',
            required: true,
        },
        events: [
            {
                type: {
                    type: String,
                    enum: [
                        'tab_switch',
                        'fullscreen_exit',
                        'window_blur',
                        'copy_paste_attempt',
                        'face_not_detected',
                        'multiple_faces',
                    ],
                    required: true,
                },
                timestamp: { type: Date, default: Date.now },
                severity: {
                    type: String,
                    enum: ['low', 'medium', 'high'],
                    default: 'medium',
                },
                details: String,
            },
        ],
        snapshots: [
            {
                image: String, // base64 or file URL
                timestamp: { type: Date, default: Date.now },
            },
        ],
        severityScore: {
            type: Number,
            default: 0,
        },
        recommendation: {
            type: String,
            enum: ['none', 'review', 'flag', 'disqualify'],
            default: 'none',
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('ProctorLog', proctorLogSchema);
