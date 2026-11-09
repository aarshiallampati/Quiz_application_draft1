const ACTIVE_KEY = 'eduquiz_active_round';

export const DEPARTMENTS = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Information Technology',
  'Design',
  'Business',
  'Mathematics',
  'Physics',
];

export const EVENT_LABELS = {
  tab_switch: 'Switched tabs',
  fullscreen_exit: 'Left focus mode',
  window_blur: 'Left the window',
  copy_paste_attempt: 'Tried to copy or paste',
  face_not_detected: 'Face not in frame',
  multiple_faces: 'More than one face',
};

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function firstName(name = '') {
  return String(name).trim().split(/\s+/)[0] || 'there';
}

export function initials(name = '') {
  const letters = String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return letters || '•';
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ago(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  return formatWhen(value);
}

export function clock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function formatMinutes(mins) {
  const n = Number(mins) || 0;
  if (n < 60) return `${n} min`;
  const hours = Math.floor(n / 60);
  const minutes = n % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function recommendationLabel(value) {
  if (value === 'disqualify') return 'Disqualify';
  if (value === 'flag') return 'Flag';
  if (value === 'review') return 'Review';
  return 'Clear';
}

export function recommendationTone(value) {
  if (value === 'disqualify' || value === 'flag') return 'coral';
  if (value === 'review') return 'amber';
  return 'sage';
}

export function seededOrder(length, seed) {
  const order = Array.from({ length }, (_, index) => index);
  let hash = 2166136261;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  const random = () => {
    state = (Math.imul(state ^ (state >>> 15), state | 1) + 0x6d2b79f5) >>> 0;
    return state / 4294967296;
  };
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function readActiveRound(userId) {
  try {
    const data = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null');
    if (!data || (userId && data.userId !== userId)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveActiveRound(data) {
  const previous = readActiveRound();
  if (previous?.submissionId && previous.submissionId !== data.submissionId) {
    localStorage.removeItem(`eduquiz_answers_${previous.submissionId}`);
  }
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(data));
}

export function clearActiveRound() {
  const previous = readActiveRound();
  if (previous?.submissionId) localStorage.removeItem(`eduquiz_answers_${previous.submissionId}`);
  localStorage.removeItem(ACTIVE_KEY);
}

export function readAnswers(submissionId) {
  try {
    return JSON.parse(localStorage.getItem(`eduquiz_answers_${submissionId}`) || '{}');
  } catch {
    return {};
  }
}

export function saveAnswers(submissionId, answers) {
  localStorage.setItem(`eduquiz_answers_${submissionId}`, JSON.stringify(answers));
}

export function isSelected(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return value >= 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

export function homeFor(role) {
  return role === 'admin' ? '/host' : '/home';
}
