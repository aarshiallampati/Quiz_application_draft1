import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { Bars } from '../../components/Charts';
import { Banner, Button, Field, PageHeader, Stat } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { firstName, greeting } from '../../utils';

export default function HostHome() {
  const { user } = useAuth();
  useTitle('Overview');
  const [overview, setOverview] = useState(null);
  const [watch, setWatch] = useState(null);
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(event) {
    event?.preventDefault();
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (department.trim()) params.set('department', department.trim());
    if (semester) params.set('semester', semester);
    const query = params.toString() ? `?${params}` : '';
    const [stats, desk] = await Promise.allSettled([
      api(`/api/analytics/overview${query}`),
      api('/api/proctor/dashboard'),
    ]);
    if (stats.status === 'fulfilled') setOverview(stats.value);
    else setError(stats.reason.message);
    if (desk.status === 'fulfilled') setWatch(desk.value);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const summary = overview?.overview || {};
  const dayLabels = overview?.monthlyAttempts?.labels || [];
  const dayValues = overview?.monthlyAttempts?.scores || [];

  return (
    <div className="page">
      <PageHeader
        kicker={greeting()}
        title={`Hey ${firstName(user.name)}`}
        lede="A quick look at rounds, scores, and anything the watch desk wants you to notice."
        actions={<Link className="btn btn-primary" to="/host/rounds/new">New round</Link>}
      />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <form className="filters" onSubmit={load}>
        <Field label="Department">
          <input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="All departments" />
        </Field>
        <Field label="Semester">
          <select value={semester} onChange={(event) => setSemester(event.target.value)}>
            <option value="">All</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Button type="submit" variant="ghost" busy={loading}>Apply</Button>
      </form>
      <p className="fine">Attempt stats follow the filter. The student count is everyone with a student account.</p>
      <section className="stats">
        <Stat label="Rounds" value={loading ? '…' : summary.totalQuizzes ?? 0} />
        <Stat label="Students" value={loading ? '…' : summary.totalStudents ?? 0} />
        <Stat label="Attempts in view" value={loading ? '…' : summary.totalAttempts ?? 0} />
        <Stat label="Average" value={loading ? '…' : `${summary.avgScore ?? 0}%`} />
      </section>
      <section className="split">
        <article className="card">
          <h2>Average by subject</h2>
          <Bars labels={overview?.quizScores?.labels || []} values={overview?.quizScores?.scores || []} />
        </article>
        <article className="card">
          <h2>Attempts, last 7 days</h2>
          <Bars labels={dayLabels} values={dayValues} />
        </article>
      </section>
      <section className="split">
        <article className="card">
          <div className="section-head">
            <h2>Rounds in this view</h2>
            <Link to="/host/rounds">All rounds</Link>
          </div>
          {(overview?.quizDetails || []).length === 0 ? <p className="fine">No finished attempts for this filter yet.</p> : (
            <div className="stack">
              {overview.quizDetails.map((quiz) => (
                <div key={quiz.title + quiz.subject} className="link-card static">
                  <span>
                    <strong>{quiz.title}</strong>
                    <small>{quiz.subject} · {quiz.totalAttempts} attempts</small>
                  </span>
                  <strong>{quiz.avgScore}%</strong>
                </div>
              ))}
            </div>
          )}
        </article>
        <article className="card">
          <div className="section-head">
            <h2>Watch desk</h2>
            <Link to="/host/watch">Open</Link>
          </div>
          <p className="result-points">{watch?.flaggedCount ?? 0} <span>flagged</span></p>
          <p className="fine">{watch?.totalSessions ?? 0} recent sessions on the desk.</p>
        </article>
      </section>
    </div>
  );
}
