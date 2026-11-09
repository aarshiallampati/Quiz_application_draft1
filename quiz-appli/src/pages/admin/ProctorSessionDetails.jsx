import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProctorSessionDetails() {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await quizService.getProctorSession(submissionId);
                setLog(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [submissionId]);

    if (loading) return <LoadingSpinner />;
    if (!log) return <div className="container py-5 text-center"><h4>Session log not found</h4></div>;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => navigate(-1)}>
                        <i className="bi bi-arrow-left me-1"></i>Back
                    </button>
                    <h3 className="fw-bold mb-0">Proctoring Session Details</h3>
                </div>
                <div className={`badge bg-${log.recommendation === 'disqualify' ? 'danger' : 'warning'} fs-6`}>
                    Recommendation: {log.recommendation?.toUpperCase()}
                </div>
            </div>

            <div className="row g-4">
                {/* Student & Quiz Info */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-transparent fw-bold">Session Information</div>
                        <div className="card-body">
                            <ul className="list-unstyled mb-0">
                                <li className="mb-2"><strong>Student:</strong> {log.student?.name}</li>
                                <li className="mb-2"><strong>Email:</strong> {log.student?.email}</li>
                                <li className="mb-2"><strong>Quiz:</strong> {log.quiz?.title}</li>
                                <li className="mb-2"><strong>Severity Score:</strong> <span className="text-danger fw-bold">{log.severityScore}</span></li>
                                <li><strong>Started:</strong> {new Date(log.createdAt).toLocaleString()}</li>
                            </ul>
                        </div>
                    </div>

                    {/* Snapshots Grid */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent fw-bold d-flex justify-content-between">
                            Snapshots <span>({log.snapshots?.length || 0})</span>
                        </div>
                        <div className="card-body p-2">
                            <div className="row g-2">
                                {log.snapshots?.map((s, i) => (
                                    <div className="col-6" key={i}>
                                        <div className="position-relative">
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}${s.image}`}
                                                alt={`Snapshot ${i}`}
                                                className="img-fluid rounded border"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => window.open(`${import.meta.env.VITE_API_URL}${s.image}`, '_blank')}
                                            />
                                            <small className="position-absolute bottom-0 start-0 bg-dark text-white bg-opacity-75 px-1 rounded-end" style={{ fontSize: '0.6rem' }}>
                                                {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                                {(!log.snapshots || log.snapshots.length === 0) && (
                                    <div className="col-12 text-center py-4 text-muted">No snapshots captured.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Timeline */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent fw-bold">Event Timeline</div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Time</th>
                                            <th>Event Type</th>
                                            <th>Severity</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {log.events?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((e, i) => (
                                            <tr key={i}>
                                                <td className="small text-muted">{new Date(e.timestamp).toLocaleTimeString()}</td>
                                                <td>
                                                    <span className="text-capitalize">{e.type.replace(/_/g, ' ')}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${e.severity === 'high' ? 'danger' : e.severity === 'medium' ? 'warning' : 'info'}`}>
                                                        {e.severity}
                                                    </span>
                                                </td>
                                                <td className="small">{e.details || '—'}</td>
                                            </tr>
                                        ))}
                                        {(!log.events || log.events.length === 0) && (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-muted">No suspicious events recorded.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
