import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function QuizStart() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [webcamActive, setWebcamActive] = useState(false);
    const [webcamError, setWebcamError] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await quizService.getQuizById(quizId);
                setQuiz(data.quiz || data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [quizId]);

    // Start webcam on mount for verification
    useEffect(() => {
        let active = true;
        const startWebcam = async () => {
            try {
                // Request stream
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (active) {
                    streamRef.current = stream;
                    // We set webcamActive to true FIRST so the video element can render
                    setWebcamActive(true);
                }
            } catch (err) {
                console.warn('Webcam access denied:', err);
                if (active) setWebcamError('Camera access is required for proctoring. Please enable it to proceed.');
            }
        };

        if (!loading && quiz) {
            startWebcam();
        }

        return () => {
            active = false;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [loading, quiz]);

    // Secondary effect to attach stream to video element once it renders
    useEffect(() => {
        if (webcamActive && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [webcamActive]);

    const handleStart = () => {
        navigate(`/student/quiz/${quizId}/take`);
    };

    if (loading) return <LoadingSpinner />;
    if (!quiz) return <p className="text-center py-5 text-danger">Quiz not found.</p>;

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card shadow border-0 overflow-hidden">
                        <div className="row g-0">
                            {/* Left Side: Info */}
                            <div className="col-md-7">
                                <div className="card-body p-4 p-lg-5">
                                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                                        style={{ width: 60, height: 60 }}>
                                        <i className="bi bi-journal-text fs-3 text-primary"></i>
                                    </div>

                                    <h3 className="fw-bold">{quiz.title}</h3>
                                    <p className="text-muted small">{quiz.description}</p>

                                    <div className="d-flex gap-4 my-4">
                                        <div>
                                            <h6 className="fw-bold mb-0">{quiz.totalQuestions || '—'}</h6>
                                            <small className="text-muted">Questions</small>
                                        </div>
                                        <div className="border-start"></div>
                                        <div>
                                            <h6 className="fw-bold mb-0">{quiz.duration || '—'} min</h6>
                                            <small className="text-muted">Duration</small>
                                        </div>
                                        <div className="border-start"></div>
                                        <div>
                                            <h6 className="fw-bold mb-0 text-capitalize">{quiz.difficulty || 'N/A'}</h6>
                                            <small className="text-muted">Difficulty</small>
                                        </div>
                                    </div>

                                    <div className="alert alert-info text-start small border-0 bg-light p-3">
                                        <h6 className="fw-bold small mb-2"><i className="bi bi-info-circle me-1"></i>System Check & Instructions:</h6>
                                        <ul className="mb-0 ps-3">
                                            <li>Camera monitoring is <strong>active</strong> throughout the quiz.</li>
                                            <li>Tab switching or exiting fullscreen will be <strong>flagged</strong>.</li>
                                            <li>Ensure your face is clearly visible in the preview.</li>
                                            <li>Once started, the timer cannot be paused.</li>
                                        </ul>
                                    </div>

                                    <button
                                        className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 mt-3"
                                        onClick={handleStart}
                                        disabled={!webcamActive}
                                    >
                                        <i className="bi bi-play-fill fs-5"></i>
                                        {webcamActive ? 'Everything Ready - Start Quiz' : 'Waiting for Camera...'}
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Camera Preview */}
                            <div className="col-md-5 bg-dark d-flex align-items-center justify-content-center position-relative" style={{ minHeight: 300 }}>
                                {webcamActive ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-100 h-100"
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="text-center p-4">
                                        {webcamError ? (
                                            <div className="text-danger">
                                                <i className="bi bi-camera-video-off fs-1 mb-2"></i>
                                                <p className="small mb-0">{webcamError}</p>
                                            </div>
                                        ) : (
                                            <div className="text-white opacity-50 text-center">
                                                <div className="spinner-border spinner-border-sm mb-2" role="status"></div>
                                                <p className="small mb-0">Initializing Camera...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="position-absolute bottom-0 start-0 w-100 p-3 bg-dark bg-opacity-50 text-white small">
                                    <i className="bi bi-eye-fill me-1 text-success"></i> Verification Preview
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
