import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import PerformanceChart from '../../components/PerformanceChart';
import LineChart from '../../components/LineChart';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminOverview() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await quizService.getOverviewAnalytics();
                setData(res);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (!data) return null;

    const { overview = {}, quizScores = { labels: [], scores: [] }, monthlyAttempts = { labels: [], scores: [] } } = data;

    return (
        <div className="container-fluid py-4 px-3 px-lg-4">
            {/* ── Header ───────────────────────────────────────── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0">Admin Dashboard</h3>
                    <p className="text-muted mb-0 small">Welcome back — here's what's happening on the platform</p>
                </div>
                <Link to="/admin/quizzes/create" className="btn btn-primary shadow-sm border-0 d-flex align-items-center gap-2 px-3">
                    <i className="bi bi-plus-lg"></i>
                    <span className="d-none d-sm-inline">Create Quiz</span>
                </Link>
            </div>

            {/* ═══════════════════════════════════════════════════
          STATS CARDS
         ═══════════════════════════════════════════════════ */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Total Quizzes', value: overview.totalQuizzes, icon: 'bi-journal-text', color: 'primary' },
                    { label: 'Total Students', value: overview.totalStudents, icon: 'bi-people-fill', color: 'info' },
                    { label: 'Total Attempts', value: overview.totalAttempts, icon: 'bi-send-check-fill', color: 'success' },
                    { label: 'Average Score', value: `${overview.avgScore}%`, icon: 'bi-award-fill', color: 'warning' },
                ].map((stat, i) => (
                    <div className="col-6 col-xl-3" key={i}>
                        <div className="card border-0 shadow-sm h-100 transition-hover">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted small mb-1">{stat.label}</p>
                                        <h2 className="fw-bold mb-0">{stat.value}</h2>
                                    </div>
                                    <div className={`bg-${stat.color} bg-opacity-10 rounded-3 d-flex align-items-center justify-content-center`}
                                        style={{ width: 50, height: 50 }}>
                                        <i className={`bi ${stat.icon} fs-4 text-${stat.color}`}></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════
          CHARTS ROW
         ═══════════════════════════════════════════════════ */}
            <div className="row g-4 mb-4">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 px-4">
                            <h6 className="fw-bold mb-0">Performance by Subject</h6>
                            <small className="text-muted">Average scores across categorized topics</small>
                        </div>
                        <div className="card-body p-4">
                            {quizScores.labels.length > 0 ? (
                                <PerformanceChart
                                    labels={quizScores.labels}
                                    scores={quizScores.scores}
                                />
                            ) : (
                                <div className="text-center py-5 text-muted opacity-50 italic">No grading data available yet.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 px-4">
                            <h6 className="fw-bold mb-0">System Participation</h6>
                            <small className="text-muted">Submission count (Last 7 Days)</small>
                        </div>
                        <div className="card-body p-4">
                            {monthlyAttempts.labels.length > 0 ? (
                                <LineChart
                                    labels={monthlyAttempts.labels}
                                    scores={monthlyAttempts.scores}
                                />
                            ) : (
                                <div className="text-center py-5 text-muted opacity-50 italic">Waiting for new attempts...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
          QUICK ACTIONS
         ═══════════════════════════════════════════════════ */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-0">
                    <h6 className="fw-bold mb-0">
                        <i className="bi bi-lightning-charge-fill text-warning me-2"></i>Quick Navigation
                    </h6>
                </div>
                <div className="card-body p-4">
                    <div className="row g-3">
                        {[
                            { to: '/admin/quizzes/create', color: 'primary', icon: 'bi-plus-circle-fill', title: 'New Quiz', desc: 'Create and publish' },
                            { to: '/admin/results', color: 'success', icon: 'bi-bar-chart-fill', title: 'Results', desc: 'Review scores' },
                            { to: '/admin/students', color: 'info', icon: 'bi-people-fill', title: 'Students', desc: 'View directory' },
                            { to: '/admin/proctor', color: 'danger', icon: 'bi-shield-check', title: 'Proctoring', desc: 'Audit sessions' },
                        ].map((action, i) => (
                            <div className="col-sm-6 col-md-3" key={i}>
                                <Link to={action.to} className="btn btn-outline-light border text-start w-100 p-3 h-100 transition-hover">
                                    <div className={`bg-${action.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3`}
                                        style={{ width: 45, height: 45 }}>
                                        <i className={`bi ${action.icon} fs-5 text-${action.color}`}></i>
                                    </div>
                                    <div className="fw-bold text-dark">{action.title}</div>
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{action.desc}</small>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .transition-hover:hover {
                    transform: translateY(-5px);
                    transition: transform 0.2s ease;
                    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.08) !important;
                }
                .btn-outline-light:hover {
                    background-color: #f8f9fa !important;
                    border-color: #dee2e6 !important;
                }
            `}</style>
        </div>
    );
}
