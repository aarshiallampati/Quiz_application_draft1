import { Link } from 'react-router-dom';

export default function QuizCard({ quiz, actionLabel = 'Start Quiz', actionPath }) {
    const difficultyColor = {
        easy: 'success',
        medium: 'warning',
        hard: 'danger',
    };

    return (
        <div className="card h-100 shadow-sm border-0 quiz-card">
            <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{quiz.title}</h5>
                    <span className={`badge bg-${difficultyColor[quiz.difficulty] || 'secondary'} text-capitalize`}>
                        {quiz.difficulty || 'N/A'}
                    </span>
                </div>

                <p className="card-text text-muted flex-grow-1">
                    {quiz.description || 'No description available.'}
                </p>

                <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="badge bg-light text-dark border">
                        <i className="bi bi-question-circle me-1"></i>
                        {quiz.totalQuestions || '—'} Questions
                    </span>
                    <span className="badge bg-light text-dark border">
                        <i className="bi bi-clock me-1"></i>
                        {quiz.duration || '—'} min
                    </span>
                    <span className="badge bg-light text-dark border">
                        <i className="bi bi-book me-1"></i>
                        {quiz.subject || 'General'}
                    </span>
                    {quiz.quizDate && (
                        <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                            <i className="bi bi-calendar-event me-1"></i>
                            {new Date(quiz.quizDate).toLocaleDateString()}
                        </span>
                    )}
                </div>

                <Link
                    to={actionPath || `/student/quiz/${quiz._id}/start`}
                    className="btn btn-primary mt-auto"
                >
                    {actionLabel}
                </Link>
            </div>
        </div>
    );
}
