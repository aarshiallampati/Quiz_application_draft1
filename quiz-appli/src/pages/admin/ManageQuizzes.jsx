import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ManageQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await quizService.getAllQuizzes();
                setQuizzes(Array.isArray(data) ? data : data.quizzes || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Archive this quiz?')) return;
        try {
            await quizService.deleteQuiz(id);
            setQuizzes((prev) => prev.filter((q) => q._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">
                    <i className="bi bi-journal-text me-2"></i>Manage Quizzes
                </h3>
                <Link to="/admin/quizzes/create" className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1"></i>Create Quiz
                </Link>
            </div>

            {quizzes.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="text-muted mt-2">No quizzes created yet.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle bg-white shadow-sm rounded">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Questions</th>
                                <th>Duration</th>
                                <th>Mode</th>
                                <th>Difficulty</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.map((q, i) => (
                                <tr key={q._id || i}>
                                    <td>{i + 1}</td>
                                    <td className="fw-semibold">{q.title}</td>
                                    <td>{q.subject || '—'}</td>
                                    <td>{q.questions?.length || 0}</td>
                                    <td>{q.duration || '—'} min</td>
                                    <td>
                                        <span className={`badge bg-${q.quizMode === 'scheduled' ? 'info' : 'warning'}`}>
                                            {q.quizMode === 'scheduled' ? '📅 Scheduled' : '⚡ Immediate'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge bg-${q.difficulty === 'hard' ? 'danger' : q.difficulty === 'medium' ? 'warning' : 'success'} text-capitalize`}>
                                            {q.difficulty || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge bg-${q.isPublished ? 'success' : 'secondary'}`}>
                                            {q.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="btn-group btn-group-sm">
                                            <Link to={`/admin/quizzes/${q._id}/questions`} className="btn btn-outline-primary" title="Questions">
                                                <i className="bi bi-list-ol"></i>
                                            </Link>
                                            <Link to={`/admin/quizzes/${q._id}/results`} className="btn btn-outline-info" title="Results">
                                                <i className="bi bi-bar-chart"></i>
                                            </Link>
                                            <button className="btn btn-outline-danger" title="Archive" onClick={() => handleDelete(q._id)}>
                                                <i className="bi bi-archive"></i>
                                            </button>
                                        </div>
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
