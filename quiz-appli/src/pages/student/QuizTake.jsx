import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import TimerBadge from '../../components/TimerBadge';
import ProctorMonitor from '../../components/ProctorMonitor';
import ProctorAlert from '../../components/ProctorAlert';
import LoadingSpinner from '../../components/LoadingSpinner';
import { shuffleQuestions } from '../../utils/shuffleQuestions';

/* ── Mock questions fallback ─────────────────────────────── */
const MOCK_QUESTIONS = [
    { _id: 'm1', type: 'mcq', questionText: 'Which data structure uses FIFO ordering?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctOption: 1, marks: 1 },
    { _id: 'm2', type: 'mcq', questionText: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctOption: 1, marks: 1 },
    { _id: 'm3', type: 'msq', questionText: 'Which of the following are non-linear data structures? (Select all)', options: ['Array', 'Tree', 'Graph', 'Linked List'], correctOptions: [1, 2], marks: 2 },
    { _id: 'm4', type: 'mcq', questionText: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Sequential Query Language'], correctOption: 0, marks: 1 },
    { _id: 'm5', type: 'mcq', questionText: 'Which layer of OSI model handles routing?', options: ['Transport', 'Data Link', 'Network', 'Session'], correctOption: 2, marks: 1 },
    { _id: 'm6', type: 'msq', questionText: 'Which are valid React hooks? (Select all)', options: ['useState', 'useEffect', 'useClass', 'useRef'], correctOptions: [0, 1, 3], marks: 2 },
    { _id: 'm7', type: 'mcq', questionText: 'What is a deadlock?', options: ['CPU overheating', 'Two processes waiting on each other indefinitely', 'Memory overflow', 'Disk failure'], correctOption: 1, marks: 2 },
    { _id: 'm8', type: 'mcq', questionText: 'Which protocol is used for email sending?', options: ['HTTP', 'FTP', 'SMTP', 'SNMP'], correctOption: 2, marks: 1 },
    { _id: 'm9', type: 'mcq', questionText: 'What is the worst-case time complexity of quicksort?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correctOption: 2, marks: 1 },
    { _id: 'm10', type: 'msq', questionText: 'Which are types of joins in SQL? (Select all)', options: ['INNER JOIN', 'OUTER JOIN', 'CROSS JOIN', 'LOOP JOIN'], correctOptions: [0, 1, 2], marks: 2 },
];

/*  statuses: "not-visited" | "answered" | "review" */

export default function QuizTake() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const submitLock = useRef(false);

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});       // { qId: optionIndex } for MCQ, { qId: [indices] } for MSQ
    const [statuses, setStatuses] = useState({});
    const [violations, setViolations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [proctorActive, setProctorActive] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [duration, setDuration] = useState(0);
    const [submissionId, setSubmissionId] = useState('');
    const [quizTitle, setQuizTitle] = useState('');

    /* ── Load quiz ────────────────────────────────────────── */
    useEffect(() => {
        const init = async () => {
            try {
                const data = await quizService.startQuiz(quizId);
                const quiz = data.quiz || data;
                const qs = quiz.questions || [];
                // Normalize question text field
                const normalized = qs.map(q => ({ ...q, questionText: q.questionText || q.text }));
                const shuffled = shuffleQuestions(normalized);
                setQuestions(shuffled);
                setDuration((quiz.duration || 30) * 60);
                setSubmissionId(data.submission?._id || data.submissionId || data._id || quizId);
                setQuizTitle(quiz.title || 'Quiz');

                const initStatuses = {};
                shuffled.forEach((q) => { initStatuses[q._id] = 'not-visited'; });
                setStatuses(initStatuses);
            } catch (err) {
                console.error('Failed to start quiz:', err);
                alert(err.response?.data?.message || 'Failed to load quiz');
                navigate('/student/dashboard', { replace: true });
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [quizId, navigate]);

    /* ── Handlers ─────────────────────────────────────────── */
    const handleMCQAnswer = (questionId, optionIndex) => {
        setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
        setStatuses((prev) => ({
            ...prev,
            [questionId]: prev[questionId] === 'review' ? 'review' : 'answered',
        }));
    };

    const handleMSQAnswer = (questionId, optionIndex) => {
        setAnswers((prev) => {
            const current = Array.isArray(prev[questionId]) ? [...prev[questionId]] : [];
            const idx = current.indexOf(optionIndex);
            if (idx >= 0) current.splice(idx, 1);
            else current.push(optionIndex);
            return { ...prev, [questionId]: current };
        });
        setStatuses((prev) => ({
            ...prev,
            [questionId]: prev[questionId] === 'review' ? 'review' : 'answered',
        }));
    };

    const toggleReview = (questionId) => {
        setStatuses((prev) => ({
            ...prev,
            [questionId]: prev[questionId] === 'review'
                ? (answers[questionId] !== undefined ? 'answered' : 'not-visited')
                : 'review',
        }));
    };

    const clearAnswer = (questionId) => {
        setAnswers((prev) => { const copy = { ...prev }; delete copy[questionId]; return copy; });
        setStatuses((prev) => ({
            ...prev,
            [questionId]: prev[questionId] === 'review' ? 'review' : 'not-visited',
        }));
    };

    const goTo = (index) => setCurrentIndex(index);

    /* ── Submit ───────────────────────────────────────────── */
    const handleSubmit = useCallback(async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        setSubmitting(true);

        // Disable proctoring BEFORE submit so fullscreen exit isn't flagged
        setProctorActive(false);

        // Exit fullscreen gracefully before navigating
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch { /* ignore */ }

        try {
            // Transform answers to backend format: [{ question, selectedOptions }]
            const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
                question: questionId,
                selectedOptions: Array.isArray(answer) ? answer : [answer],
            }));
            const result = await quizService.submitQuiz(quizId, formattedAnswers);
            const subId = result.attemptId || result.submission?._id || result._id || 'latest';
            navigate(`/student/quiz/result/${subId}`, { replace: true });
        } catch (err) {
            console.error('Submit failed:', err);
            alert(err.response?.data?.message || 'Failed to submit quiz');
            setProctorActive(true); // Re-enable proctoring on failure
            submitLock.current = false;
            setSubmitting(false);
        }
    }, [quizId, answers, navigate]);

    const handleForceSubmit = useCallback(() => {
        alert('⚠ Too many proctoring violations. Quiz will be auto-submitted.');
        handleSubmit();
    }, [handleSubmit]);

    /* ── Proctor violation handler ────────────────────────── */
    const handleViolation = useCallback((event) => {
        setViolations((prev) => [...prev, event]);
    }, []);

    /* ── Counts ───────────────────────────────────────────── */
    const answeredCount = Object.values(statuses).filter((s) => s === 'answered').length;
    const reviewCount = Object.values(statuses).filter((s) => s === 'review').length;
    const notVisitedCount = Object.values(statuses).filter((s) => s === 'not-visited').length;

    if (loading) return <LoadingSpinner text="Preparing quiz…" />;
    if (!questions.length) return <p className="text-center py-5 text-danger">No questions found.</p>;

    const q = questions[currentIndex];
    const isMSQ = q.type === 'msq';

    const navBtnClass = (qId, idx) => {
        const active = idx === currentIndex;
        const status = statuses[qId];
        if (active) return 'btn-primary';
        if (status === 'answered') return 'btn-success';
        if (status === 'review') return 'btn-warning text-dark';
        return 'btn-outline-secondary';
    };

    return (
        <div className="container-fluid py-3 px-3 px-lg-4" style={{ minHeight: 'calc(100vh - 56px)' }}>
            {/* ── Proctoring (invisible + floating alerts) ──── */}
            <ProctorMonitor
                submissionId={submissionId}
                quizId={quizId}
                onViolation={handleViolation}
                onForceSubmit={handleForceSubmit}
                active={proctorActive}
            />
            <ProctorAlert violations={violations} />

            {/* ── Quiz title bar ───────────────────────────────── */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">
                    <i className="bi bi-journal-text me-2 text-primary"></i>{quizTitle}
                </h5>
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-danger bg-opacity-10 text-danger">
                        <i className="bi bi-shield-check me-1"></i>Proctored
                    </span>
                </div>
            </div>

            <div className="row g-3">
                {/* ═══════════════════════════════════════════════════
            LEFT — Question Area
           ═══════════════════════════════════════════════════ */}
                <div className="col-lg-8 order-2 order-lg-1">
                    <div className="card border-0 shadow-sm h-100 d-flex flex-column">
                        {/* Header */}
                        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                            <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-primary bg-opacity-10 text-primary fs-6">
                                    Q {currentIndex + 1} / {questions.length}
                                </span>
                                <span className="badge bg-light text-dark border">{q.marks || 1} mark(s)</span>
                                {isMSQ && <span className="badge bg-info bg-opacity-10 text-info">Multiple Select</span>}
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => clearAnswer(q._id)}
                                    disabled={answers[q._id] === undefined}
                                >
                                    <i className="bi bi-eraser me-1"></i>Clear
                                </button>
                                <button
                                    className={`btn btn-sm ${statuses[q._id] === 'review' ? 'btn-warning' : 'btn-outline-warning'}`}
                                    onClick={() => toggleReview(q._id)}
                                >
                                    <i className={`bi ${statuses[q._id] === 'review' ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`}></i>
                                    {statuses[q._id] === 'review' ? 'Reviewing' : 'Review'}
                                </button>
                            </div>
                        </div>

                        {/* Question body */}
                        <div className="card-body p-4 flex-grow-1">
                            <h5 className="fw-semibold mb-4 lh-base">{q.questionText || q.text}</h5>

                            <div className="d-flex flex-column gap-2">
                                {(q.options || []).map((opt, oi) => {
                                    const optText = typeof opt === 'string' ? opt : opt.text;

                                    if (isMSQ) {
                                        const checked = Array.isArray(answers[q._id]) && answers[q._id].includes(oi);
                                        return (
                                            <label
                                                key={oi}
                                                className={`d-flex align-items-center gap-3 p-3 rounded-3 border ${checked ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-secondary-subtle'
                                                    }`}
                                                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input mt-0 flex-shrink-0"
                                                    checked={checked}
                                                    onChange={() => handleMSQAnswer(q._id, oi)}
                                                />
                                                <span className="fw-medium">{optText}</span>
                                                {checked && <i className="bi bi-check-circle-fill text-primary ms-auto"></i>}
                                            </label>
                                        );
                                    }

                                    // MCQ
                                    const selected = answers[q._id] === oi;
                                    return (
                                        <label
                                            key={oi}
                                            className={`d-flex align-items-center gap-3 p-3 rounded-3 border ${selected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-secondary-subtle'
                                                }`}
                                            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                        >
                                            <input
                                                type="radio"
                                                className="form-check-input mt-0 flex-shrink-0"
                                                name={`q-${q._id}`}
                                                checked={selected}
                                                onChange={() => handleMCQAnswer(q._id, oi)}
                                            />
                                            <span className="fw-medium">{optText}</span>
                                            {selected && <i className="bi bi-check-circle-fill text-primary ms-auto"></i>}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer — Prev / Next */}
                        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                            <button
                                className="btn btn-outline-secondary"
                                disabled={currentIndex === 0}
                                onClick={() => goTo(currentIndex - 1)}
                            >
                                <i className="bi bi-chevron-left me-1"></i>Previous
                            </button>

                            <span className="text-muted small d-none d-md-block">
                                {isMSQ ? 'Select all correct options' : 'Select one option'}
                            </span>

                            {currentIndex === questions.length - 1 ? (
                                <button
                                    className="btn btn-danger"
                                    disabled={submitting}
                                    onClick={() => { if (window.confirm('Submit quiz? This cannot be undone.')) handleSubmit(); }}
                                >
                                    {submitting
                                        ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</>
                                        : <><i className="bi bi-send-fill me-1"></i>Submit Quiz</>}
                                </button>
                            ) : (
                                <button className="btn btn-primary" onClick={() => goTo(currentIndex + 1)}>
                                    Next<i className="bi bi-chevron-right ms-1"></i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════
            RIGHT — Navigation + Timer
           ═══════════════════════════════════════════════════ */}
                <div className="col-lg-4 order-1 order-lg-2">
                    <div className="card border-0 shadow-sm sticky-top" style={{ top: 76 }}>
                        {/* Timer */}
                        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
                            <span className="fw-semibold"><i className="bi bi-clock-fill me-2"></i>Time Remaining</span>
                            <TimerBadge initialSeconds={duration} onTimeUp={handleSubmit} />
                        </div>

                        <div className="card-body">
                            {/* Legend */}
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                <span className="d-flex align-items-center gap-1 small">
                                    <span className="d-inline-block rounded" style={{ width: 14, height: 14, background: '#198754' }}></span>
                                    Answered ({answeredCount})
                                </span>
                                <span className="d-flex align-items-center gap-1 small">
                                    <span className="d-inline-block rounded" style={{ width: 14, height: 14, background: '#ffc107' }}></span>
                                    Review ({reviewCount})
                                </span>
                                <span className="d-flex align-items-center gap-1 small">
                                    <span className="d-inline-block rounded border" style={{ width: 14, height: 14, background: '#fff' }}></span>
                                    Not Visited ({notVisitedCount})
                                </span>
                            </div>

                            {/* Question grid */}
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {questions.map((item, i) => (
                                    <button
                                        key={item._id || i}
                                        className={`btn btn-sm rounded-2 fw-semibold ${navBtnClass(item._id, i)}`}
                                        style={{ width: 42, height: 42, fontSize: '0.85rem' }}
                                        onClick={() => goTo(i)}
                                        title={`Q${i + 1} — ${statuses[item._id]}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            {/* Progress */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between small mb-1">
                                    <span className="text-muted">Progress</span>
                                    <span className="fw-semibold">{answeredCount}/{questions.length}</span>
                                </div>
                                <div className="progress" style={{ height: 8 }}>
                                    <div className="progress-bar bg-success" style={{ width: `${(answeredCount / questions.length) * 100}%` }}></div>
                                    <div className="progress-bar bg-warning" style={{ width: `${(reviewCount / questions.length) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Proctoring status */}
                            <div className="d-flex align-items-center gap-2 mb-3 small">
                                <span className="badge bg-danger bg-opacity-10 text-danger">
                                    <i className="bi bi-shield-fill-check me-1"></i>
                                    Violations: {violations.length}
                                </span>
                            </div>

                            {/* Submit */}
                            <button
                                className="btn btn-danger w-100 py-2 fw-semibold"
                                disabled={submitting}
                                onClick={() => { if (window.confirm('Are you sure you want to submit?')) handleSubmit(); }}
                            >
                                {submitting
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting…</>
                                    : <><i className="bi bi-send-fill me-2"></i>Submit Quiz</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
