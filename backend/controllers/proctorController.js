const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ProctorLog = require('../models/ProctorLog');

// ── Multer setup for snapshot uploads ──────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads', 'snapshots');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = `${req.user._id}_${Date.now()}${path.extname(file.originalname || '.jpg')}`;
        cb(null, unique);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    },
});

exports.uploadMiddleware = upload.single('snapshot');

// Severity weights
const SEVERITY_WEIGHTS = {
    tab_switch: 3,
    fullscreen_exit: 4,
    window_blur: 2,
    copy_paste_attempt: 3,
    face_not_detected: 5,
    multiple_faces: 5,
};

const Submission = require('../models/Submission');

// ── helper: get or create log ──────────────────────────────
async function getOrCreateLog(req, submissionId) {
    let log = await ProctorLog.findOne({ submission: submissionId });
    if (!log) {
        let quizId = req.body.quizId;
        if (!quizId) {
            const sub = await Submission.findById(submissionId);
            quizId = sub ? sub.quiz : null;
        }
        log = await ProctorLog.create({
            student: req.user._id,
            quiz: quizId,
            submission: submissionId,
        });
    }
    return log;
}

function recalculate(log) {
    log.severityScore = log.events.reduce((sum, e) => sum + (SEVERITY_WEIGHTS[e.type] || 1), 0);

    if (log.severityScore >= 20) log.recommendation = 'disqualify';
    else if (log.severityScore >= 12) log.recommendation = 'flag';
    else if (log.severityScore >= 5) log.recommendation = 'review';
    else log.recommendation = 'none';
}

// ── POST /api/proctor/log-event ────────────────────────────
exports.logEvent = async (req, res, next) => {
    try {
        const { submissionId, type, timestamp, severity, details } = req.body;
        const log = await getOrCreateLog(req, submissionId);

        log.events.push({
            type,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            severity: severity || (SEVERITY_WEIGHTS[type] >= 4 ? 'high' : 'medium'),
            details,
        });

        recalculate(log);
        await log.save();

        res.json({
            message: 'Event logged',
            severityScore: log.severityScore,
            recommendation: log.recommendation,
        });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/proctor/snapshot ──────────────────────────────
// Supports both multer file upload AND base64 body
exports.uploadSnapshot = async (req, res, next) => {
    try {
        const { submissionId, image } = req.body;
        const log = await getOrCreateLog(req, submissionId);

        let imageUrl;
        if (req.file) {
            // Multer file upload
            imageUrl = `/uploads/snapshots/${req.file.filename}`;
        } else if (image) {
            // Base64 fallback — save to disk
            const filename = `${req.user._id}_${Date.now()}.jpg`;
            const filePath = path.join(uploadsDir, filename);
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            imageUrl = `/uploads/snapshots/${filename}`;
        } else {
            return res.status(400).json({ message: 'No image provided' });
        }

        log.snapshots.push({ image: imageUrl, timestamp: new Date() });
        await log.save();

        res.json({ message: 'Snapshot saved', totalSnapshots: log.snapshots.length });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/proctor/session/:submissionId ──────────────────
exports.getSession = async (req, res, next) => {
    try {
        const log = await ProctorLog.findOne({ submission: req.params.submissionId })
            .populate('student', 'name email enrollmentId')
            .populate('quiz', 'title');

        if (!log) return res.status(404).json({ message: 'No proctor logs found' });
        res.json(log);
    } catch (error) {
        next(error);
    }
};

// ── GET /api/proctor/dashboard  (admin) ────────────────────
exports.getDashboard = async (req, res, next) => {
    try {
        const logs = await ProctorLog.find()
            .populate('student', 'name email')
            .populate('quiz', 'title')
            .sort('-updatedAt')
            .limit(50);

        const flagged = logs.filter((l) => ['flag', 'disqualify'].includes(l.recommendation));

        res.json({ totalSessions: logs.length, flaggedCount: flagged.length, logs });
    } catch (error) {
        next(error);
    }
};
