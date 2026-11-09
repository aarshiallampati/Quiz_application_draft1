import { useState, useEffect } from 'react';

/**
 * ProctorAlert — floating violation warnings shown during quiz.
 *
 * Props:
 *   violations – array of { type, timestamp, ... } from ProctorMonitor
 */

const TYPE_CONFIG = {
    tab_switch: { icon: 'bi-arrow-left-right', label: 'Tab switching detected', color: 'danger' },
    fullscreen_exit: { icon: 'bi-arrows-fullscreen', label: 'Fullscreen exited', color: 'danger' },
    window_blur: { icon: 'bi-window-dash', label: 'Window lost focus', color: 'warning' },
    copy_paste_attempt: { icon: 'bi-clipboard-x', label: 'Copy / paste blocked', color: 'warning' },
};

export default function ProctorAlert({ violations = [] }) {
    const [visible, setVisible] = useState([]);

    // Show latest violation for 4 seconds, then auto-dismiss
    useEffect(() => {
        if (!violations.length) return;
        const latest = violations[violations.length - 1];
        const id = Date.now();
        setVisible((prev) => [...prev, { ...latest, id }]);

        const timer = setTimeout(() => {
            setVisible((prev) => prev.filter((v) => v.id !== id));
        }, 4000);

        return () => clearTimeout(timer);
    }, [violations.length]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!visible.length) return null;

    return (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999, maxWidth: 380 }}>
            {visible.map((v) => {
                const cfg = TYPE_CONFIG[v.type] || { icon: 'bi-exclamation-triangle', label: v.type, color: 'danger' };
                return (
                    <div
                        key={v.id}
                        className={`alert alert-${cfg.color} d-flex align-items-center gap-2 shadow-lg py-2 px-3 mb-2 animate-slide-in`}
                        role="alert"
                        style={{ animation: 'slideIn 0.3s ease', fontSize: '0.9rem' }}
                    >
                        <i className={`bi ${cfg.icon} fs-5`}></i>
                        <div className="flex-grow-1">
                            <strong className="d-block">⚠ {cfg.label}</strong>
                            <small className="text-muted">
                                {new Date(v.timestamp).toLocaleTimeString()}
                                {v.count ? ` (${v.count} times)` : ''}
                            </small>
                        </div>
                        <button
                            className="btn-close btn-close-sm"
                            onClick={() => setVisible((prev) => prev.filter((x) => x.id !== v.id))}
                        ></button>
                    </div>
                );
            })}
        </div>
    );
}
