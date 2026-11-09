import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import QuizCard from '../../components/QuizCard';
import RadarChart from '../../components/RadarChart';
import LineChart from '../../components/LineChart';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [history, setHistory] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [quizzes, historyData, stats] = await Promise.all([
                    quizService.fetchQuizzes(),
                    quizService.getHistory(),
                    quizService.getStudentAnalytics(user._id)
                ]);
                setAvailableQuizzes(quizzes);
                setHistory(historyData);
                setAnalytics(stats);
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user?._id) {
            loadData();
        }
    }, [user?._id]);

    // Categorize Quizzes
    const categorized = useMemo(() => {
        const completedIds = new Set(history.map(h => h.quiz?._id));
        const now = new Date();

        return {
            active: availableQuizzes.filter(q => !completedIds.has(q._id)),
            completed: history.slice(0, 5), // Show last 5 completed
            upcoming: availableQuizzes.filter(q => q.quizMode === 'scheduled' && new Date(q.scheduledStart) > now)
        };
    }, [availableQuizzes, history]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container-fluid py-4 px-3 px-lg-4">

            {/* 1. WELCOME CARD */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm overflow-hidden">
                        <div className="card-body p-0">
                            <div className="row g-0">
                                <div className="col-lg-8">
                                    <div className="p-4 p-lg-5"
                                        style={{
                                            background: 'linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)',
                                            color: '#fff',
                                            minHeight: 200,
                                        }}>
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{ width: 64, height: 64 }}>
                                                <span className="fs-2 fw-bold">{(user?.name || 'S')[0].toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <h2 className="fw-bold mb-1">Welcome back, {user?.name || 'Student'}! 👋</h2>
                                                <p className="mb-0 opacity-75">
                                                    {user?.department} | Semester {user?.semester}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="row g-3 mt-4">
                                            {[
                                                { icon: 'bi-person-badge', label: 'Enrollment ID', value: user?.enrollmentId || 'N/A' },
                                                { icon: 'bi-trophy', label: 'Average Score', value: `${analytics?.averageScore || 0}%` },
                                                { icon: 'bi-journal-check', label: 'Quizzes Taken', value: analytics?.totalQuizzes || 0 },
                                                { icon: 'bi-star-fill', label: 'Best Score', value: history.length ? `${Math.max(...history.map(h => h.percentage))}%` : '0%' },
                                            ].map((stat, i) => (
                                                <div className="col-6 col-md-3" key={i}>
                                                    <div className="bg-white bg-opacity-10 rounded-3 p-3 text-center">
                                                        <i className={`bi ${stat.icon} fs-4`}></i>
                                                        <h5 className="fw-bold mt-1 mb-0">{stat.value}</h5>
                                                        <small className="opacity-75" style={{ fontSize: '0.75rem' }}>{stat.label}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4 d-flex">
                                    <div className="p-4 d-flex flex-column justify-content-center gap-3 w-100 bg-white">
                                        <h6 className="fw-semibold text-muted mb-0">
                                            <i className="bi bi-lightning-charge-fill text-warning me-1"></i>Quick Actions
                                        </h6>
                                        <Link to="/student/quizzes" className="btn btn-primary d-flex align-items-center gap-2">
                                            <i className="bi bi-play-circle-fill"></i> Browse Quizzes
                                        </Link>
                                        <Link to="/student/history" className="btn btn-outline-secondary d-flex align-items-center gap-2">
                                            <i className="bi bi-clock-history"></i> View History
                                        </Link>
                                        <Link to="/student/profile" className="btn btn-outline-info d-flex align-items-center gap-2">
                                            <i className="bi bi-person-gear"></i> Edit Profile
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ACTIVE / AVAILABLE QUIZZES */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">
                    <i className="bi bi-play-circle me-2 text-primary"></i>Available Quizzes
                </h5>
                <Link to="/student/quizzes" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>

            <div className="row g-3 mb-4">
                {categorized.active.length > 0 ? (
                    categorized.active.map((quiz) => (
                        <div className="col-md-6 col-xl-4" key={quiz._id}>
                            <QuizCard quiz={quiz} />
                        </div>
                    ))
                ) : (
                    <div className="col-12 py-4 text-center bg-light rounded-3">
                        <p className="text-muted mb-0">No new quizzes available for your class.</p>
                    </div>
                )}
            </div>

            {/* 3. RECENT COMPLETED */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent d-flex justify-content-between align-items-center pt-3">
                            <h5 className="fw-bold mb-0">
                                <i className="bi bi-clipboard-check me-2 text-success"></i>Recent Completed
                            </h5>
                            <Link to="/student/history" className="btn btn-sm btn-outline-primary">Full History</Link>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="ps-4">Quiz Name</th>
                                            <th>Score</th>
                                            <th>Result</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categorized.completed.length > 0 ? (
                                            categorized.completed.map((r, i) => (
                                                <tr key={i}>
                                                    <td className="ps-4">
                                                        <div className="fw-semibold">{r.quiz?.title}</div>
                                                        <small className="text-muted">{r.quiz?.subject}</small>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="progress flex-grow-1" style={{ height: 7, width: 80 }}>
                                                                <div
                                                                    className={`progress-bar bg-${r.percentage >= 40 ? 'success' : 'danger'}`}
                                                                    style={{ width: `${r.percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="small fw-semibold">{r.percentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${r.passed ? 'success' : 'danger'} bg-opacity-10 text-${r.passed ? 'success' : 'danger'} px-3 py-1`}>
                                                            <i className={`bi ${r.passed ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                                                            {r.passed ? 'Passed' : 'Failed'}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted small">
                                                        {new Date(r.submittedAt).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-muted">No completed quizzes yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. PERFORMANCE CHARTS */}
            {analytics && (
                <div className="row g-4 mb-4">
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                {(() => {
                                    const subjectData = analytics.weakConcepts.reduce((acc, curr) => ({ ...acc, [curr.subject]: curr.averageScore }), {});
                                    return (
                                        <RadarChart
                                            labels={Object.keys(subjectData)}
                                            scores={Object.values(subjectData)}
                                            title="Subject Performance"
                                        />
                                    );
                                })()}
                                {analytics.weakConcepts.length === 0 && <p className="text-center text-muted small mt-2">Finish more quizzes to see analysis.</p>}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <LineChart
                                    labels={analytics.improvementTrend.map(t => `Quiz ${t.index}`)}
                                    scores={analytics.improvementTrend.map(t => t.actual)}
                                    title="Score Improvement Trend"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. AI INSIGHT CARD */}
            {analytics?.weakConcepts?.length > 0 && (
                <div className="row mb-2">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm"
                            style={{
                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                borderLeft: '4px solid #6610f2',
                            }}>
                            <div className="card-body p-4">
                                <div className="d-flex align-items-start gap-3">
                                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                        style={{ width: 50, height: 50 }}>
                                        <i className="bi bi-stars fs-4 text-primary"></i>
                                    </div>
                                    <div>
                                        <h6 className="fw-bold mb-1">
                                            <i className="bi bi-robot me-1 text-primary"></i>AI Study Insight
                                        </h6>
                                        <p className="mb-2">
                                            You are doing great in some areas, but consider focusing on these subjects where your average is below 60%.
                                        </p>
                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            {analytics.weakConcepts.map((wc, i) => (
                                                <span key={i} className="badge bg-danger bg-opacity-10 text-danger">
                                                    <i className="bi bi-arrow-down-circle me-1"></i>{wc.subject} — {wc.averageScore}%
                                                </span>
                                            ))}
                                        </div>
                                        <small className="text-muted">
                                            <i className="bi bi-lightbulb me-1"></i>
                                            <strong>Tip:</strong> Review the incorrectly answered questions in your recent attempts to understand the concepts better.
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
