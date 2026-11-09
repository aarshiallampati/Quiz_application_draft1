import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatTimeVerbose } from '../../utils/formatTime';

export default function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await quizService.getHistory();
                setHistory(data.history || data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container-fluid py-4">
            <h3 className="fw-bold mb-4">
                <i className="bi bi-clock-history me-2"></i>Quiz History
            </h3>

            {history.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="text-muted mt-2">No quiz attempts yet.</p>
                    <Link to="/student/quizzes" className="btn btn-primary">Browse Quizzes</Link>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Quiz</th>
                                <th>Score</th>
                                <th>Time Taken</th>
                                <th>Date</th>
                                <th>Result</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h, i) => {
                                const pct = Math.round((h.score / h.totalMarks) * 100) || 0;
                                return (
                                    <tr key={h._id || i}>
                                        <td>{i + 1}</td>
                                        <td className="fw-semibold">{h.quizTitle || 'Untitled'}</td>
                                        <td>
                                            <span className={`badge bg-${pct >= 50 ? 'success' : 'danger'}`}>{pct}%</span>
                                        </td>
                                        <td>{formatTimeVerbose(h.timeTaken) || '—'}</td>
                                        <td>{h.date ? new Date(h.date).toLocaleDateString() : '—'}</td>
                                        <td>
                                            <span className={`badge bg-${pct >= 50 ? 'success' : 'danger'} bg-opacity-10 text-${pct >= 50 ? 'success' : 'danger'}`}>
                                                {pct >= 50 ? 'Passed' : 'Failed'}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/student/quiz/result/${h._id}`} className="btn btn-sm btn-outline-primary">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
