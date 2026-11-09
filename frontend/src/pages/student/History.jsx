import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { assetUrl } from '../../api';
import { Banner, Empty, PageHeader, Pill, SkeletonCards } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { ago, clock } from '../../utils';

export default function History() {
  const navigate = useNavigate();
  useTitle('History');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api('/api/submission/history')
      .then((data) => setItems(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => items.filter((item) => {
    const hay = `${item.quiz?.title || ''} ${item.quiz?.subject || ''}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (filter === 'cleared') return item.passed;
    if (filter === 'missed') return !item.passed;
    return true;
  }), [items, query, filter]);

  return (
    <div className="page">
      <PageHeader kicker="History" title="How it went" lede="Every finished round stays here, newest first." />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <div className="filters">
        <label className="search">
          <span className="sr">Search rounds</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or subject" />
        </label>
        <div className="seg" role="group" aria-label="Filter results">
          {[['all', 'All'], ['cleared', 'Cleared'], ['missed', 'Missed']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
      </div>
      {loading ? <SkeletonCards /> : visible.length === 0 ? (
        <Empty title={items.length ? 'Nothing matches' : 'No finished rounds yet'} body={items.length ? 'Try a different word, or show all of them.' : 'Once you send a round, the score lands here.'} />
      ) : (
        <div className="stack">
          {visible.map((item) => (
            <article key={item._id} className="card link-row">
              <div>
                <div className="quiz-card-top">
                  <Pill tone={item.passed ? 'sage' : 'coral'}>{item.passed ? 'Cleared' : 'Not this time'}</Pill>
                  <span className="fine">{ago(item.submittedAt)}</span>
                </div>
                <h2>{item.quiz?.title || 'Round'}</h2>
                <p className="fine">{item.quiz?.subject || 'General'} · {item.score}/{item.totalMarks} pts · {clock(item.timeTaken || 0)}</p>
              </div>
              <div className="row-actions">
                <strong className={item.passed ? 'score-good' : 'score-miss'}>{item.percentage}%</strong>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/result/${item._id}`)}>Review</button>
                {item.reportUrl ? <a className="btn btn-ghost btn-sm" href={assetUrl(item.reportUrl)} target="_blank" rel="noreferrer">Report</a> : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
