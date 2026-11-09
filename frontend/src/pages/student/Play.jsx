import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { BrandMark } from '../../components/Icons';
import { Banner, Button, Difficulty, Pill, Splash } from '../../components/Ui';
import { useConfirm, useToast } from '../../components/Ui';
import { useTitle } from '../../hooks';
import {
  clearActiveRound,
  clock,
  cx,
  formatMinutes,
  isSelected,
  readActiveRound,
  readAnswers,
  saveActiveRound,
  saveAnswers,
  seededOrder,
} from '../../utils';

const HINTS = {
  MCQ: 'Pick one.',
  MSQ: 'Pick every one that fits.',
  TrueFalse: 'True or false.',
  ShortAnswer: 'Type your answer. Written replies are saved. Auto-scoring currently marks them as missed.',
  FillBlank: 'Fill the blank. Written replies are saved. Auto-scoring currently marks them as missed.',
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function answered(question, answer) {
  return isSelected(answer?.selected);
}

export default function Play() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  useTitle('Round');
  const [quiz, setQuiz] = useState(null);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api('/api/quiz/student/my-quizzes'),
      api('/api/submission/history'),
    ]).then(([quizRes, historyRes]) => {
      if (cancelled) return;
      if (quizRes.status !== 'fulfilled') {
        setError(quizRes.reason.message);
        setLoading(false);
        return;
      }
      const found = (quizRes.value || []).find((item) => item._id === quizId);
      if (!found) setMissing(true);
      else setQuiz(found);
      if (historyRes.status === 'fulfilled') {
        const count = (historyRes.value || []).filter((item) => String(item.quiz?._id || item.quiz) === String(quizId)).length;
        setUsed(count);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  async function begin() {
    setError('');
    setStarting(true);
    try {
      await document.documentElement.requestFullscreen().catch(() => {});
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          // A permission prompt that never resolves must not freeze the start button.
          const primer = await Promise.race([
            navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('camera-timeout')), 4000);
            }),
          ]);
          primer.getTracks().forEach((track) => track.stop());
        } catch {
          /* Camera can stay off. The round still runs. */
        }
      }
      const data = await api(`/api/submission/start/${quizId}`, { method: 'POST' });
      const existing = readActiveRound(user._id);
      const startedAt = existing?.submissionId === data.submissionId ? existing.startedAt : Date.now();
      const next = {
        submissionId: data.submissionId,
        quizId,
        userId: user._id,
        title: data.quiz.title,
        duration: data.quiz.duration,
        shuffleOptions: Boolean(data.quiz.shuffleOptions),
        questions: data.quiz.questions || [],
        startedAt,
      };
      saveActiveRound(next);
      setSession(next);
    } catch (err) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setError(err.message);
      setStarting(false);
    }
  }

  if (loading) return <Splash label="Finding that round…" />;
  if (session) return <Room session={session} />;

  const locked = quiz && used >= (quiz.maxAttempts || 1) && readActiveRound(user._id)?.quizId !== quizId;

  return (
    <div className="brief">
      <Link to="/home" className="brand"><BrandMark /><span>eduquiz</span></Link>
      {error ? <Banner tone="bad">{error}</Banner> : null}
      {missing || !quiz ? (
        <>
          <h1>This round isn’t open for you.</h1>
          <p className="lede">It may be outside its window, still a draft, or shared with a different group.</p>
          <Link className="btn btn-primary" to="/home">Back home</Link>
        </>
      ) : (
        <>
          <p className="kicker">{quiz.subject}</p>
          <h1>{quiz.title}</h1>
          {quiz.description ? <p className="lede">{quiz.description}</p> : null}
          <div className="quiz-card-top">
            <Difficulty value={quiz.difficulty} />
            <Pill>{formatMinutes(quiz.duration)}</Pill>
            <Pill>Pass at {quiz.passingScore ?? 40}%</Pill>
            <Pill>{used} of {quiz.maxAttempts || 1} used</Pill>
          </div>
          <ul className="brief-list">
            <li>You’ll get a warning as time gets short. At zero, your choices are saved.</li>
            <li>Leaving the tab, dropping fullscreen, and copy or paste are noted for the teacher.</li>
            <li>If you allow the camera, a snapshot is saved every half minute. Face checks run only in browsers that support them.</li>
            <li>Choice questions are scored immediately. Typed answers are stored and currently marked as missed.</li>
          </ul>
          <label className="checkline">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            <span>I’ll stay with this tab and keep an eye on the time.</span>
          </label>
          <div className="row-actions">
            <Button onClick={begin} busy={starting} disabled={!agreed || locked}>
              {locked ? 'Every attempt is used' : 'I’m ready'}
            </Button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/home')}>Not now</button>
          </div>
          {!agreed && !locked ? <p className="fine">Tick the line above to start. It keeps the rules in view.</p> : null}
        </>
      )}
    </div>
  );
}

