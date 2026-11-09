import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const isAdmin = user.role === 'admin';
    const basePath = isAdmin ? '/admin' : '/student';

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
            <div className="container-fluid">
                <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to={`${basePath}/dashboard`}>
                    <i className="bi bi-mortarboard-fill fs-4"></i>
                    EduQuiz Pro
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mainNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="mainNav">
                    {/* Student nav links */}
                    {!isAdmin && (
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <Link className="nav-link" to="/student/dashboard">
                                    <i className="bi bi-speedometer2 me-1"></i>Dashboard
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/student/quizzes">
                                    <i className="bi bi-journal-text me-1"></i>Quizzes
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/student/history">
                                    <i className="bi bi-clock-history me-1"></i>History
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/student/profile">
                                    <i className="bi bi-person me-1"></i>Profile
                                </Link>
                            </li>
                        </ul>
                    )}

                    {/* Right-side user dropdown */}
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item dropdown">
                            <button
                                className="btn nav-link dropdown-toggle d-flex align-items-center gap-2"
                                data-bs-toggle="dropdown"
                            >
                                <span className="badge bg-light text-primary text-capitalize">{user.role}</span>
                                {user.name || user.email}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <Link className="dropdown-item" to={`${basePath}/dashboard`}>
                                        <i className="bi bi-speedometer2 me-2"></i>Dashboard
                                    </Link>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                                    </button>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
