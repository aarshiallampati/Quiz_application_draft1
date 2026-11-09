import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);
            navigate(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow-lg border-0" style={{ maxWidth: 440, width: '100%' }}>
                <div className="card-body p-4 p-md-5">
                    {/* Branding */}
                    <div className="text-center mb-4">
                        <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                            style={{ width: 60, height: 60 }}>
                            <i className="bi bi-mortarboard-fill fs-3"></i>
                        </div>
                        <h3 className="fw-bold">EduQuiz Pro</h3>
                        <p className="text-muted small">AI-Powered College Quiz Platform</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger py-2 small" role="alert">
                            <i className="bi bi-exclamation-circle me-1"></i>{error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email address</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-control"
                                    placeholder="you@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="input-group">
                                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                                <input
                                    id="password"
                                    type="password"
                                    className="form-control"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Signing in…
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-muted small mt-4 mb-0">
                        Don&apos;t have an account? <a href="/register" className="text-primary">Create one</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
