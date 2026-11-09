const paths = {
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />,
  history: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5l3 2" /></>,
  spark: <path d="M12 3.5 13.8 9H19l-4.2 3.2 1.6 5.3L12 14.8 7.6 17.5l1.6-5.3L5 9h5.2z" />,
  user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19.2c1.4-2.6 3.6-3.9 6.5-3.9s5.1 1.3 6.5 3.9" /></>,
  rounds: <><path d="M8 7h11a2 2 0 0 1 2 2v8H8a3 3 0 0 0-3 3V8a3 3 0 0 1 3-1z" /><path d="M8 7v11" /></>,
  chart: <path d="M5 19V10M12 19V5M19 19v-7" />,
  eye: <><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.4" /></>,
  people: <><circle cx="9" cy="9" r="2.4" /><circle cx="16" cy="10" r="2" /><path d="M4.8 18.5c.8-2.2 2.4-3.3 4.2-3.3s3.4 1.1 4.2 3.3M13.2 15.4c1.3-.3 2.6.1 3.5 1.1.7.8 1.1 1.6 1.3 2" /></>,
  logout: <path d="M10 7V5.8A1.8 1.8 0 0 1 11.8 4H18v16h-6.2A1.8 1.8 0 0 1 10 18.2V17M4 12h10M7 9l-3 3 3 3" />,
  plus: <path d="M12 6v12M6 12h12" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
  trash: <path d="M5 8h14M9 8V6h6v2M8 8l.8 11h6.4L16 8" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12 5 5 9-10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  camera: <><path d="M4 8h3l1.5-2h7L17 8h3v10H4z" /><circle cx="12" cy="13" r="3" /></>,
  download: <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" />,
  alert: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4.5M12 16h.01" /></>,
  play: <path d="m9 7 8 5-8 5z" />,
};

export function Icon({ name, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.spark}
    </svg>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}
