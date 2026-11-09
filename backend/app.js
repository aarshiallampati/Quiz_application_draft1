const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const proctorRoutes = require('./routes/proctorRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Core middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploaded snapshots, reports)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/analytics', analyticsRoutes);


app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});


app.use(errorHandler);

module.exports = app;
