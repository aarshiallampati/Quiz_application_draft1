import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const sidebarLinks = [
    { path: '/admin/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
    { path: '/admin/quizzes', icon: 'bi-journal-text', label: 'Manage Quizzes' },
    { path: '/admin/quizzes/create', icon: 'bi-plus-circle', label: 'Create Quiz' },
    { path: '/admin/results', icon: 'bi-bar-chart', label: 'Results' },
    { path: '/admin/proctor', icon: 'bi-shield-check', label: 'Proctoring' },
    { path: '/admin/students', icon: 'bi-people', label: 'Students' },
    { path: '/admin/analytics', icon: 'bi-graph-up', label: 'Analytics' },
];

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className="d-flex min-vh-100">
            {/* Sidebar */}
            <aside className="bg-dark text-white d-flex flex-column" style={{ width: 250, minHeight: '100vh' }}>
                <div className="p-3 border-bottom border-secondary">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-mortarboard-fill text-primary"></i>
                        EduQuiz Pro
                    </h5>
                    <small className="text-muted">Admin Panel</small>
                </div>

                <nav className="flex-grow-1 py-2">
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`d-flex align-items-center gap-2 px-3 py-2 text-decoration-none ${location.pathname === link.path
                                    ? 'bg-primary text-white'
                                    : 'text-white-50 sidebar-link'
                                }`}
                        >
                            <i className={`bi ${link.icon}`}></i>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="border-top border-secondary p-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 32, height: 32 }}>
                            <span className="fw-bold small">{(user?.name || 'A')[0].toUpperCase()}</span>
                        </div>
                        <div className="small">
                            <div className="fw-semibold">{user?.name || 'Admin'}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user?.email}</div>
                        </div>
                    </div>
                    <button className="btn btn-outline-light btn-sm w-100" onClick={logout}>
                        <i className="bi bi-box-arrow-right me-1"></i>Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-grow-1 bg-light overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
