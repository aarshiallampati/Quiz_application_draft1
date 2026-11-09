import { Difficulty, Pill } from './Ui';
import { formatMinutes, formatWhen } from '../utils';

export default function QuizCard({ quiz, used = 0, resume = false, onOpen }) {
  const max = quiz.maxAttempts || 1;
  const locked = used >= max && !resume;
  let label = 'Open';
  if (resume) label = 'Continue';
  else if (locked) label = 'Every attempt used';
  else if (used > 0) label = 'Try again';

  return (
    <article className="card card-hover quiz-card">
      <div className="quiz-card-top">
        <Pill>{quiz.subject}</Pill>
        <Difficulty value={quiz.difficulty} />
      </div>
      <h3>{quiz.title}</h3>
      {quiz.description ? <p className="clamp">{quiz.description}</p> : <p className="fine">No description added.</p>}
      <ul className="meta">
        <li>{formatMinutes(quiz.duration)}</li>
        <li>{quiz.totalMarks || 0} {(quiz.totalMarks || 0) === 1 ? 'pt' : 'pts'}</li>
        <li>Pass at {quiz.passingScore ?? 40}%</li>
        <li>{used} of {max} used</li>
      </ul>
      {quiz.quizMode === 'scheduled' ? (
        <p className="fine">Open {formatWhen(quiz.scheduledStart)} – {formatWhen(quiz.scheduledEnd)}</p>
      ) : null}
      <button type="button" className="btn btn-primary" disabled={locked} onClick={onOpen}>
        {label}
      </button>
    </article>
  );
}
