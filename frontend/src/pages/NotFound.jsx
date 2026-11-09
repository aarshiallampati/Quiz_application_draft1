import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { useTitle } from '../hooks';
import { homeFor } from '../utils';

export default function NotFound() {
  const { user } = useAuth();
  useTitle('Not found');
  return (
    <div className="brief">
      <p className="kicker">404</p>
      <h1>That page isn’t here.</h1>
      <p className="lede">The link may have wandered off. Your rounds are still where you left them.</p>
      <Link className="btn btn-primary" to={user ? homeFor(user.role) : '/'}>Back home</Link>
    </div>
  );
}
