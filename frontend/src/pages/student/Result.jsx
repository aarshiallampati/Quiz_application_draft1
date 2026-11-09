import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, assetUrl } from '../../api';
import { useAuth } from '../../auth';
import { ScoreRing } from '../../components/Charts';
import { Banner, PageHeader, Pill } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { clock, cx } from '../../utils';

function describeAnswer(answer) {
  const question = answer.question;
  if (answer.textAnswer) return answer.textAnswer;
  const picks = answer.selectedOptions || [];
  if (!picks.length || (picks.length === 1 && picks[0] < 0)) return 'Not answered';
  if (!question?.options) return picks.map((index) => `Choice ${index + 1}`).join(', ');
  return picks.map((index) => question.options[index]?.text || `Choice ${index + 1}`).join(', ');
}

function correctText(question) {
  return (question?.options || []).filter((option) => option.isCorrect).map((option) => option.text).join(', ');
}

export default function Result() {
  const { submissionId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const fresh = location.state?.fresh;
  useTitle('Result');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    let timer;
    async function load() {
      try {
        const result = await api(`/api/submission/${submissionId}/result`);
        if (cancelled) return;
        setData(result);
        setLoading(false);
        if (!result.reportUrl && tries < 8) {
          tries += 1;
          timer = setTimeout(load, 3000);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [submissionId]);

  const percentage = data?.percentage ?? fresh?.percentage ?? 0;
  const passed = data?.passed ?? fresh?.passed ?? false;
  const score = data?.score ?? fresh?.score;
  const total = data?.totalMarks ?? fresh?.totalMarks;
  const insights = new Map((data?.aiAnalysis || fresh?.aiAnalysis || []).map((item) => [String(item.question), item]));
  const back = user?.role === 'admin' ? '/host/results' : '/home';

  return (
    <div className="page">
      <PageHeader
        kicker={data?.quiz?.subject || 'Result'}
        title={data?.quiz?.title || 'Your result'}
        lede={passed ? 'You cleared it. The review below is the useful part.' : 'Not this time. The review shows where it slipped.'}
        actions={<Link className="btn btn-ghost" to={back}>Back</Link>}
      />
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <section className={cx('card result-hero', passed && 'cleared')}>
        {passed && !reduceMotion ? (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 16 }, (_, index) => <i key={index} style={{ left: `${6 + (index * 6) % 90}%`, animationDelay: `${index * 40}ms`, background: ['#e25b38', '#1f7a6b', '#f0c56a', '#fffaf4'][index % 4] }} />)}
          </div>
        ) : null}
        <ScoreRing value={percentage} passed={passed} />
        <div>
          <Pill tone={passed ? 'sage' : 'coral'}>{passed ? 'Cleared' : 'Not this time'}</Pill>
          <p className="result-points">{score ?? '…'} <span>/ {total ?? '…'} pts</span></p>
          <p className="fine">
            {data ? `${clock(data.timeTaken || 0)} spent` : loading ? 'Pulling the full review…' : ''}
            {data?.student && user?.role === 'admin' ? ` · ${data.student.name}` : ''}
          </p>
          <div className="row-actions">
            {data?.reportUrl ? (
              <a className="btn btn-soft" href={assetUrl(data.reportUrl)} target="_blank" rel="noreferrer">Download the report</a>
            ) : (
              <span className="fine">The report is being prepared. This page will pick it up.</span>
            )}
            {user?.role === 'admin' ? <Link className="btn btn-ghost btn-sm" to={`/host/watch/${submissionId}`}>Watch log</Link> : null}
          </div>
        </div>
      </section>
      <section>
        <h2>Question review</h2>
        {!data && loading ? <p className="fine">Loading each answer…</p> : null}
        {(data?.answers || []).map((answer, index) => {
          const question = answer.question;
          const written = question?.type === 'ShortAnswer' || question?.type === 'FillBlank';
          const insight = insights.get(String(question?._id || answer.question));
          return (
            <article key={answer._id || index} className="review-q">
              <header>
                <h3>Q{index + 1}. {question?.text || 'Question'}</h3>
                <Pill tone={answer.isCorrect ? 'sage' : 'coral'}>{answer.isCorrect ? 'Matched' : written ? 'Saved for review' : 'Not matched'}</Pill>
              </header>
              <p><strong>Your answer.</strong> {describeAnswer(answer)}</p>
              {!answer.isCorrect && correctText(question) ? <p><strong>Marked correct.</strong> {correctText(question)}</p> : null}
              {written && !answer.isCorrect ? <p className="fine">Typed answers are stored. The server doesn’t auto-score them, so this one is marked as missed even if the wording is close.</p> : null}
              {question?.explanation ? <p className="fine">{question.explanation}</p> : null}
              <p className="fine">{answer.marksAwarded || 0} / {question?.marks || 1} pts</p>
              {insight ? (
                <div className="insight miss">
                  <strong>{insight.concept || 'A note on this one'}</strong>
                  {insight.whyWrong ? <p>{insight.whyWrong}</p> : null}
                  {insight.correctExplanation ? <p>{insight.correctExplanation}</p> : null}
                  {insight.studyTip ? <p><strong>Try this.</strong> {insight.studyTip}</p> : null}
                  {insight.youtubeLinks?.length ? (
                    <div className="yt">
                      {insight.youtubeLinks.map((link) => (
                        <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.title}</a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
