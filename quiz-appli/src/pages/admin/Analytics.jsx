import { useEffect, useState, useCallback } from 'react';
import quizService from '../../services/quizService';
import PerformanceChart from '../../components/PerformanceChart';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        department: '',
        semester: '',
    });

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        try {
            const res = await quizService.getOverviewAnalytics(filters);
            setData(res);
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (loading && !data) return <LoadingSpinner />;

    const { overview = {}, quizScores = { labels: [], scores: [] }, monthlyAttempts = { labels: [], scores: [] } } = data || {};

    return (
        <div className="container-fluid py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
                <h3 className="fw-bold mb-0">
                    <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
                    Performance Analytics
                </h3>

                <div className="d-flex gap-2">
                    <select
                        className="form-select form-select-sm shadow-sm border-0"
                        name="department"
                        value={filters.department}
                        onChange={handleFilterChange}
                        style={{ width: '150px' }}
                    >
                        <option value="">All Departments</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Civil">Civil</option>
                    </select>

                    <select
                        className="form-select form-select-sm shadow-sm border-0"
                        name="semester"
                        value={filters.semester}
                        onChange={handleFilterChange}
                        style={{ width: '130px' }}
                    >
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </select>

                    <button className="btn btn-sm btn-light shadow-sm border-0" onClick={loadAnalytics} title="Refresh Data">
                        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                    </button>
                </div>
            </div>

            {/* Overview cards */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Total Quizzes', value: overview.totalQuizzes || 0, color: 'primary', icon: 'bi-journal-text' },
                    { label: 'Verified Students', value: overview.totalStudents || 0, color: 'success', icon: 'bi-person-check' },
                    { label: 'Exam Attempts', value: overview.totalAttempts || 0, color: 'info', icon: 'bi-pencil-square' },
                    { label: 'Batch Avg Score', value: `${overview.avgScore || 0}%`, color: 'warning', icon: 'bi-award' },
                ].map((s, i) => (
                    <div className="col-6 col-lg-3" key={i}>
                        <div className="card border-0 shadow-sm h-100 transition-hover">
                            <div className="card-body p-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className={`bg-${s.color} bg-opacity-10 text-${s.color} rounded-3 p-3`}>
                                        <i className={`bi ${s.icon} fs-4`}></i>
                                    </div>
                                    <div>
                                        <h4 className="fw-bold mb-0">{s.value}</h4>
                                        <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>{s.label}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="row g-4 mb-4">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 px-4">
                            <h6 className="fw-bold mb-0">Subject-wise Average Scores</h6>
                            <small className="text-muted">Performance breakdown by major topics</small>
                        </div>
                        <div className="card-body p-4">
                            {quizScores.labels.length > 0 ? (
                                <PerformanceChart
                                    labels={quizScores.labels}
                                    scores={quizScores.scores}
                                />
                            ) : (
                                <div className="text-center py-5 text-muted">No data available for these filters.</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 px-4">
                            <h6 className="fw-bold mb-0">Participation Activity</h6>
                            <small className="text-muted">Attempts over the last 7 days</small>
                        </div>
                        <div className="card-body p-4">
                            {monthlyAttempts.labels.length > 0 ? (
                                <PerformanceChart
                                    labels={monthlyAttempts.labels}
                                    scores={monthlyAttempts.scores}
                                    type="line"
                                />
                            ) : (
                                <div className="text-center py-5 text-muted">No recent activity detected.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 pt-4 px-4">
                    <h6 className="fw-bold mb-0">Detailed Exam Performance</h6>
                    <small className="text-muted">Breakdown of results for individual quizzes</small>
                </div>
                <div className="card-body p-0 mt-2">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 border-0">Exam (Quiz Name)</th>
                                    <th className="border-0">Subject</th>
                                    <th className="border-0 text-center">Attempts</th>
                                    <th className="border-0 text-center">Avg. Score</th>
                                    <th className="border-0 pe-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.quizDetails || []).length > 0 ? (
                                    data.quizDetails.map((q, idx) => (
                                        <tr key={idx}>
                                            <td className="ps-4 fw-medium text-dark">{q.title}</td>
                                            <td><span className="badge bg-secondary bg-opacity-10 text-secondary">{q.subject}</span></td>
                                            <td className="text-center">{q.totalAttempts}</td>
                                            <td className="text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-2">
                                                    <div className="progress w-50" style={{ height: '6px' }}>
                                                        <div
                                                            className={`progress-bar bg-${q.avgScore >= 70 ? 'success' : q.avgScore >= 40 ? 'warning' : 'danger'}`}
                                                            style={{ width: `${q.avgScore}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="small fw-bold">{q.avgScore}%</span>
                                                </div>
                                            </td>
                                            <td className="pe-4">
                                                <span className={`badge bg-${q.avgScore >= 40 ? 'success' : 'danger'} bg-opacity-10 text-${q.avgScore >= 40 ? 'success' : 'danger'}`}>
                                                    {q.avgScore >= 40 ? 'Healthy' : 'Needs Review'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted small italic">No exam data found for the current selection.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>{`
                .transition-hover:hover {
                    transform: translateY(-5px);
                    transition: transform 0.2s ease;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
