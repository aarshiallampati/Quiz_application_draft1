import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { Banner, Button, DepartmentList, Field, PageHeader, Pill } from '../../components/Ui';
import { useConfirm, useToast } from '../../components/Ui';
import { useTitle } from '../../hooks';
import { toLocalInput } from '../../utils';

const EMPTY = {
  title: '',
  description: '',
  subject: '',
  duration: 20,
  passingScore: 40,
  maxAttempts: 1,
  numberOfQuestions: 0,
  quizMode: 'immediate',
  scheduledStart: '',
  scheduledEnd: '',
  difficulty: 'medium',
  department: '',
  semester: '',
  quizDate: '',
  shuffleQuestions: false,
  shuffleOptions: false,
  isPublished: false,
};

function fromQuiz(quiz) {
  return {
    title: quiz.title || '',
    description: quiz.description || '',
    subject: quiz.subject || '',
    duration: quiz.duration ?? 20,
    passingScore: quiz.passingScore ?? 40,
    maxAttempts: quiz.maxAttempts ?? 1,
    numberOfQuestions: quiz.numberOfQuestions ?? 0,
    quizMode: quiz.quizMode || 'immediate',
    scheduledStart: toLocalInput(quiz.scheduledStart),
    scheduledEnd: toLocalInput(quiz.scheduledEnd),
    difficulty: quiz.difficulty || 'medium',
    department: quiz.department || '',
    semester: quiz.semester ? String(quiz.semester) : '',
    quizDate: toLocalInput(quiz.quizDate),
    shuffleQuestions: Boolean(quiz.shuffleQuestions),
    shuffleOptions: Boolean(quiz.shuffleOptions),
    isPublished: Boolean(quiz.isPublished),
  };
}

function toPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    subject: form.subject.trim(),
    duration: Number(form.duration),
    passingScore: Number(form.passingScore),
    maxAttempts: Number(form.maxAttempts),
    numberOfQuestions: Number(form.numberOfQuestions) || 0,
    quizMode: form.quizMode,
    difficulty: form.difficulty,
    shuffleQuestions: Boolean(form.shuffleQuestions),
    shuffleOptions: Boolean(form.shuffleOptions),
    isPublished: Boolean(form.isPublished),
    department: form.department.trim() || null,
    semester: form.semester ? Number(form.semester) : null,
    scheduledStart: form.quizMode === 'scheduled' && form.scheduledStart ? new Date(form.scheduledStart).toISOString() : null,
    scheduledEnd: form.quizMode === 'scheduled' && form.scheduledEnd ? new Date(form.scheduledEnd).toISOString() : null,
    quizDate: form.quizDate ? new Date(form.quizDate).toISOString() : null,
  };
}

function validateQuiz(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Give the round a name.';
  if (!form.subject.trim()) errors.subject = 'Add a subject so people can tell rounds apart.';
  if (!form.duration || Number(form.duration) < 1) errors.duration = 'Set at least 1 minute.';
  if (Number(form.passingScore) < 0 || Number(form.passingScore) > 100) errors.passingScore = 'Use a percentage from 0 to 100.';
  if (!form.maxAttempts || Number(form.maxAttempts) < 1) errors.maxAttempts = 'Allow at least one attempt.';
  if ((form.department.trim() && !form.semester) || (!form.department.trim() && form.semester)) {
    errors.department = 'Set both department and semester, or leave both empty.';
  }
  if (form.quizMode === 'scheduled') {
    if (!form.scheduledStart || !form.scheduledEnd) errors.scheduledStart = 'Add a start and an end.';
    else if (new Date(form.scheduledEnd) <= new Date(form.scheduledStart)) errors.scheduledEnd = 'The end needs to be after the start.';
  }
  return errors;
}

function blankQuestion(subject) {
  return {
    text: '',
    type: 'MCQ',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    explanation: '',
    concept: '',
    difficulty: 'medium',
    subject: subject || '',
    marks: 1,
  };
}

function validateQuestion(draft) {
  const errors = {};
  if (!draft.text.trim()) errors.text = 'Write the question.';
  if (!draft.marks || Number(draft.marks) < 1) errors.marks = 'Use at least 1 point.';
  if (draft.type === 'ShortAnswer' || draft.type === 'FillBlank') return errors;
  const filled = draft.options.filter((option) => option.text.trim());
  const correct = filled.filter((option) => option.isCorrect);
  if (draft.type !== 'TrueFalse' && filled.length < 2) errors.options = 'Add at least two choices.';
  if (correct.length < 1) errors.options = 'Mark a correct choice.';
  if ((draft.type === 'MCQ' || draft.type === 'TrueFalse') && correct.length !== 1) {
    errors.options = 'Mark exactly one correct choice.';
  }
  return errors;
}