function Room({ session }) {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const questions = session.questions;
  const [answers, setAnswers] = useState(() => readAnswers(session.submissionId));
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(() => Math.round((session.startedAt + session.duration * 60 * 1000 - Date.now()) / 1000));
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(0);
  const [camOn, setCamOn] = useState(false);
  const [hidePip, setHidePip] = useState(false);
  const [announce, setAnnounce] = useState('');
  const videoRef = useRef(null);
  const answersRef = useRef(answers);
  const indexRef = useRef(0);
  const enteredRef = useRef(Date.now());
  const doneRef = useRef(false);
  const lockRef = useRef(false);
  const submitRef = useRef(null);
  const blocker = useBlocker(() => !doneRef.current);

  answersRef.current = answers;

  const question = questions[index];
  const options = useMemo(() => {
    const texts = question?.options || [];
    const order = session.shuffleOptions
      ? seededOrder(texts.length, `${session.submissionId}:${question?._id}`)
      : texts.map((_, optionIndex) => optionIndex);
    return order.map((original) => ({ original, text: texts[original] }));
  }, [question, session.shuffleOptions, session.submissionId]);

  function flush(current = answersRef.current, idx = indexRef.current) {
    const currentQuestion = questions[idx];
    if (!currentQuestion) return current;
    const delta = Math.max(0, Math.round((Date.now() - enteredRef.current) / 1000));
    enteredRef.current = Date.now();
    const previous = current[currentQuestion._id] || { timeTaken: 0 };
    return {
      ...current,
      [currentQuestion._id]: { ...previous, timeTaken: (previous.timeTaken || 0) + delta },
    };
  }

  function go(next) {
    const updated = flush();
    answersRef.current = updated;
    setAnswers(updated);
    indexRef.current = next;
    setIndex(next);
  }

  function choose(target, original) {
    setAnswers((current) => {
      const previous = current[target._id] || { timeTaken: 0 };
      if (target.type === 'MSQ') {
        const selected = new Set(previous.selected || []);
        if (selected.has(original)) selected.delete(original);
        else selected.add(original);
        return { ...current, [target._id]: { ...previous, selected: [...selected] } };
      }
      return { ...current, [target._id]: { ...previous, selected: original } };
    });
  }

  function typeAnswer(target, value) {
    setAnswers((current) => {
      const previous = current[target._id] || { timeTaken: 0 };
      return { ...current, [target._id]: { ...previous, selected: value } };
    });
  }

  async function submit(auto = false) {
    if (lockRef.current || doneRef.current) return;
    const flushed = flush();
    answersRef.current = flushed;
    setAnswers(flushed);
    const open = questions.filter((item) => !answered(item, flushed[item._id])).length;
    if (!auto) {
      const ok = await confirm({
        title: open ? 'Send with some left open?' : 'Send this round?',
        body: open
          ? `${open} still open. Empty ones count as missed.`
          : 'You can read the review as soon as it lands.',
        confirmLabel: 'Send',
      });
      if (!ok) return;
    }
    lockRef.current = true;
    setBusy(true);
    try {
      const payload = {};
      Object.entries(flushed).forEach(([id, answer]) => {
        if (!isSelected(answer?.selected)) return;
        payload[id] = { selected: answer.selected, timeTaken: answer.timeTaken || 0 };
      });
      const result = await api(`/api/submission/submit/${session.quizId}`, {
        method: 'POST',
        body: { answers: payload },
      });
      doneRef.current = true;
      clearActiveRound();
      navigate(`/result/${result.attemptId}`, { replace: true, state: { fresh: result } });
    } catch (err) {
      lockRef.current = false;
      setBusy(false);
      toast(err.message || 'Could not send. Your answers are still on this device.', 'bad');
    }
  }

  submitRef.current = submit;

  useEffect(() => {
    document.body.classList.add('is-focus');
    return () => document.body.classList.remove('is-focus');
  }, []);

  useEffect(() => {
    saveAnswers(session.submissionId, answers);
  }, [answers, session.submissionId]);

  useEffect(() => {
    const end = session.startedAt + session.duration * 60 * 1000;
    const marks = new Set();
    const tick = () => {
      const left = Math.round((end - Date.now()) / 1000);
      setRemaining(left);
      if ((left === 300 || left === 60 || left === 10) && !marks.has(left)) {
        marks.add(left);
        setAnnounce(left === 10 ? '10 seconds left' : left === 60 ? '1 minute left' : '5 minutes left');
      }
      if (left <= 0 && questions.length) submitRef.current?.(true);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [questions.length, session.duration, session.startedAt]);

  useEffect(() => {
    function onKey(event) {
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const next = Math.min(questions.length - 1, indexRef.current + 1);
        if (next !== indexRef.current) go(next);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const next = Math.max(0, indexRef.current - 1);
        if (next !== indexRef.current) go(next);
      }
      const current = questions[indexRef.current];
      const number = Number(event.key);
      if (!current || current.type === 'ShortAnswer' || current.type === 'FillBlank') return;
      if (number >= 1 && number <= (current.options || []).length) {
        const order = session.shuffleOptions
          ? seededOrder(current.options.length, `${session.submissionId}:${current._id}`)
          : current.options.map((_, optionIndex) => optionIndex);
        const original = order[number - 1];
        if (original !== undefined) choose(current, original);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [questions, session.shuffleOptions, session.submissionId]);

  useEffect(() => {
    let cancelled = false;
    let stream = null;
    const last = {};
    let misses = 0;
    let armed = Boolean(document.fullscreenElement);

    async function log(type, details) {
      if (cancelled) return;
      const now = Date.now();
      if (last[type] && now - last[type] < 2000) return;
      last[type] = now;
      try {
        await api('/api/proctor/log-event', {
          method: 'POST',
          body: {
            submissionId: session.submissionId,
            quizId: session.quizId,
            type,
            timestamp: new Date().toISOString(),
            details,
          },
        });
        if (!cancelled) setNotes((count) => count + 1);
      } catch {
        /* Don't interrupt the round. */
      }
    }

    function onVis() {
      if (document.hidden) log('tab_switch', 'Left the tab');
    }
    function onBlur() {
      if (!document.hidden) log('window_blur', 'Window lost focus');
    }
    function onCopy(event) {
      event.preventDefault();
      log('copy_paste_attempt', event.type);
    }
    function onFs() {
      if (cancelled) return;
      if (!document.fullscreenElement && armed) {
        armed = false;
        log('fullscreen_exit', 'Left fullscreen');
      } else if (document.fullscreenElement) {
        armed = true;
      }
    }
    function beforeUnload(event) {
      if (doneRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    }

    async function capture() {
      const video = videoRef.current;
      if (cancelled || !video?.videoWidth) return;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
      try {
        await api('/api/proctor/snapshot', {
          method: 'POST',
          body: { submissionId: session.submissionId, quizId: session.quizId, image: canvas.toDataURL('image/jpeg', 0.62) },
        });
      } catch {
        /* Snapshots are best-effort. */
      }
      if (cancelled || !('FaceDetector' in window)) return;
      try {
        const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
        const faces = await detector.detect(canvas);
        if (cancelled) return;
        if (!faces.length) {
          misses += 1;
          if (misses >= 2) log('face_not_detected', 'No face for two checks');
        } else {
          misses = 0;
          if (faces.length > 1) log('multiple_faces', `${faces.length} faces`);
        }
      } catch {
        /* This browser can't count faces. */
      }
    }

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCopy);
    document.addEventListener('paste', onCopy);
    document.addEventListener('fullscreenchange', onFs);
    window.addEventListener('beforeunload', beforeUnload);

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 320, height: 240 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        setCamOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) setCamOn(false);
      }
    })();

    const first = setTimeout(capture, 1600);
    const snap = setInterval(capture, 30000);

    return () => {
      cancelled = true;
      armed = false;
      clearTimeout(first);
      clearInterval(snap);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCopy);
      document.removeEventListener('paste', onCopy);
      document.removeEventListener('fullscreenchange', onFs);
      window.removeEventListener('beforeunload', beforeUnload);
      stream?.getTracks().forEach((track) => track.stop());
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [session.quizId, session.submissionId]);

  const doneCount = questions.filter((item) => answered(item, answers[item._id])).length;
  const selected = answers[question?._id]?.selected;
  const hot = remaining <= 60;

  async function refocus() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      toast('Focus mode was blocked by the browser.', 'bad');
    }
  }

  if (!questions.length) {
    doneRef.current = true;
    return (
      <div className="brief">
        <h1>This round has no questions yet.</h1>
        <p className="lede">Nothing was scored. You can head back.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>Back home</button>
      </div>
    );
  }

  return (
    <div className="player">
      <div className="sr" aria-live="polite">{announce}</div>
      <header className="player-top">
        <div>
          <p className="kicker">{session.title}</p>
          <div className="q-progress" aria-hidden="true"><span style={{ width: `${(doneCount / questions.length) * 100}%` }} /></div>
        </div>
        <div className="player-tools">
          <p className={cx('timer', hot && 'hot')} aria-hidden="true">{clock(remaining)}</p>
          <span className="sr">{hot ? 'Time is short.' : 'Time remaining'} {clock(remaining)}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={refocus}>Focus</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/home')}>Leave</button>
        </div>
      </header>
      <div className="player-body">
        <form
          className="card question-card"
          onSubmit={(event) => {
            event.preventDefault();
            if (index === questions.length - 1) submit(false);
            else go(index + 1);
          }}
        >
          <div className="quiz-card-top">
            <Pill>{question.type === 'MSQ' ? 'Select all' : question.type === 'TrueFalse' ? 'True / false' : question.type === 'MCQ' ? 'One choice' : 'Written'}</Pill>
            <span className="fine">{question.marks || 1} pt</span>
          </div>
          <fieldset>
            <legend>Question {index + 1} of {questions.length}. {question.text}</legend>
            <p className="fine">{HINTS[question.type] || 'Answer below.'}</p>
            {question.type === 'ShortAnswer' || question.type === 'FillBlank' ? (
              <textarea
                value={typeof selected === 'string' ? selected : ''}
                onChange={(event) => typeAnswer(question, event.target.value)}
                rows={5}
                placeholder="Write it in your own words"
              />
            ) : (
              <div className="options">
                {options.map((option, optionIndex) => {
                  const on = question.type === 'MSQ'
                    ? Array.isArray(selected) && selected.includes(option.original)
                    : selected === option.original;
                  return (
                    <label key={`${question._id}-${option.original}`} className={cx('option', on && 'on')}>
                      <input
                        type={question.type === 'MSQ' ? 'checkbox' : 'radio'}
                        name={question._id}
                        checked={Boolean(on)}
                        onChange={() => choose(question, option.original)}
                      />
                      <span className="option-key">{LETTERS[optionIndex] || optionIndex + 1}</span>
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>
          <div className="row-actions spread">
            <button type="button" className="btn btn-ghost" disabled={index === 0} onClick={() => go(index - 1)}>Back</button>
            <p className="fine">{doneCount} of {questions.length} answered</p>
            <button type="submit" className="btn btn-primary">{index === questions.length - 1 ? 'Send' : 'Next'}</button>
          </div>
          <p className="fine kbd-hint">Arrow keys move. Number keys pick a choice.</p>
        </form>
        <aside className="card qside">
          <h2>Questions</h2>
          <div className="qmap">
            {questions.map((item, itemIndex) => (
              <button
                key={item._id}
                type="button"
                className={cx(itemIndex === index && 'now', answered(item, answers[item._id]) && 'done')}
                aria-current={itemIndex === index ? 'true' : undefined}
                onClick={() => go(itemIndex)}
              >
                {itemIndex + 1}
              </button>
            ))}
          </div>
          <p className="fine" title="Tab switches and similar moments are recorded for the teacher.">
            Watch notes: {notes}
          </p>
        </aside>
      </div>
      <aside className={cx('pip', hidePip && 'pip-min')}>
        <video ref={videoRef} muted playsInline autoPlay />
        <footer>
          <span>{camOn ? 'Camera on' : 'Camera off'}</span>
          <button type="button" className="text-btn" onClick={() => setHidePip((value) => !value)}>{hidePip ? 'Show' : 'Hide'}</button>
        </footer>
      </aside>
      {busy ? (
        <div className="overlay" role="status">
          <span className="spinner lg" />
          <p>{remaining <= 0 ? 'Time’s up. Saving what you chose.' : 'Sending your round…'}</p>
        </div>
      ) : null}
      {blocker.state === 'blocked' ? (
        <div className="modal-back">
          <div className="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="leave-title">
            <h2 id="leave-title">Leave this round?</h2>
            <p className="lede">Your answers stay on this device. The timer keeps running.</p>
            <div className="row-actions">
              <button type="button" className="btn btn-ghost" onClick={() => blocker.reset()}>Stay</button>
              <button type="button" className="btn btn-primary" onClick={() => blocker.proceed()}>Leave</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
