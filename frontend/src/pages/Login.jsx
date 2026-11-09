import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { BrandMark } from '../components/Icons';
import { Banner, Button, Field, PasswordField } from '../components/Ui';
import { useTitle } from '../hooks';
import { homeFor } from '../utils';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useTitle('Log in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const me = await login(email.trim(), password);
      const from = location.state?.from?.pathname;
      navigate(from && from !== '/login' ? from : homeFor(me.role), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-copy">
        <Link to="/" className="brand"><BrandMark /><span>eduquiz</span></Link>
        <h1>Welcome back.</h1>
        <p className="lede">Pick up a round, or see how the last one went.</p>
      </div>
      <form className="auth-card" onSubmit={onSubmit}>
        <h2>Log in</h2>
        {error ? <Banner tone="bad">{error}</Banner> : null}
        <Field label="Email">
          <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit" variant="primary" block busy={busy}>Log in</Button>
        <p className="fine center">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
