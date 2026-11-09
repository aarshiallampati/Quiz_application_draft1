import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Banner, Difficulty, Empty, PageHeader, Pill, SkeletonCards } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { ago, formatMinutes } from '../../utils';

export default function Quizzes() {
  useTitle('Rounds');
  const [quizzes, setQuizzes] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/quiz')
      .then((data) => setQuizzes(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => quizzes.filter((quiz) => {
    const hay = `${quiz.title} ${quiz.subject}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (filter === 'open') return quiz.isPublished;
    if (filter === 'draft') return !quiz.isPublished;
    return true;
  }), [quizzes, query, filter]);

  return (
    <div className="page">
      <PageHeader
        kicker="Rounds"
        title="What you’re hosting"
        lede="Drafts stay private until you publish them. Archiving hides a round without throwing its questions away."
        actions={<Link className="btn btn-primary" to="/host/rounds/new">New round</Link>}
      />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <div className="filters">
        <label className="search">
          <span className="sr">Search rounds</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title or subject" />
        </label>
        <div className="seg" role="group" aria-label="Filter rounds">
          {[['all', 'All'], ['open', 'Published'], ['draft', 'Drafts']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
      </div>
      {loading ? <SkeletonCards /> : visible.length === 0 ? (
        <Empty
          title={quizzes.length ? 'Nothing matches' : 'No rounds yet'}
          body={quizzes.length ? 'Try another word.' : 'Create one and it will wait here as a draft until you publish it.'}
          action={quizzes.length ? null : <Link className="btn btn-primary" to="/host/rounds/new">New round</Link>}
        />
      ) : (
        <div className="grid-cards">
          {visible.map((quiz, index) => (
            <Link key={quiz._id} to={`/host/rounds/${quiz._id}`} className="card card-hover quiz-card" style={{ animationDelay: `${index * 40}ms` }}>
              <div className="quiz-card-top">
                <Pill tone={quiz.isPublished ? 'sage' : 'ink'}>{quiz.isPublished ? 'Published' : 'Draft'}</Pill>
                <Difficulty value={quiz.difficulty} />
              </div>
              <h3>{quiz.title}</h3>
              <p className="fine">{quiz.subject}</p>
              <ul className="meta">
                <li>{formatMinutes(quiz.duration)}</li>
                <li>{quiz.questions?.length || 0} questions</li>
                <li>{quiz.totalMarks || 0} {(quiz.totalMarks || 0) === 1 ? 'pt' : 'pts'}</li>
                <li>{ago(quiz.updatedAt)}</li>
              </ul>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
