import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { BrandMark } from '../components/Icons';
import { Banner, Button, DepartmentList, Field, PasswordField } from '../components/Ui';
import { useTitle } from '../hooks';
import { homeFor } from '../utils';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  useTitle('Create account');
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', enrollmentId: '', department: '', semester: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Those passwords don’t match.');
      return;
    }
    if ((form.department && !form.semester) || (!form.department && form.semester)) {
      setError('Set both department and semester, or leave both empty.');
      return;
    }
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role,
    };
    if (form.enrollmentId.trim()) body.enrollmentId = form.enrollmentId.trim();
    if (form.department.trim()) body.department = form.department.trim();
    if (form.semester) body.semester = Number(form.semester);
    setBusy(true);
    try {
      const me = await register(body);
      navigate(homeFor(me.role), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-copy">
        <Link to="/" className="brand"><BrandMark /><span>eduquiz</span></Link>
        <h1>Come on in.</h1>
        <p className="lede">Students take rounds. Teachers host them. You can switch that choice before you create the account.</p>
      </div>
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Create an account</h2>
        <div className="seg" role="group" aria-label="Account type">
          <button type="button" aria-pressed={role === 'student'} onClick={() => setRole('student')}>I’m a student</button>
          <button type="button" aria-pressed={role === 'admin'} onClick={() => setRole('admin')}>I’m a teacher</button>
        </div>
        {error ? <Banner tone="bad">{error}</Banner> : null}
        <Field label="Name">
          <input required value={form.name} onChange={(event) => set('name', event.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email">
          <input required type="email" value={form.email} onChange={(event) => set('email', event.target.value)} autoComplete="email" />
        </Field>
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => set('password', event.target.value)}
          hint="At least 6 characters."
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={(event) => set('confirm', event.target.value)}
        />
        <Field label="Personal code" hint="Optional. Only if you want a short id on your account.">
          <input value={form.enrollmentId} onChange={(event) => set('enrollmentId', event.target.value)} />
        </Field>
        <Field label="Department" hint="Hosts match this exactly when they share a round with a group.">
          <input list="departments" value={form.department} onChange={(event) => set('department', event.target.value)} />
        </Field>
        <DepartmentList />
        <Field label="Semester" hint="1 to 8. Leave blank if you left department blank.">
          <select value={form.semester} onChange={(event) => set('semester', event.target.value)}>
            <option value="">Skip for now</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Button type="submit" block busy={busy}>Create account</Button>
        <p className="fine center">Already have one? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
