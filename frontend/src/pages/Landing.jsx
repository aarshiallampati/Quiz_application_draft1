import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { BrandMark, Icon } from '../components/Icons';
import { useTitle } from '../hooks';
import { homeFor } from '../utils';

const features = [
  {
    icon: 'rounds',
    title: 'Open on your terms',
    body: 'Publish now, schedule a window, or share with a department, a semester, or a few people.',
  },
  {
    icon: 'history',
    title: 'A timer with a softer voice',
    body: 'It warns you before the end, then saves whatever you already chose. You can move between questions freely.',
  },
  {
    icon: 'spark',
    title: 'The useful part comes after',
    body: 'See what matched, what didn’t, and a short note on the misses — plus a report when it’s ready.',
  },
  {
    icon: 'eye',
    title: 'A calm watch desk',
    body: 'Teachers can keep snapshots and away-moments in one place, without turning the room into a siren.',
  },
];

export default function Landing() {
  const { user } = useAuth();
  useTitle('');
  const destination = user ? homeFor(user.role) : '/register';

  return (
    <div className="marketing">
      <a className="skip-link" href="#content">Skip to content</a>
      <header className="market-nav">
        <Link to="/" className="brand">
          <BrandMark />
          <span>eduquiz</span>
        </Link>
        <div className="page-actions">
          {user ? (
            <Link className="btn btn-primary" to={destination}>Go to your space</Link>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">Log in</Link>
              <Link className="btn btn-primary" to="/register">Create an account</Link>
            </>
          )}
        </div>
      </header>
      <main id="content">
        <section className="hero">
          <div className="rise">
            <p className="kicker">Students and teachers, minus the clipboard</p>
            <h1>Quizzes with the <em>volume</em> turned down.</h1>
            <p className="lede">
              Host a round, share it with the right people, and take it without the usual institutional glare.
              Timers, choices, and a clear look afterward — still all here.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to={destination}>{user ? 'Continue' : 'Get started'}</Link>
              {!user ? <Link className="btn btn-ghost" to="/login">I already have an account</Link> : null}
            </div>
          </div>
          <div className="hero-stage" aria-hidden="true">
            <div className="mock">
              <div className="mock-top">
                <span className="pill pill-cream">Warm-up</span>
                <strong>12:40</strong>
              </div>
              <p className="mock-q">Which of these feels most like a good default?</p>
              <div className="mock-opt">A loud countdown</div>
              <div className="mock-opt picked">A quiet warning, then a save</div>
              <div className="mock-opt">No timer at all</div>
            </div>
          </div>
        </section>
        <section className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="card feature">
              <span className="feature-icon"><Icon name={feature.icon} /></span>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
            </article>
          ))}
        </section>
        <section className="types">
          <p className="kicker">Question styles</p>
          <h2>One choice, several, true or false, or a typed reply.</h2>
          <p className="lede">Choice questions are scored as you send them. Typed replies are saved for review — the server doesn’t auto-score those yet.</p>
        </section>
      </main>
    </div>
  );
}
