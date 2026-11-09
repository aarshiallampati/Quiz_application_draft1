import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/LoadingSpinner';

const blankQuestion = { text: '', type: 'MCQ', options: ['', '', '', ''], correctOption: 0, marks: 1, explanation: '' };

export default function QuizQuestions() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [form, setForm] = useState({ ...blankQuestion });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await quizService.getQuestions(quizId);
                setQuestions(Array.isArray(data) ? data : data.questions || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [quizId]);

    const handleOptionChange = (index, value) => {
        const opts = [...form.options];
        opts[index] = value;
        setForm({ ...form, options: opts });
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Transform to backend schema:  options: [{ text, isCorrect }]
            const payload = {
                text: form.text,
                type: form.type,
                marks: form.marks,
                explanation: form.explanation,
                options: form.options.map((text, i) => ({
                    text,
                    isCorrect: i === form.correctOption,
                })),
            };
            const data = await quizService.addQuestion(quizId, payload);
            setQuestions((prev) => [...prev, data]);
            setForm({ ...blankQuestion });
        } catch (err) {
            console.error(err);
            alert('Failed to add question');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (questionId) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await quizService.deleteQuestion(questionId);
            setQuestions((prev) => prev.filter((q) => q._id !== questionId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleFinish = async (publish = false) => {
        try {
            if (publish) {
                await quizService.updateQuiz(quizId, { isPublished: true });
            }
            navigate('/admin/quizzes');
        } catch (err) {
            console.error(err);
            alert('Failed to update quiz status');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">
                    <i className="bi bi-list-ol me-2"></i>Quiz Questions
                </h3>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary" onClick={() => handleFinish(false)}>
                        <i className="bi bi-save me-1"></i>Finish & Close
                    </button>
                    <button className="btn btn-success" onClick={() => handleFinish(true)}>
                        <i className="bi bi-send-check me-1"></i>Submit to Students
                    </button>
                </div>
            </div>

            <div className="row g-4">
                {/* Add question form */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-primary text-white fw-semibold">
                            <i className="bi bi-plus-circle me-1"></i>Add Question
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleAdd}>
                                <div className="mb-3">
                                    <label className="form-label">Question Text *</label>
                                    <textarea className="form-control" rows={3} value={form.text}
                                        onChange={(e) => setForm({ ...form, text: e.target.value })} required />
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Type</label>
                                        <select className="form-select" value={form.type}
                                            onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                            <option value="MCQ">MCQ</option>
                                            <option value="MSQ">MSQ</option>
                                            <option value="TrueFalse">True/False</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Marks</label>
                                        <input type="number" className="form-control" min={1} value={form.marks}
                                            onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })} />
                                    </div>
                                </div>

                                {form.options.map((opt, i) => (
                                    <div className="mb-2" key={i}>
                                        <div className="input-group">
                                            <span className={`input-group-text ${form.correctOption === i ? 'bg-success text-white' : ''}`}>
                                                <input type="radio" name="correct" checked={form.correctOption === i}
                                                    onChange={() => setForm({ ...form, correctOption: i })} />
                                            </span>
                                            <input type="text" className="form-control" placeholder={`Option ${i + 1}`}
                                                value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} required />
                                        </div>
                                    </div>
                                ))}
                                <small className="text-muted d-block mb-3">
                                    <i className="bi bi-info-circle me-1"></i>Select the radio button next to the correct answer
                                </small>

                                <div className="mb-3">
                                    <label className="form-label">Explanation (optional)</label>
                                    <textarea className="form-control" rows={2} value={form.explanation}
                                        onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                                        placeholder="Why this is the correct answer..." />
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Adding…' : <><i className="bi bi-plus me-1"></i>Add Question</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Existing questions list */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent fw-semibold d-flex justify-content-between">
                            <span>Questions ({questions.length})</span>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: 600, overflowY: 'auto' }}>
                            {questions.length === 0 ? (
                                <p className="text-muted text-center py-4">No questions yet.</p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {questions.map((q, i) => (
                                        <li key={q._id || i} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <strong className="small">Q{i + 1}.</strong>
                                                <div className="d-flex gap-1 align-items-center">
                                                    <span className="badge bg-light text-dark border">{q.marks || 1} mk</span>
                                                    <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => handleDelete(q._id)}>
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mb-1">{q.text}</p>
                                            <div className="d-flex flex-wrap gap-1">
                                                {(q.options || []).map((o, oi) => (
                                                    <span key={oi} className={`badge ${o.isCorrect ? 'bg-success' : 'bg-light text-dark border'}`}>
                                                        {typeof o === 'string' ? o : o.text}
                                                    </span>
                                                ))}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
