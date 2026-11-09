import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { cx, homeFor, initials } from '../utils';
import { BrandMark, Icon } from './Icons';

const studentNav = [
  { to: '/home', label: 'Home', icon: 'home', end: true },
  { to: '/home/history', label: 'History', icon: 'history' },
  { to: '/home/insights', label: 'Insights', icon: 'spark' },
];

const hostNav = [
  { to: '/host', label: 'Overview', icon: 'home', end: true },
  { to: '/host/rounds', label: 'Rounds', icon: 'rounds' },
  { to: '/host/results', label: 'Results', icon: 'chart' },
  { to: '/host/watch', label: 'Watch', icon: 'eye' },
  { to: '/host/people', label: 'People', icon: 'people' },
];

export default function Shell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const items = user?.role === 'admin' ? hostNav : studentNav;
  const profile = user?.role === 'admin' ? '/host/profile' : '/home/profile';

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  return (
    <div className="shell">
      <a className="skip-link" href="#content">Skip to content</a>
      <aside className="rail">
        <Link to={homeFor(user?.role)} className="brand">
          <BrandMark />
          <span>eduquiz</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => cx('nav-link', isActive && 'active')}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="rail-foot" ref={menuRef}>
          <button type="button" className="user-chip" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
            <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
            <span className="user-copy">
              <strong>{user?.name}</strong>
              <small>{user?.role === 'admin' ? 'Teacher' : 'Student'}</small>
            </span>
          </button>
          {open ? (
            <div className="menu" role="menu">
              <Link to={profile} role="menuitem">Profile</Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  signOut();
                  navigate('/');
                }}
              >
                <Icon name="logout" size={16} /> Log out
              </button>
            </div>
          ) : null}
        </div>
      </aside>
      <main id="content" className="main">
        <Outlet />
      </main>
    </div>
  );
}
