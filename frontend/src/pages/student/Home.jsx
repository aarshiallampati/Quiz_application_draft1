import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import QuizCard from '../../components/QuizCard';
import { Banner, Empty, PageHeader, SkeletonCards, Stat } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { ago, firstName, greeting, readActiveRound } from '../../utils';

export default function StudentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useTitle('Home');
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const active = readActiveRound(user._id);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [quizRes, historyRes, statsRes] = await Promise.allSettled([
        api('/api/quiz/student/my-quizzes'),
        api('/api/submission/history'),
        api(`/api/analytics/student/${user._id}`),
      ]);
      if (cancelled) return;
      if (quizRes.status === 'fulfilled') setQuizzes(quizRes.value || []);
      else setError(quizRes.reason.message);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user._id]);

  const usedFor = (quizId) => history.filter((item) => String(item.quiz?._id || item.quiz) === String(quizId)).length;

  return (
    <div className="page rise">
      <PageHeader
        kicker={greeting()}
        title={`${firstName(user.name)}, your rounds are here.`}
        lede="Open one when you’re ready. You can move between questions, and the timer stays honest."
      />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      {active ? (
        <div className="banner banner-warm">
          <div>
            <strong>{active.title || 'A round'} is still open.</strong>
            <p>The timer started when you did, and it keeps going.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/play/${active.quizId}`)}>Continue</button>
        </div>
      ) : null}
      <section className="stats" aria-label="Your snapshot">
        <Stat label="Rounds finished" value={stats?.totalQuizzes ?? (loading ? '…' : history.length)} />
        <Stat label="Average" value={stats ? `${stats.averageScore}%` : '—'} />
        <Stat label="Last score" value={history[0] ? `${history[0].percentage}%` : '—'} hint={history[0] ? ago(history[0].submittedAt) : 'Nothing yet'} />
      </section>
      <section>
        <div className="section-head"><h2>Open for you</h2></div>
        {loading ? <SkeletonCards /> : quizzes.length === 0 ? (
          <Empty
            title="Nothing shared yet"
            body="When a teacher publishes a round for your department and semester, or adds you by name, it lands here."
          />
        ) : (
          <div className="grid-cards">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz._id}
                quiz={quiz}
                used={usedFor(quiz._id)}
                resume={active?.quizId === quiz._id}
                onOpen={() => navigate(`/play/${quiz._id}`)}
              />
            ))}
          </div>
        )}
      </section>
      {history.length > 0 ? (
        <section>
          <div className="section-head">
            <h2>Recent</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/home/history')}>See all</button>
          </div>
          <div className="stack">
            {history.slice(0, 3).map((item) => (
              <button key={item._id} type="button" className="link-card" onClick={() => navigate(`/result/${item._id}`)}>
                <span>
                  <strong>{item.quiz?.title || 'Round'}</strong>
                  <small>{item.quiz?.subject} · {ago(item.submittedAt)}</small>
                </span>
                <span className={item.passed ? 'score-good' : 'score-miss'}>
                  {item.percentage}%
                  <small>{item.passed ? 'Cleared' : 'Not this time'}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