export default function QuizEditor() {
  const { quizId } = useParams();
  const isNew = quizId === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  useTitle(isNew ? 'New round' : 'Edit round');
  const [form, setForm] = useState(EMPTY);
  const [baseline, setBaseline] = useState('');
  const [errors, setErrors] = useState({});
  const [quiz, setQuiz] = useState(null);
  const [students, setStudents] = useState([]);
  const [picked, setPicked] = useState([]);
  const [groupDept, setGroupDept] = useState('');
  const [groupSem, setGroupSem] = useState('');
  const [pendingGroups, setPendingGroups] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [draft, setDraft] = useState(null);
  const [draftErrors, setDraftErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const allow = useRef(false);
  const dirty = baseline !== '' && baseline !== JSON.stringify(form);
  const blocker = useBlocker(() => !allow.current && dirty);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function refresh(id) {
    const [nextQuiz, people] = await Promise.all([
      api(`/api/quiz/${id}`),
      api('/api/auth/students'),
    ]);
    setQuiz(nextQuiz);
    setStudents(people || []);
    const nextForm = fromQuiz(nextQuiz);
    setForm(nextForm);
    setBaseline(JSON.stringify(nextForm));
    setPicked([]);
    setPendingGroups([]);
  }

  useEffect(() => {
    let cancelled = false;
    allow.current = false;
    if (isNew) {
      setForm(EMPTY);
      setBaseline(JSON.stringify(EMPTY));
      setQuiz(null);
      return undefined;
    }
    refresh(quizId).catch((err) => {
      if (!cancelled) setLoadError(err.message);
    });
    return () => {
      cancelled = true;
    };
  }, [quizId, isNew]);

  async function save(event) {
    event.preventDefault();
    const nextErrors = validateQuiz(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      const payload = toPayload(form);
      if (isNew) {
        const created = await api('/api/quiz', { method: 'POST', body: payload });
        allow.current = true;
        toast('Round created. You can add questions now.');
        navigate(`/host/rounds/${created._id}`, { replace: true });
      } else {
        const updated = await api(`/api/quiz/${quizId}`, { method: 'PUT', body: payload });
        const nextForm = fromQuiz(updated);
        setQuiz((current) => ({ ...current, ...updated, questions: current?.questions }));
        setForm(nextForm);
        setBaseline(JSON.stringify(nextForm));
        toast('Saved.', 'ok');
      }
    } catch (err) {
      toast(err.message, 'bad');
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    const ok = await confirm({
      title: 'Archive this round?',
      body: 'It leaves the lists and students won’t see it. The questions stay stored.',
      confirmLabel: 'Archive',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/quiz/${quizId}`, { method: 'DELETE' });
      allow.current = true;
      toast('Archived.');
      navigate('/host/rounds');
    } catch (err) {
      toast(err.message, 'bad');
    }
  }

  function changeType(type) {
    setDraft((current) => {
      let options = current.options;
      if (type === 'TrueFalse') {
        options = [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false },
        ];
      } else if (type === 'ShortAnswer' || type === 'FillBlank') {
        const model = current.options.find((option) => option.isCorrect)?.text || '';
        options = [{ text: model, isCorrect: true }];
      } else if (current.type === 'TrueFalse' || current.type === 'ShortAnswer' || current.type === 'FillBlank') {
        options = [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ];
      }
      if (type === 'MCQ') {
        let seen = false;
        options = options.map((option) => {
          if (option.isCorrect && !seen) {
            seen = true;
            return option;
          }
          return { ...option, isCorrect: false };
        });
        if (!seen && options[0]) options = options.map((option, index) => ({ ...option, isCorrect: index === 0 }));
      }
      return { ...current, type, options };
    });
  }

  async function addQuestion(event) {
    event.preventDefault();
    const nextErrors = validateQuestion(draft);
    setDraftErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    let options = draft.options
      .filter((option) => option.text.trim())
      .map((option) => ({ text: option.text.trim(), isCorrect: Boolean(option.isCorrect) }));
    if (draft.type === 'ShortAnswer' || draft.type === 'FillBlank') {
      options = options.map((option) => ({ ...option, isCorrect: true }));
    }
    try {
      await api(`/api/quiz/${quizId}/questions`, {
        method: 'POST',
        body: {
          text: draft.text.trim(),
          type: draft.type,
          options,
          explanation: draft.explanation.trim(),
          concept: draft.concept.trim(),
          difficulty: draft.difficulty,
          subject: draft.subject.trim() || form.subject.trim(),
          marks: Number(draft.marks) || 1,
        },
      });
      setDraft(null);
      await refresh(quizId);
      toast('Question added.', 'ok');
    } catch (err) {
      toast(err.message, 'bad');
    }
  }

  async function removeQuestion(questionId) {
    const ok = await confirm({
      title: 'Remove this question?',
      body: 'Its points come off the round total.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/quiz/question/${questionId}`, { method: 'DELETE' });
      await refresh(quizId);
      toast('Question removed.');
    } catch (err) {
      toast(err.message, 'bad');
    }
  }

  async function share() {
    const body = {};
    if (picked.length) body.studentIds = picked;
    if (pendingGroups.length) body.groups = pendingGroups;
    if (!body.studentIds && !body.groups) {
      toast('Choose a person or a group first.');
      return;
    }
    try {
      await api(`/api/quiz/${quizId}/assign`, { method: 'POST', body });
      await refresh(quizId);
      toast('Shared. The round is published for the people you added.', 'ok');
    } catch (err) {
      toast(err.message, 'bad');
    }
  }

  const questions = (quiz?.questions || []).filter((item) => item && item.text);
  const assignedIds = new Set((quiz?.assignedTo || []).map(String));
  const visibleStudents = students.filter((student) => {
    const hay = `${student.name} ${student.email} ${student.department || ''}`.toLowerCase();
    return !studentQuery || hay.includes(studentQuery.toLowerCase());
  });

  return (
    <div className="page">
      <PageHeader
        kicker={isNew ? 'New round' : 'Edit round'}
        title={form.title || 'Untitled round'}
        lede="Save the shape of the round first. Questions, sharing, and publishing sit beside it."
        actions={(
          <>
            <Link className="btn btn-ghost" to="/host/rounds">All rounds</Link>
            <Button form="quiz-form" type="submit" busy={busy}>{isNew ? 'Create round' : 'Save changes'}</Button>
          </>
        )}
      />
      {loadError ? <Banner tone="bad">{loadError}</Banner> : null}
      <div className="split">
        <form id="quiz-form" className="card" onSubmit={save}>
          <Field label="Name" error={errors.title}>
            <input value={form.title} onChange={(event) => update('title', event.target.value)} />
          </Field>
          <Field label="Subject" error={errors.subject}>
            <input value={form.subject} onChange={(event) => update('subject', event.target.value)} />
          </Field>
          <Field label="Description" hint="Optional. Students see this before they start.">
            <textarea rows={3} value={form.description} onChange={(event) => update('description', event.target.value)} />
          </Field>
          <div className="duo">
            <Field label="Minutes" error={errors.duration}>
              <input type="number" min="1" value={form.duration} onChange={(event) => update('duration', event.target.value)} />
            </Field>
            <Field label="Pass at %" error={errors.passingScore}>
              <input type="number" min="0" max="100" value={form.passingScore} onChange={(event) => update('passingScore', event.target.value)} />
            </Field>
          </div>
          <div className="duo">
            <Field label="Attempts" error={errors.maxAttempts}>
              <input type="number" min="1" value={form.maxAttempts} onChange={(event) => update('maxAttempts', event.target.value)} />
            </Field>
            <Field label="Difficulty">
              <select value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </Field>
          </div>
          <Field label="When">
            <select value={form.quizMode} onChange={(event) => update('quizMode', event.target.value)}>
              <option value="immediate">Open whenever it’s published</option>
              <option value="scheduled">Only inside a window</option>
            </select>
          </Field>
          {form.quizMode === 'scheduled' ? (
            <div className="duo">
              <Field label="Starts" error={errors.scheduledStart}>
                <input type="datetime-local" value={form.scheduledStart} onChange={(event) => update('scheduledStart', event.target.value)} />
              </Field>
              <Field label="Ends" error={errors.scheduledEnd}>
                <input type="datetime-local" value={form.scheduledEnd} onChange={(event) => update('scheduledEnd', event.target.value)} />
              </Field>
            </div>
          ) : null}
          <Field label="Show on" hint="Optional date stamp. It doesn’t open or close the round.">
            <input type="datetime-local" value={form.quizDate} onChange={(event) => update('quizDate', event.target.value)} />
          </Field>
          <div className="duo">
            <Field label="Department" error={errors.department} hint="Leave both empty unless a whole group should see it.">
              <input list="departments" value={form.department} onChange={(event) => update('department', event.target.value)} />
            </Field>
            <Field label="Semester">
              <select value={form.semester} onChange={(event) => update('semester', event.target.value)}>
                <option value="">None</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <DepartmentList />
          <Field
            label="Questions to show"
            hint="0 shows every question. A smaller number only displays that many, but scoring still includes the full set — leave this at 0 unless you mean that."
          >
            <input type="number" min="0" value={form.numberOfQuestions} onChange={(event) => update('numberOfQuestions', event.target.value)} />
          </Field>
          <label className="switch">
            <input type="checkbox" checked={form.shuffleQuestions} onChange={(event) => update('shuffleQuestions', event.target.checked)} />
            <span>Shuffle question order when someone starts</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={form.shuffleOptions} onChange={(event) => update('shuffleOptions', event.target.checked)} />
            <span>Shuffle choices. Scoring still uses the original position, so it stays fair.</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} />
            <span>Published. With no people and no department, every student can see it.</span>
          </label>
          {!isNew ? (
            <button type="button" className="btn btn-danger" onClick={archive}>Archive round</button>
          ) : null}
        </form>

        <div className="stack">
          <article className="card">
            <div className="section-head">
              <h2>Questions</h2>
              {!isNew ? <button type="button" className="btn btn-primary btn-sm" onClick={() => { setDraft(blankQuestion(form.subject)); setDraftErrors({}); }}>Add</button> : null}
            </div>
            {isNew ? <p className="fine">Create the round first, then add questions here.</p> : null}
            {!isNew ? <p className="fine">{questions.length} {questions.length === 1 ? 'question' : 'questions'} · {quiz?.totalMarks || 0} {(quiz?.totalMarks || 0) === 1 ? 'pt' : 'pts'}. There’s no edit endpoint, so removing and adding again is how you change one.</p> : null}
            {questions.map((question, index) => (
              <div key={question._id} className="q-row">
                <div>
                  <Pill>{question.type}</Pill>
                  <p>{index + 1}. {question.text}</p>
                  <p className="fine">{question.marks || 1} pt</p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeQuestion(question._id)}>Remove</button>
              </div>
            ))}
          </article>

          {!isNew ? (
            <article className="card">
              <h2>Share</h2>
              <p className="fine">Adding people publishes the round. People you add stay on it — there isn’t a way to remove them yet. A department and semester on the round itself also opens it to that whole group.</p>
              {(quiz?.assignedGroups || []).length > 0 ? (
                <div className="chips">
                  {quiz.assignedGroups.map((group, index) => (
                    <span key={`${group.department}-${group.semester}-${index}`} className="pill pill-ink">{group.department} · sem {group.semester}</span>
                  ))}
                </div>
              ) : null}
              <label className="search">
                <span className="sr">Search students</span>
                <input value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Search students" />
              </label>
              <div className="pick-list">
                {visibleStudents.map((student) => {
                  const already = assignedIds.has(String(student._id));
                  const on = picked.includes(student._id);
                  return (
                    <label key={student._id} className="pick">
                      <input
                        type="checkbox"
                        disabled={already}
                        checked={already || on}
                        onChange={() => setPicked((current) => (on ? current.filter((id) => id !== student._id) : [...current, student._id]))}
                      />
                      <span>
                        <strong>{student.name}</strong>
                        <small>{student.email}{student.department ? ` · ${student.department}` : ''}{already ? ' · already in' : ''}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="duo">
                <Field label="Group department">
                  <input list="departments" value={groupDept} onChange={(event) => setGroupDept(event.target.value)} />
                </Field>
                <Field label="Group semester">
                  <select value={groupSem} onChange={(event) => setGroupSem(event.target.value)}>
                    <option value="">Choose</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (!groupDept.trim() || !groupSem) {
                    toast('A group needs both a department and a semester.');
                    return;
                  }
                  setPendingGroups((current) => [...current, { department: groupDept.trim(), semester: Number(groupSem) }]);
                  setGroupDept('');
                  setGroupSem('');
                }}
              >
                Queue group
              </button>
              {pendingGroups.length > 0 ? (
                <div className="chips">
                  {pendingGroups.map((group, index) => (
                    <button key={`${group.department}-${index}`} type="button" className="pill pill-amber" onClick={() => setPendingGroups((current) => current.filter((_, item) => item !== index))}>
                      {group.department} · sem {group.semester} · remove
                    </button>
                  ))}
                </div>
              ) : null}
              <Button onClick={share}>Share and publish</Button>
            </article>
          ) : null}
        </div>
      </div>

      {draft ? (
        <div className="modal-back" onMouseDown={() => setDraft(null)}>
          <form className="modal modal-lg" onSubmit={addQuestion} onMouseDown={(event) => event.stopPropagation()}>
            <h2>New question</h2>
            <div className="seg wrap" role="group" aria-label="Question type">
              {['MCQ', 'MSQ', 'TrueFalse', 'ShortAnswer', 'FillBlank'].map((type) => (
                <button key={type} type="button" aria-pressed={draft.type === type} onClick={() => changeType(type)}>{type === 'MCQ' ? 'One choice' : type === 'MSQ' ? 'Several' : type === 'TrueFalse' ? 'True / false' : type === 'ShortAnswer' ? 'Short reply' : 'Fill blank'}</button>
              ))}
            </div>
            <Field label="Question" error={draftErrors.text}>
              <textarea rows={3} value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
            </Field>
            {draft.type === 'ShortAnswer' || draft.type === 'FillBlank' ? (
              <Field label="Answer you have in mind" hint="Optional. Stored so the review can show it. Typed replies are not auto-scored.">
                <input value={draft.options[0]?.text || ''} onChange={(event) => setDraft({ ...draft, options: [{ text: event.target.value, isCorrect: true }] })} />
              </Field>
            ) : (
              <div className="stack">
                {draftErrors.options ? <p className="field-error" role="alert">{draftErrors.options}</p> : null}
                {draft.options.map((option, index) => (
                  <div key={index} className="option-edit">
                    <input
                      value={option.text}
                      placeholder={`Choice ${index + 1}`}
                      onChange={(event) => {
                        const options = draft.options.map((item, itemIndex) => (itemIndex === index ? { ...item, text: event.target.value } : item));
                        setDraft({ ...draft, options });
                      }}
                    />
                    <label className="pick slim">
                      <input
                        type={draft.type === 'MSQ' ? 'checkbox' : 'radio'}
                        name="correct"
                        checked={option.isCorrect}
                        onChange={() => {
                          const options = draft.options.map((item, itemIndex) => {
                            if (draft.type === 'MSQ') return itemIndex === index ? { ...item, isCorrect: !item.isCorrect } : item;
                            return { ...item, isCorrect: itemIndex === index };
                          });
                          setDraft({ ...draft, options });
                        }}
                      />
                      <span>Correct</span>
                    </label>
                    {draft.type !== 'TrueFalse' && draft.options.length > 2 ? (
                      <button type="button" className="text-btn" onClick={() => setDraft({ ...draft, options: draft.options.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
                    ) : null}
                  </div>
                ))}
                {draft.type !== 'TrueFalse' ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft({ ...draft, options: [...draft.options, { text: '', isCorrect: false }] })}>Add a choice</button>
                ) : null}
              </div>
            )}
            <div className="duo">
              <Field label="Points" error={draftErrors.marks}>
                <input type="number" min="1" value={draft.marks} onChange={(event) => setDraft({ ...draft, marks: event.target.value })} />
              </Field>
              <Field label="Difficulty">
                <select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
            </div>
            <Field label="Concept" hint="Used when a miss gets a study note.">
              <input value={draft.concept} onChange={(event) => setDraft({ ...draft, concept: event.target.value })} />
            </Field>
            <Field label="Why it’s right" hint="Shown on the review after someone sends the round.">
              <textarea rows={2} value={draft.explanation} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} />
            </Field>
            <div className="row-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Cancel</button>
              <Button type="submit">Add question</Button>
            </div>
          </form>
        </div>
      ) : null}

      {blocker.state === 'blocked' ? (
        <div className="modal-back">
          <div className="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="dirty-title">
            <h2 id="dirty-title">Leave without saving?</h2>
            <p className="lede">The latest edits on this form haven’t been saved.</p>
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
