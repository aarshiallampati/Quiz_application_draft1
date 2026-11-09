import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProctorDashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState({ totalSessions: 0, flaggedCount: 0, logs: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await quizService.getProctorDashboard();
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner />;

    const { logs } = data;

    return (
        <div className="container-fluid py-4">
            <h3 className="fw-bold mb-4">
                <i className="bi bi-shield-check me-2"></i>Proctor Dashboard
            </h3>

            {/* Summary cards */}
            <div className="row g-3 mb-4">
                {[
                    { label: 'Total Sessions', value: data.totalSessions, color: 'primary', icon: 'bi-broadcast' },
                    { label: 'Flagged', value: data.flaggedCount, color: 'danger', icon: 'bi-exclamation-triangle' },
                    { label: 'Clean Sessions', value: data.totalSessions - data.flaggedCount, color: 'success', icon: 'bi-check-circle' },
                ].map((s, i) => (
                    <div className="col-md-4" key={i}>
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center">
                                <i className={`bi ${s.icon} fs-2 text-${s.color}`}></i>
                                <h3 className="fw-bold mt-2 mb-0">{s.value}</h3>
                                <small className="text-muted">{s.label}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Logs table */}
            {logs.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="text-muted mt-2">No proctoring logs available.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle bg-white shadow-sm rounded">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Student</th>
                                <th>Quiz</th>
                                <th>Events</th>
                                <th>Severity</th>
                                <th>Recommendation</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={log._id || i}>
                                    <td>{i + 1}</td>
                                    <td className="fw-semibold">{log.student?.name || '—'}</td>
                                    <td>{log.quiz?.title || '—'}</td>
                                    <td>
                                        <span className={`badge bg-${log.events?.length > 3 ? 'danger' : log.events?.length ? 'warning' : 'success'}`}>
                                            {log.events?.length || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="fw-bold">{log.severityScore || 0}</span>
                                    </td>
                                    <td>
                                        <span className={`badge bg-${log.recommendation === 'disqualify' ? 'danger' :
                                            log.recommendation === 'flag' ? 'warning' :
                                                log.recommendation === 'review' ? 'info' : 'success'
                                            } text-capitalize`}>
                                            {log.recommendation || 'none'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/admin/proctor/${log.submission}`)}>
                                            <i className="bi bi-eye me-1"></i>Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
