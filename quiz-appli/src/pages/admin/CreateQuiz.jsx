import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';

export default function CreateQuiz() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        subject: '',
        duration: 30,
        numberOfQuestions: 0,
        difficulty: 'medium',
        department: '',
        semester: '',
        quizDate: '',
        quizMode: 'immediate',
        scheduledStart: '',
        scheduledEnd: '',
        passingScore: 40,
        maxAttempts: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        isPublished: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.quizMode === 'scheduled' && (!form.scheduledStart || !form.scheduledEnd)) {
            alert('Please set both start and end times for a scheduled quiz.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                duration: Number(form.duration),
                numberOfQuestions: Number(form.numberOfQuestions)
            };
            if (form.quizMode === 'immediate') {
                delete payload.scheduledStart;
                delete payload.scheduledEnd;
            }
            const data = await quizService.createQuiz(payload);
            navigate(`/admin/quizzes/${data._id || data.quiz?._id}/questions`);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to create quiz';
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent pt-3">
                            <h4 className="fw-bold mb-0">
                                <i className="bi bi-plus-circle me-2"></i>Create New Quiz
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                {/* Title */}
                                <div className="mb-3">
                                    <label className="form-label">Quiz Title *</label>
                                    <input type="text" className="form-control" name="title" value={form.title}
                                        onChange={handleChange} required placeholder="e.g. Data Structures — Mid Sem" />
                                </div>

                                {/* Description */}
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-control" name="description" rows={3} value={form.description}
                                        onChange={handleChange} placeholder="Brief description of the quiz" />
                                </div>

                                {/* Subject / Duration / Difficulty / Questions */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label">Subject *</label>
                                        <input type="text" className="form-control" name="subject" value={form.subject}
                                            onChange={handleChange} required placeholder="e.g. DSA" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Duration (min)</label>
                                        <input type="number" className="form-control" name="duration" min={1}
                                            value={form.duration} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Questions (0=all)</label>
                                        <input type="number" className="form-control" name="numberOfQuestions" min={0}
                                            value={form.numberOfQuestions} onChange={handleChange} title="0 means use all available questions" />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label">Difficulty</label>
                                        <select className="form-select" name="difficulty" value={form.difficulty} onChange={handleChange}>
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Class Assignment & Date */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Target Department</label>
                                        <select className="form-select" name="department" value={form.department} onChange={handleChange}>
                                            <option value="">All Departments</option>
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Information Technology">Information Technology</option>
                                            <option value="Electronics">Electronics</option>
                                            <option value="Mechanical">Mechanical</option>
                                            <option value="Civil">Civil</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Target Semester</label>
                                        <select className="form-select" name="semester" value={form.semester} onChange={handleChange}>
                                            <option value="">All Semesters</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Quiz Date</label>
                                        <input type="date" className="form-control" name="quizDate" value={form.quizDate} onChange={handleChange} />
                                    </div>
                                </div>

                                {/* ── Quiz Mode ─────────────────────────── */}
                                <div className="card bg-light border-0 mb-3">
                                    <div className="card-body p-3">
                                        <label className="form-label fw-semibold mb-2">
                                            <i className="bi bi-clock-history me-1"></i>Quiz Availability
                                        </label>

                                        <div className="d-flex gap-3 mb-3">
                                            <div
                                                className={`flex-fill p-3 rounded-3 border-2 text-center cursor-pointer ${form.quizMode === 'immediate'
                                                    ? 'border-primary bg-white shadow-sm' : 'border bg-transparent'}`}
                                                style={{ cursor: 'pointer', borderStyle: 'solid', transition: 'all 0.15s ease' }}
                                                onClick={() => setForm(p => ({ ...p, quizMode: 'immediate' }))}
                                            >
                                                <i className="bi bi-lightning-charge-fill fs-4 text-warning d-block mb-1"></i>
                                                <strong>Immediate</strong>
                                                <div className="text-muted small">Available as soon as published</div>
                                            </div>

                                            <div
                                                className={`flex-fill p-3 rounded-3 border-2 text-center cursor-pointer ${form.quizMode === 'scheduled'
                                                    ? 'border-primary bg-white shadow-sm' : 'border bg-transparent'}`}
                                                style={{ cursor: 'pointer', borderStyle: 'solid', transition: 'all 0.15s ease' }}
                                                onClick={() => setForm(p => ({ ...p, quizMode: 'scheduled' }))}
                                            >
                                                <i className="bi bi-calendar-event-fill fs-4 text-info d-block mb-1"></i>
                                                <strong>Scheduled</strong>
                                                <div className="text-muted small">Available in a time window only</div>
                                            </div>
                                        </div>

                                        {form.quizMode === 'scheduled' && (
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">Start Date &amp; Time *</label>
                                                    <input type="datetime-local" className="form-control" name="scheduledStart"
                                                        value={form.scheduledStart} onChange={handleChange} required />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label">End Date &amp; Time *</label>
                                                    <input type="datetime-local" className="form-control" name="scheduledEnd"
                                                        value={form.scheduledEnd} onChange={handleChange} required />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Passing / Attempts */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Passing Score (%)</label>
                                        <input type="number" className="form-control" name="passingScore" min={0} max={100}
                                            value={form.passingScore} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Max Attempts</label>
                                        <input type="number" className="form-control" name="maxAttempts" min={1}
                                            value={form.maxAttempts} onChange={handleChange} />
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="d-flex flex-wrap gap-4 mb-4">
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" name="shuffleQuestions" id="shuffleQ"
                                            checked={form.shuffleQuestions} onChange={handleChange} />
                                        <label className="form-check-label" htmlFor="shuffleQ">Shuffle Questions</label>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" name="shuffleOptions" id="shuffleO"
                                            checked={form.shuffleOptions} onChange={handleChange} />
                                        <label className="form-check-label" htmlFor="shuffleO">Shuffle Options</label>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" name="isPublished" id="isPublished"
                                            checked={form.isPublished} onChange={handleChange} />
                                        <label className="form-check-label" htmlFor="isPublished">Publish Immediately</label>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span>Creating…</>
                                        ) : (
                                            <><i className="bi bi-check2 me-1"></i>Create &amp; Add Questions</>
                                        )}
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
