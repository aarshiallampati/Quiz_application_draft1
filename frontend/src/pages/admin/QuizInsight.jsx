import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { Banner, Empty, PageHeader, Pill, Stat } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { clock, formatWhen } from '../../utils';

function answerText(question, indices) {
  if (!Array.isArray(indices) || !indices.length) return '—';
  return indices.map((index) => question?.options?.[index]?.text || `Choice ${Number(index) + 1}`).join(', ');
}

export default function QuizInsight() {
  const { quizId } = useParams();
  useTitle('Round stats');
  const [quiz, setQuiz] = useState(null);
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api(`/api/quiz/${quizId}`),
      api(`/api/analytics/quiz/${quizId}`),
      api(`/api/analytics/question/${quizId}`),
      api(`/api/submission/quiz/${quizId}/results`),
    ]).then(([quizRes, statsRes, questionRes, subRes]) => {
      if (cancelled) return;
      if (quizRes.status === 'fulfilled') setQuiz(quizRes.value);
      else setError(quizRes.reason.message);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (questionRes.status === 'fulfilled') setQuestions(questionRes.value || []);
      if (subRes.status === 'fulfilled') setSubs(subRes.value || []);
    });
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  const byId = new Map((quiz?.questions || []).map((question) => [String(question._id), question]));

  return (
    <div className="page">
      <PageHeader
        kicker={quiz?.subject || 'Round'}
        title={quiz?.title || 'Round stats'}
        lede="Averages, the questions people miss, and every finished attempt."
        actions={<Link className="btn btn-ghost" to="/host/results">All results</Link>}
      />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <section className="stats">
        <Stat label="Attempts" value={stats?.totalSubmissions ?? '…'} />
        <Stat label="Average" value={stats ? `${stats.averageScore}%` : '…'} />
        <Stat label="Highest" value={stats ? `${stats.highestScore}%` : '…'} />
        <Stat label="Lowest" value={stats ? `${stats.lowestScore}%` : '…'} />
        <Stat label="Cleared" value={stats ? `${stats.passRate}%` : '…'} />
      </section>
      <section className="card">
        <h2>By question</h2>
        {questions.length === 0 ? <p className="fine">No question stats yet.</p> : (
          <div className="stack">
            {questions.map((item) => {
              const full = byId.get(String(item.questionId));
              return (
                <article key={item.questionId} className="review-q">
                  <header>
                    <h3>{item.questionText}</h3>
                    <Pill tone={item.totalAttempts && item.correctPercentage >= 60 ? 'sage' : 'amber'}>
                      {item.totalAttempts ? `${item.correctPercentage}% matched` : 'No attempts'}
                    </Pill>
                  </header>
                  <p className="fine">{item.totalAttempts} attempts · about {clock(item.averageTime || 0)} each</p>
                  <div className="meter" aria-hidden="true"><span style={{ width: `${item.totalAttempts ? item.correctPercentage : 0}%` }} /></div>
                  <p className="fine">Most common miss: {item.totalAttempts ? answerText(full, item.mostCommonWrongAnswer) : '—'}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section>
        <h2>Attempts</h2>
        {subs.length === 0 ? <Empty title="Nobody has finished this yet" body="Scores will line up here after the first send." /> : (
          <div className="stack">
            {subs.map((item) => (
              <article key={item._id} className="card link-row">
                <div>
                  <strong>{item.student?.name || 'Student'}</strong>
                  <p className="fine">{item.student?.email} · {formatWhen(item.submittedAt)} · {item.score}/{item.totalMarks}</p>
                </div>
                <div className="row-actions">
                  <Pill tone={item.passed ? 'sage' : 'coral'}>{item.percentage}%</Pill>
                  <Link className="btn btn-ghost btn-sm" to={`/result/${item._id}`}>Review</Link>
                  <Link className="btn btn-ghost btn-sm" to={`/host/watch/${item._id}`}>Watch</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
