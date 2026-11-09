import { useEffect } from 'react';
import { useQuiz } from '../../context/QuizContext';
import QuizCard from '../../components/QuizCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StudentQuizzes() {
    const { quizzes, loadQuizzes, loading } = useQuiz();

    useEffect(() => {
        loadQuizzes();
    }, [loadQuizzes]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold mb-0">
                    <i className="bi bi-journal-text me-2"></i>Available Quizzes
                </h3>
                <span className="badge bg-primary fs-6">{quizzes.length} quizzes</span>
            </div>

            {quizzes.length === 0 ? (
                <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="text-muted mt-2">No quizzes available at the moment.</p>
                </div>
            ) : (
                <div className="row g-3">
                    {quizzes.map((quiz) => (
                        <div className="col-md-6 col-xl-4" key={quiz._id}>
                            <QuizCard quiz={quiz} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
