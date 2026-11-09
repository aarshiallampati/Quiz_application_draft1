import { createContext, useContext, useEffect, useState } from 'react';
import { BrandMark } from './Icons';
import { cx } from '../utils';

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function push(message, tone = 'info') {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  }

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <div key={toast.id} className={cx('toast', `toast-${toast.tone}`)}>{toast.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext) || (() => {});
}

export function ConfirmProvider({ children }) {
  const [ask, setAsk] = useState(null);

  function confirm(options) {
    return new Promise((resolve) => {
      setAsk({ ...options, resolve });
    });
  }

  function close(value) {
    ask?.resolve(value);
    setAsk(null);
  }

  useEffect(() => {
    if (!ask) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [ask]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {ask ? (
        <div className="modal-back" onMouseDown={() => close(false)}>
          <div
            className="modal modal-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="confirm-title">{ask.title}</h2>
            {ask.body ? <p className="lede">{ask.body}</p> : null}
            <div className="row-actions">
              <button type="button" className="btn btn-ghost" onClick={() => close(false)} autoFocus={ask.tone === 'danger'}>
                {ask.cancelLabel || 'Cancel'}
              </button>
              <button type="button" className={cx('btn', ask.tone === 'danger' ? 'btn-danger' : 'btn-primary')} onClick={() => close(true)}>
                {ask.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}

export function Splash({ label = 'Opening eduquiz…' }) {
  return (
    <div className="splash" role="status">
      <BrandMark />
      <p>{label}</p>
    </div>
  );
}

export function Button({ children, busy, variant = 'primary', block, small, className, type = 'button', ...rest }) {
  return (
    <button
      {...rest}
      type={type}
      className={cx('btn', `btn-${variant}`, block && 'btn-block', small && 'btn-sm', className)}
      disabled={busy || rest.disabled}
    >
      {busy ? <span className="spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function PasswordField({ label, value, onChange, autoComplete, error, hint, id }) {
  const [shown, setShown] = useState(false);
  const fieldId = id || `pw-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={fieldId}>{label}</label>
      <div className="input-wrap">
        <input
          id={fieldId}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={6}
          required
        />
        <button
          type="button"
          className="text-btn"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setShown((current) => !current)}
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function PageHeader({ kicker, title, lede, actions }) {
  return (
    <header className="page-head">
      <div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Banner({ tone = 'info', children }) {
  return <div className={cx('banner', `banner-${tone}`)} role={tone === 'bad' ? 'alert' : 'status'}>{children}</div>;
}

export function Empty({ title, body, action }) {
  return (
    <div className="empty">
      <div className="empty-orb" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function Pill({ tone = 'ink', children }) {
  return <span className={cx('pill', `pill-${tone}`)}>{children}</span>;
}

export function Difficulty({ value }) {
  const tone = value === 'easy' ? 'sage' : value === 'hard' ? 'coral' : 'amber';
  const label = value === 'easy' ? 'Easy' : value === 'hard' ? 'Hard' : 'Medium';
  return <Pill tone={tone}>{label}</Pill>;
}

export function Stat({ label, value, hint }) {
  return (
    <article className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="grid-cards" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <div key={index} className="card skel" />)}
    </div>
  );
}

export function DepartmentList() {
  return (
    <datalist id="departments">
      {['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology', 'Design', 'Business', 'Mathematics', 'Physics'].map((item) => (
        <option key={item} value={item} />
      ))}
    </datalist>
  );
}
