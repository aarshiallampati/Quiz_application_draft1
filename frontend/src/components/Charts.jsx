import { useEffect, useState } from 'react';

export function ScoreRing({ value = 0, passed = true }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, Number(value) || 0))));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (shown / 100) * circ;

  return (
    <svg className="ring" viewBox="0 0 120 120" role="img" aria-label={`${Math.round(value || 0)} percent`}>
      <circle className="ring-track" cx="60" cy="60" r={radius} />
      <circle
        className={passed ? 'ring-value' : 'ring-value miss'}
        cx="60"
        cy="60"
        r={radius}
        style={{ strokeDasharray: circ, strokeDashoffset: offset }}
      />
      <text x="60" y="68" textAnchor="middle">{Math.round(value || 0)}%</text>
    </svg>
  );
}

export function Bars({ labels = [], values = [] }) {
  if (!labels.length) return <p className="fine">Nothing to chart yet.</p>;
  const max = Math.max(100, ...values, 1);
  return (
    <div className="bars" role="img" aria-label={labels.map((label, index) => `${label} ${values[index]}`).join(', ')}>
      {labels.map((label, index) => (
        <div className="bar" key={`${label}-${index}`}>
          <strong>{values[index] ?? 0}</strong>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${((values[index] || 0) / max) * 100}%`, animationDelay: `${index * 60}ms` }} />
          </div>
          <span title={label}>{label.length > 14 ? `${label.slice(0, 13)}…` : label}</span>
        </div>
      ))}
    </div>
  );
}

export function Trend({ actual = [], average = [], labels = [] }) {
  if (!actual.length) return <p className="fine">No scores yet.</p>;
  const width = 560;
  const height = 200;
  const pad = 24;
  const x = (index) => (actual.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (actual.length - 1));
  const y = (value) => height - pad - (Math.max(0, Math.min(100, value)) / 100) * (height - pad * 2);
  const draw = (series) => series.map((value, index) => `${index ? 'L' : 'M'}${x(index)},${y(value)}`).join(' ');
  const readable = labels.map((label) => {
    const date = new Date(label);
    return Number.isNaN(date.getTime()) ? String(label || '') : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  return (
    <div>
      <svg className="trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Score trend">
        {[0, 50, 100].map((mark) => (
          <line key={mark} x1={pad} x2={width - pad} y1={y(mark)} y2={y(mark)} stroke="currentColor" strokeOpacity="0.08" />
        ))}
        <path d={draw(actual)} fill="none" stroke="#e25b38" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {average.length ? <path d={draw(average)} fill="none" stroke="#1f7a6b" strokeWidth="2.5" strokeDasharray="6 6" /> : null}
        {actual.map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r="4.5" fill="#e25b38" />)}
      </svg>
      <div className="legend">
        <span><i className="swatch persimmon" /> Score</span>
        <span><i className="swatch sage" /> Rolling average</span>
      </div>
      <ul className="sr">
        {actual.map((value, index) => <li key={index}>{readable[index]}: {value}%</li>)}
      </ul>
    </div>
  );
}
