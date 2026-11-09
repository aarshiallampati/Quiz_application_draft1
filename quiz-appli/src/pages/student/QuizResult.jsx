import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import PerformanceChart from '../../components/PerformanceChart';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function QuizResult() {
    const { attemptId } = useParams();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await quizService.getResult(attemptId);
                setResult(data.result || data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [attemptId]);

    if (loading) return <LoadingSpinner />;
    if (!result) return <p className="text-center py-5 text-danger">Result not found.</p>;

    const percentage = Math.round((result.score / result.totalMarks) * 100) || 0;
    const passed = percentage >= 50;

    // Compute counts from answers
    const answers = result.answers || [];
    const correctCount = answers.filter(a => a.isCorrect).length;
    const wrongCount = answers.filter(a => !a.isCorrect && (a.selectedOptions?.length > 0 || a.textAnswer)).length;
    const unansweredCount = answers.length - correctCount - wrongCount;
    const timeTakenStr = result.timeTaken
        ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`
        : '—';

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    {/* Score card */}
                    <div className={`card border-0 shadow text-center mb-4 ${passed ? 'border-success' : 'border-danger'}`}>
                        <div className={`card-body p-5 ${passed ? 'bg-success' : 'bg-danger'} bg-opacity-10 rounded-3`}>
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 ${passed ? 'bg-success' : 'bg-danger'}`}
                                style={{ width: 80, height: 80 }}>
                                <i className={`bi ${passed ? 'bi-trophy-fill' : 'bi-emoji-frown'} fs-1 text-white`}></i>
                            </div>
                            <h2 className="fw-bold">{passed ? 'Congratulations!' : 'Better Luck Next Time!'}</h2>
                            <p className="text-muted">{result.quiz?.title || result.quizTitle || 'Quiz'}</p>
                            <h1 className="display-3 fw-bold mb-0">{percentage}%</h1>
                            <p className="text-muted">
                                {result.score} / {result.totalMarks} marks
                            </p>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="row g-3 mb-4">
                        {[
                            { label: 'Correct', value: correctCount, color: 'success', icon: 'bi-check-circle' },
                            { label: 'Wrong', value: wrongCount, color: 'danger', icon: 'bi-x-circle' },
                            { label: 'Unanswered', value: unansweredCount, color: 'secondary', icon: 'bi-dash-circle' },
                            { label: 'Time Taken', value: timeTakenStr, color: 'info', icon: 'bi-clock' },
                        ].map((s, i) => (
                            <div className="col-6 col-md-3" key={i}>
                                <div className="card border-0 shadow-sm text-center h-100">
                                    <div className="card-body">
                                        <i className={`bi ${s.icon} fs-4 text-${s.color}`}></i>
                                        <h5 className="fw-bold mt-1 mb-0">{s.value}</h5>
                                        <small className="text-muted">{s.label}</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Topic-wise chart */}
                    {result.topicScores && (
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-body">
                                <PerformanceChart
                                    labels={result.topicScores.map((t) => t.topic)}
                                    scores={result.topicScores.map((t) => t.percentage)}
                                    title="Topic-wise Performance"
                                />
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                        Question-by-Question Review
                    ═══════════════════════════════════════════════ */}
                    {answers.length > 0 && (
                        <div className="mb-4">
                            <div
                                className="d-flex justify-content-between align-items-center mb-3"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setShowReview(!showReview)}
                            >
                                <h4 className="fw-bold mb-0">
                                    <i className="bi bi-list-check me-2 text-primary"></i>Question Review
                                </h4>
                                <i className={`bi bi-chevron-${showReview ? 'up' : 'down'} fs-5 text-muted`}></i>
                            </div>

                            {showReview && (
                                <div className="d-flex flex-column gap-3">
                                    {answers.map((ans, idx) => {
                                        const q = ans.question || {};
                                        const options = q.options || [];
                                        const studentOpts = (ans.selectedOptions || []).map(i => options[i]?.text || `Option ${i + 1}`);
                                        const correctOpts = options.filter(o => o.isCorrect).map(o => o.text);

                                        return (
                                            <div key={ans._id || idx} className={`card border-0 shadow-sm border-start border-4 ${ans.isCorrect ? 'border-success' : 'border-danger'}`}>
                                                <div className="card-body p-3">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="mb-0 fw-semibold">
                                                            <span className={`badge ${ans.isCorrect ? 'bg-success' : 'bg-danger'} me-2`}>
                                                                Q{idx + 1}
                                                            </span>
                                                            {q.text || 'Question'}
                                                        </h6>
                                                        <span className="badge bg-light text-dark border">{ans.marksAwarded || 0}/{q.marks || 1}</span>
                                                    </div>

                                                    <div className="small">
                                                        <div className="mb-1">
                                                            <span className={`fw-semibold ${ans.isCorrect ? 'text-success' : 'text-danger'}`}>
                                                                <i className={`bi ${ans.isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                                                                Your answer:
                                                            </span>{' '}
                                                            {ans.textAnswer || studentOpts.join(', ') || <em className="text-muted">Not answered</em>}
                                                        </div>
                                                        {!ans.isCorrect && (
                                                            <div>
                                                                <span className="fw-semibold text-success">
                                                                    <i className="bi bi-check-circle-fill me-1"></i>
                                                                    Correct answer:
                                                                </span>{' '}
                                                                {correctOpts.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                        AI Analysis / Learning Insights + YouTube
                    ═══════════════════════════════════════════════ */}
                    {result.aiAnalysis && result.aiAnalysis.length > 0 && (
                        <div className="mb-5">
                            <h4 className="fw-bold mb-4">
                                <i className="bi bi-lightbulb-fill text-warning me-2"></i>Personalized Learning Insights
                            </h4>
                            <div className="row g-4">
                                {result.aiAnalysis.map((item, idx) => (
                                    <div className="col-12" key={idx}>
                                        <div className="card border-0 shadow-sm border-start border-4 border-primary overflow-hidden">
                                            <div className="card-body p-4">
                                                <div className="mb-3">
                                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2">
                                                        Focus Area: {item.concept || 'General'}
                                                    </span>
                                                </div>
                                                <div className="mb-3">
                                                    <h6 className="fw-bold text-muted text-uppercase mb-2">Observation</h6>
                                                    <p className="mb-0" style={{ fontSize: '1rem', lineHeight: '1.6' }}>{item.whyWrong}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <h6 className="fw-bold text-muted text-uppercase mb-2">Correct Logic</h6>
                                                    <p className="mb-0 text-success" style={{ fontSize: '1rem', lineHeight: '1.6' }}>{item.correctExplanation}</p>
                                                </div>
                                                <div className="bg-light p-3 rounded-3 mt-3">
                                                    <h6 className="fw-bold text-primary text-uppercase mb-2">
                                                        <i className="bi bi-mortarboard-fill me-1"></i>Study Advice
                                                    </h6>
                                                    <p className="mb-0 text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{item.studyTip}</p>
                                                </div>

                                                {/* YouTube Recommendations */}
                                                {item.youtubeLinks && item.youtubeLinks.length > 0 && (
                                                    <div className="mt-3 p-3 rounded-3" style={{ background: '#fff3f3' }}>
                                                        <h6 className="fw-bold small text-uppercase mb-2" style={{ color: '#dc3545' }}>
                                                            <i className="bi bi-youtube me-1"></i>Recommended Videos
                                                        </h6>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {item.youtubeLinks.map((link, li) => (
                                                                <a
                                                                    key={li}
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                                                                    style={{ fontSize: '0.8rem', textDecoration: 'none' }}
                                                                >
                                                                    <i className="bi bi-play-circle-fill"></i>
                                                                    {link.title}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Email notification banner */}
                    <div className="alert alert-info d-flex align-items-center gap-2 mb-4" role="alert">
                        <i className="bi bi-envelope-check-fill fs-5"></i>
                        <div className="small">
                            A detailed PDF report has been generated. If your email is configured, it will be sent to your registered email address automatically.
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="text-center">
                        <Link to="/student/quizzes" className="btn btn-primary me-2">
                            <i className="bi bi-journal-text me-1"></i>Browse Quizzes
                        </Link>
                        <Link to="/student/history" className="btn btn-outline-secondary">
                            <i className="bi bi-clock-history me-1"></i>View History
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
