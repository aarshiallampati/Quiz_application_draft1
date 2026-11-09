import { useEffect, useState } from 'react';
import { formatTime } from '../utils/formatTime';

export default function TimerBadge({ initialSeconds, onTimeUp }) {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        setSeconds(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        if (seconds <= 0) {
            onTimeUp && onTimeUp();
            return;
        }
        const id = setInterval(() => setSeconds((s) => s - 1), 1000);
        return () => clearInterval(id);
    }, [seconds, onTimeUp]);

    const isUrgent = seconds <= 60;
    const isWarning = seconds <= 300 && seconds > 60;

    let colorClass = 'bg-primary';
    if (isWarning) colorClass = 'bg-warning text-dark';
    if (isUrgent) colorClass = 'bg-danger';

    return (
        <span className={`badge ${colorClass} fs-6 px-3 py-2 d-inline-flex align-items-center gap-1`}>
            <i className={`bi bi-clock${isUrgent ? '-history' : ''}`}></i>
            {formatTime(seconds)}
        </span>
    );
}
