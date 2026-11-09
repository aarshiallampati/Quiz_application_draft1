import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, assetUrl } from '../../api';
import { Banner, Empty, PageHeader, Pill } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { EVENT_LABELS, ago, formatWhen, recommendationLabel, recommendationTone } from '../../utils';

export default function Proctor() {
  useTitle('Watch');
  const [data, setData] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/proctor/dashboard')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const logs = data?.logs || [];
  const visible = useMemo(() => logs.filter((log) => {
    const hay = `${log.student?.name || ''} ${log.quiz?.title || ''}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (filter === 'flagged') return log.recommendation === 'flag' || log.recommendation === 'disqualify';
    if (filter === 'review') return log.recommendation === 'review';
    if (filter === 'clear') return !log.recommendation || log.recommendation === 'none';
    return true;
  }), [logs, query, filter]);

  return (
    <div className="page">
      <PageHeader
        kicker="Watch"
        title="Sessions worth a look"
        lede={`${data?.flaggedCount ?? 0} flagged of ${data?.totalSessions ?? 0} recent sessions. Scores add up from tab switches, focus, paste, and face checks.`}
      />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <div className="filters">
        <label className="search">
          <span className="sr">Search sessions</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a person or round" />
        </label>
        <div className="seg" role="group" aria-label="Filter sessions">
          {[['all', 'All'], ['flagged', 'Flagged'], ['review', 'Review'], ['clear', 'Clear']].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
      </div>
      {data && visible.length === 0 ? (
        <Empty title="Nothing on the desk" body="Notes appear here after someone starts a watched round." />
      ) : (
        <div className="stack">
          {visible.map((log) => (
            <Link key={log._id} to={`/host/watch/${log.submission}`} className="card card-hover">
              <div className="quiz-card-top">
                <Pill tone={recommendationTone(log.recommendation)}>{recommendationLabel(log.recommendation)}</Pill>
                <span className="fine">{ago(log.updatedAt)}</span>
              </div>
              <h3>{log.student?.name || 'Student'}</h3>
              <p className="fine">{log.quiz?.title || 'Round'} · {log.events?.length || 0} notes · {log.snapshots?.length || 0} snapshots</p>
              <div className="meter" aria-hidden="true"><span style={{ width: `${Math.min(100, ((log.severityScore || 0) / 20) * 100)}%` }} /></div>
              <p className="fine">Score {log.severityScore || 0}. 5 suggests a look, 12 a flag, 20 disqualify.</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProctorDetail() {
  const { submissionId } = useParams();
  useTitle('Watch log');
  const [log, setLog] = useState(null);
  const [error, setError] = useState('');
  const [shot, setShot] = useState(null);

  useEffect(() => {
    api(`/api/proctor/session/${submissionId}`)
      .then(setLog)
      .catch((err) => setError(err.message));
  }, [submissionId]);

  useEffect(() => {
    if (!shot) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setShot(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shot]);

  return (
    <div className="page">
      <PageHeader
        kicker="Watch"
        title={log?.student?.name || 'Session'}
        lede={log ? `${log.quiz?.title || 'Round'} · score ${log.severityScore || 0}` : 'Loading the log…'}
        actions={<Link className="btn btn-ghost" to="/host/watch">All sessions</Link>}
      />
      {error ? <Banner tone="bad">{error === 'No proctor logs found' ? 'No watch log for this attempt yet.' : error}</Banner> : null}
      {log ? (
        <>
          <div className="quiz-card-top">
            <Pill tone={recommendationTone(log.recommendation)}>{recommendationLabel(log.recommendation)}</Pill>
            <Pill>{log.events?.length || 0} notes</Pill>
            <Pill>{log.snapshots?.length || 0} snapshots</Pill>
          </div>
          <section className="split">
            <article className="card">
              <h2>What happened</h2>
              {(log.events || []).length === 0 ? <p className="fine">No events recorded.</p> : (
                <ol className="timeline">
                  {[...log.events].reverse().map((event, index) => (
                    <li key={`${event.timestamp}-${index}`}>
                      <span className={`dot ${event.severity || 'medium'}`} />
                      <div>
                        <strong>{EVENT_LABELS[event.type] || event.type}</strong>
                        <p className="fine">{formatWhen(event.timestamp)} · {event.severity}{event.details ? ` · ${event.details}` : ''}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </article>
            <article className="card">
              <h2>Snapshots</h2>
              {(log.snapshots || []).length === 0 ? <p className="fine">No snapshots saved.</p> : (
                <div className="snapshot-grid">
                  {log.snapshots.map((item, index) => (
                    <button key={`${item.image}-${index}`} type="button" onClick={() => setShot(item)}>
                      <img src={assetUrl(item.image)} alt={`Snapshot from ${formatWhen(item.timestamp)}`} />
                    </button>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
      {shot ? (
        <div className="modal-back" onMouseDown={() => setShot(null)}>
          <div className="modal modal-lg" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Snapshot">
            <img src={assetUrl(shot.image)} alt={`Snapshot from ${formatWhen(shot.timestamp)}`} />
            <div className="row-actions">
              <p className="fine">{formatWhen(shot.timestamp)}</p>
              <button type="button" className="btn btn-ghost" onClick={() => setShot(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
