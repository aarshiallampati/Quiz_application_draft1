import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function QuizResults() {
    const { quizId } = useParams();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = quizId
                    ? await quizService.getQuizResults(quizId)
                    : await quizService.getAllResults();
                setResults(Array.isArray(data) ? data : data.results || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [quizId]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container-fluid py-4">
            <h3 className="fw-bold mb-4"><i className="bi bi-bar-chart me-2"></i>Quiz Results</h3>

            {results.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="text-muted mt-2">No results available.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle bg-white shadow-sm rounded">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Student</th>
                                {!quizId && <th>Quiz</th>}
                                <th>Score</th>
                                <th>Percentage</th>
                                <th>Time Taken</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={r._id || i}>
                                    <td>{i + 1}</td>
                                    <td>
                                        <div className="fw-semibold">{r.student?.name || 'Student'}</div>
                                        <small className="text-muted">{r.student?.email || ''}</small>
                                    </td>
                                    {!quizId && <td>{r.quiz?.title || '—'}</td>}
                                    <td>{r.score}/{r.totalMarks}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="progress flex-grow-1" style={{ height: 8 }}>
                                                <div className={`progress-bar bg-${r.percentage >= 50 ? 'success' : 'danger'}`}
                                                    style={{ width: `${r.percentage}%` }}></div>
                                            </div>
                                            <span className="small fw-semibold">{r.percentage}%</span>
                                        </div>
                                    </td>
                                    <td>{r.timeTaken ? `${Math.floor(r.timeTaken / 60)}m ${r.timeTaken % 60}s` : '—'}</td>
                                    <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                                    <td>
                                        <span className={`badge bg-${r.passed ? 'success' : 'danger'}`}>
                                            {r.passed ? 'Passed' : 'Failed'}
                                        </span>
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
