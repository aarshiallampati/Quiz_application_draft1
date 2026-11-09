import { useEffect, useRef, useCallback, useState } from 'react';
import proctorService from '../services/proctorService';

/**
 * ProctorMonitor — invisible component that runs during quiz.
 *
 * Detects: tab switches · fullscreen exits · window blur ·
 *          copy/paste/right-click · webcam snapshots every 60s.
 *
 * Props:
 *   submissionId  – current quiz attempt id
 *   onViolation   – (event) => void  — called on every violation
 *   onForceSubmit – () => void       — called when max violations reached
 *   active        – boolean          — enable / disable monitoring
 */
export default function ProctorMonitor({
    submissionId = '',
    quizId = '',
    onViolation,
    onForceSubmit,
    active = true,
}) {
    const fullscreenExits = useRef(0);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const snapshotInterval = useRef(null);
    const [webcamReady, setWebcamReady] = useState(false);

    /* ── helper: log to backend + notify parent ───────────── */
    const logEvent = useCallback(
        (type, extra = {}) => {
            const event = { type, timestamp: Date.now(), ...extra };
            onViolation?.(event);

            // Fire-and-forget backend call
            proctorService.logEvent(submissionId, quizId, event).catch(() => { });
        },
        [submissionId, quizId, onViolation],
    );

    /* ═══════════════════════════════════════════════════════
       1. TAB SWITCH DETECTION  (visibilitychange)
       ═══════════════════════════════════════════════════════ */
    useEffect(() => {
        if (!active) return;
        const handler = () => {
            if (document.hidden) logEvent('tab_switch');
        };
        document.addEventListener('visibilitychange', handler);
        return () => document.removeEventListener('visibilitychange', handler);
    }, [active, logEvent]);

    /* ═══════════════════════════════════════════════════════
       2. FULLSCREEN ENFORCEMENT
       ═══════════════════════════════════════════════════════ */
    // Request fullscreen on mount
    useEffect(() => {
        if (!active) return;
        const el = document.documentElement;
        const request =
            el.requestFullscreen ||
            el.webkitRequestFullscreen ||
            el.msRequestFullscreen;
        request?.call(el)?.catch(() => { });
    }, [active]);

    // Listen for fullscreen exit
    useEffect(() => {
        if (!active) return;
        const handler = () => {
            if (
                !document.fullscreenElement &&
                !document.webkitFullscreenElement
            ) {
                fullscreenExits.current += 1;
                logEvent('fullscreen_exit', { count: fullscreenExits.current });

                if (fullscreenExits.current >= 2) {
                    onForceSubmit?.();
                }
            }
        };
        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler);
        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, [active, logEvent, onForceSubmit]);

    /* ═══════════════════════════════════════════════════════
       3. WINDOW BLUR DETECTION
       ═══════════════════════════════════════════════════════ */
    useEffect(() => {
        if (!active) return;
        const handler = () => logEvent('window_blur');
        window.addEventListener('blur', handler);
        return () => window.removeEventListener('blur', handler);
    }, [active, logEvent]);

    /* ═══════════════════════════════════════════════════════
       4. DISABLE COPY / PASTE / RIGHT-CLICK
       ═══════════════════════════════════════════════════════ */
    useEffect(() => {
        if (!active) return;

        const blockKeys = (e) => {
            // Ctrl+C, Ctrl+V, Ctrl+U
            if (
                (e.ctrlKey || e.metaKey) &&
                ['c', 'v', 'u'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
                logEvent('copy_paste_attempt', { key: e.key });
            }
        };

        const blockContextMenu = (e) => {
            e.preventDefault();
            logEvent('copy_paste_attempt', { key: 'right_click' });
        };

        document.addEventListener('keydown', blockKeys);
        document.addEventListener('contextmenu', blockContextMenu);
        return () => {
            document.removeEventListener('keydown', blockKeys);
            document.removeEventListener('contextmenu', blockContextMenu);
        };
    }, [active, logEvent]);

    /* ═══════════════════════════════════════════════════════
       5. WEBCAM MONITORING — snapshot every 60 s
       ═══════════════════════════════════════════════════════ */
    // Start webcam
    useEffect(() => {
        if (!active) return;

        let cancelled = false;

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240 },
                });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }
                streamRef.current = stream;

                // Create a hidden video element
                const video = document.createElement('video');
                video.srcObject = stream;
                video.muted = true;
                video.playsInline = true;
                video.play();
                videoRef.current = video;
                setWebcamReady(true);
            } catch {
                console.warn('ProctorMonitor: webcam access denied');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [active]);

    // Snapshot interval
    useEffect(() => {
        if (!active || !webcamReady) return;

        const capture = () => {
            const video = videoRef.current;
            if (!video || video.readyState < 2) return;

            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 320, 240);
            const image = canvas.toDataURL('image/jpeg', 0.6);

            proctorService.uploadSnapshot(submissionId, quizId, image).catch(() => { });
        };

        // First snapshot immediately
        capture();
        snapshotInterval.current = setInterval(capture, 60_000);

        return () => clearInterval(snapshotInterval.current);
    }, [active, webcamReady, submissionId]);

    /* ═══════════════════════════════════════════════════════
       8. CLEAN UP on unmount
       ═══════════════════════════════════════════════════════ */
    useEffect(() => {
        return () => {
            // Stop webcam
            streamRef.current?.getTracks().forEach((t) => t.stop());
            clearInterval(snapshotInterval.current);

            // Exit fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            }
        };
    }, []);

    // This component renders nothing visible
    return null;
}
