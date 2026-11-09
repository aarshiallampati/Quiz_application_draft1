import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner, Button, PageHeader, PasswordField } from '../components/Ui';
import { useToast } from '../components/Ui';
import { useTitle } from '../hooks';

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();
  useTitle('Profile');
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Those new passwords don’t match.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/auth/change-password', {
        method: 'PUT',
        body: { currentPassword, newPassword },
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      toast('Password updated.', 'ok');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <PageHeader kicker="Account" title="Your details" lede="Name and group were set when the account was created. Password is the piece you can change." />
      <section className="split">
        <article className="card">
          <h2>Profile</h2>
          <dl className="defs">
            <div><dt>Name</dt><dd>{user?.name}</dd></div>
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
            <div><dt>Role</dt><dd>{user?.role === 'admin' ? 'Teacher' : 'Student'}</dd></div>
            <div><dt>Department</dt><dd>{user?.department || 'Not set'}</dd></div>
            <div><dt>Semester</dt><dd>{user?.semester || 'Not set'}</dd></div>
            <div><dt>Personal code</dt><dd>{user?.enrollmentId || 'Not set'}</dd></div>
          </dl>
        </article>
        <form className="card" onSubmit={onSubmit}>
          <h2>Change password</h2>
          {error ? <Banner tone="bad">{error}</Banner> : null}
          <PasswordField label="Current password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrent(event.target.value)} />
          <PasswordField label="New password" autoComplete="new-password" value={newPassword} onChange={(event) => setNext(event.target.value)} hint="At least 6 characters." />
          <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          <Button type="submit" busy={busy}>Update password</Button>
        </form>
      </section>
    </div>
  );
}
