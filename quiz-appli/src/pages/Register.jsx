import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        enrollmentId: '',
        department: '',
        semester: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const userData = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                enrollmentId: form.enrollmentId || undefined,
                department: form.department || undefined,
                semester: form.semester ? Number(form.semester) : undefined,
            };
            const user = await register(userData);
            navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-4">
            <div className="card shadow-lg border-0" style={{ maxWidth: 520, width: '100%' }}>
                <div className="card-body p-4 p-md-5">
                    {/* Branding */}
                    <div className="text-center mb-4">
                        <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: 60, height: 60 }}>
                            <i className="bi bi-mortarboard-fill fs-3"></i>
                        </div>
                        <h3 className="fw-bold">Create Account</h3>
                        <p className="text-muted small">Join EduQuiz Pro</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger py-2 small" role="alert">
                            <i className="bi bi-exclamation-circle me-1"></i>{error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Full Name *</label>
                            <input type="text" className="form-control" name="name" value={form.name}
                                onChange={handleChange} required placeholder="John Doe" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Email *</label>
                            <input type="email" className="form-control" name="email" value={form.email}
                                onChange={handleChange} required placeholder="you@college.edu" />
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <label className="form-label">Password *</label>
                                <input type="password" className="form-control" name="password" value={form.password}
                                    onChange={handleChange} required placeholder="Min 6 characters" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Confirm Password *</label>
                                <input type="password" className="form-control" name="confirmPassword" value={form.confirmPassword}
                                    onChange={handleChange} required placeholder="Re-enter password" />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Role</label>
                            <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                                <option value="student">Student</option>
                                <option value="admin">Admin / Faculty</option>
                            </select>
                        </div>

                        {form.role === 'student' && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Enrollment ID</label>
                                    <input type="text" className="form-control" name="enrollmentId" value={form.enrollmentId}
                                        onChange={handleChange} placeholder="e.g. 2023CSE001" />
                                </div>
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Department</label>
                                        <input type="text" className="form-control" name="department" value={form.department}
                                            onChange={handleChange} placeholder="e.g. CSE" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Semester</label>
                                        <input type="number" className="form-control" name="semester" min={1} max={10}
                                            value={form.semester} onChange={handleChange} placeholder="e.g. 4" />
                                    </div>
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                            {loading ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Creating account…</>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-muted small mt-4 mb-0">
                        Already have an account? <Link to="/login" className="text-primary">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
