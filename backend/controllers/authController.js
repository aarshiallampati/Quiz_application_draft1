const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// ── POST /api/auth/register ────────────────────────────────
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, enrollmentId, department, semester } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student',
            enrollmentId,
            department,
            semester,
        });

        const token = generateToken(user._id, user.role);

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                enrollmentId: user.enrollmentId,
                department: user.department,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/auth/login ───────────────────────────────────
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                enrollmentId: user.enrollmentId,
                department: user.department,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/auth/me ───────────────────────────────────────
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

// ── PUT /api/auth/change-password ──────────────────────────
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new passwords are required' });
        }

        const user = await User.findById(req.user._id).select('+password');

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/auth/students  (admin) ───────────────────────
exports.getStudents = async (req, res, next) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('-password')
            .sort('-createdAt');
        res.json(students);
    } catch (error) {
        next(error);
    }
};
