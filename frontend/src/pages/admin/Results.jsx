import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { Banner, Empty, PageHeader, Pill, SkeletonCards } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { ago } from '../../utils';

export default function Results() {
  useTitle('Results');
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [query, setQuery] = useState('');
  const [quizId, setQuizId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api('/api/submission/all'), api('/api/quiz')]).then(([subs, list]) => {
      if (subs.status === 'fulfilled') setSubmissions(subs.value || []);
      else setError(subs.reason.message);
      if (list.status === 'fulfilled') setQuizzes(list.value || []);
      setLoading(false);
    });
  }, []);

  const visible = useMemo(() => submissions.filter((item) => {
    const hay = `${item.student?.name || ''} ${item.student?.email || ''} ${item.quiz?.title || ''}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (quizId && String(item.quiz?._id || item.quiz) !== quizId) return false;
    return true;
  }), [submissions, query, quizId]);

  return (
    <div className="page">
      <PageHeader kicker="Results" title="How people did" lede="The latest 100 finished attempts. Open a round for the full picture, or a single response for the review." />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      {submissions.length >= 100 ? <p className="fine">Showing the latest 100.</p> : null}
      <div className="filters">
        <label className="search">
          <span className="sr">Search results</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a person or round" />
        </label>
        <label className="field compact">
          <span className="field-label">Round</span>
          <select value={quizId} onChange={(event) => setQuizId(event.target.value)}>
            <option value="">All rounds</option>
            {quizzes.map((quiz) => <option key={quiz._id} value={quiz._id}>{quiz.title}</option>)}
          </select>
        </label>
      </div>
      {loading ? <SkeletonCards /> : visible.length === 0 ? (
        <Empty title="No results yet" body="When someone sends a round, it shows up here." />
      ) : (
        <div className="stack">
          {visible.map((item) => (
            <article key={item._id} className="card link-row">
              <div>
                <div className="quiz-card-top">
                  <Pill tone={item.passed ? 'sage' : 'coral'}>{item.passed ? 'Cleared' : 'Not this time'}</Pill>
                  <span className="fine">{ago(item.submittedAt)}</span>
                </div>
                <h2>{item.student?.name || 'Student'}</h2>
                <p className="fine">{item.quiz?.title} · {item.quiz?.subject} · {item.score}/{item.totalMarks} pts</p>
              </div>
              <div className="row-actions">
                <strong className={item.passed ? 'score-good' : 'score-miss'}>{item.percentage}%</strong>
                <Link className="btn btn-primary btn-sm" to={`/result/${item._id}`}>Review</Link>
                {item.quiz?._id ? <Link className="btn btn-ghost btn-sm" to={`/host/results/${item.quiz._id}`}>Round stats</Link> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
