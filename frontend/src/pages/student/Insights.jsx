import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Trend } from '../../components/Charts';
import { Banner, Empty, PageHeader, Pill, Stat } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { formatWhen } from '../../utils';

export default function Insights() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const id = studentId || user._id;
  const mine = String(id) === String(user._id);
  useTitle(mine ? 'Insights' : 'Student');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/api/analytics/student/${id}`)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const history = data?.scoreHistory || [];
  const trend = data?.improvementTrend || [];

  return (
    <div className="page">
      <PageHeader
        kicker={mine ? 'Insights' : 'Person'}
        title={mine ? 'Where you’re heading' : (data?.student?.name || 'Student')}
        lede={mine
          ? 'A rolling look at your scores, plus topics that are still under 60%.'
          : `${data?.student?.email || ''} ${data?.student?.department ? `· ${data.student.department}` : ''}`}
        actions={!mine ? <Link className="btn btn-ghost" to="/host/people">All people</Link> : null}
      />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      {loading ? <p className="fine">Gathering scores…</p> : null}
      {data ? (
        <>
          <section className="stats">
            <Stat label="Rounds" value={data.totalQuizzes || 0} />
            <Stat label="Average" value={`${data.averageScore || 0}%`} />
            <Stat label="To revisit" value={data.weakConcepts?.length || 0} />
          </section>
          <section className="card">
            <h2>Scores over time</h2>
            <Trend
              labels={history.map((item) => item.date)}
              actual={trend.map((item) => item.actual)}
              average={trend.map((item) => item.movingAvg)}
            />
          </section>
          <section className="split">
            <article className="card">
              <h2>Topics to revisit</h2>
              {data.weakConcepts?.length ? (
                <ul className="stack plain">
                  {data.weakConcepts.map((item) => (
                    <li key={item.subject} className="link-card static">
                      <span>{item.subject}</span>
                      <Pill tone="amber">{item.averageScore}% avg</Pill>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="fine">Nothing under 60% right now. That’s a nice place to be.</p>
              )}
            </article>
            <article className="card">
              <h2>Round by round</h2>
              {history.length === 0 ? <Empty title="No scores yet" body="Finished rounds will line up here." /> : (
                <ul className="stack plain">
                  {[...history].reverse().map((item) => (
                    <li key={`${item.quizId}-${item.date}`} className="link-card static">
                      <span>
                        <strong>{item.quizTitle || 'Round'}</strong>
                        <small>{item.subject} · {formatWhen(item.date)}</small>
                      </span>
                      <span className={item.passed ? 'score-good' : 'score-miss'}>{item.percentage}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
