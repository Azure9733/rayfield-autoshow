import { useEffect, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from '../lib/motion';

const LINES = [
  'INITIATE STARTUP...',
  'RESOLVE DNS...',
  'REVERSE PROXY...',
  'SECURE CONNECTION...',
  'SECURED',
  'LOADING...',
];
const LINE_MS = 333;
// Phase start times, in ms from page load (UI_PLAN.md §1, "Boot splash").
const FLICKER_AT = 2000;
const WELCOME_AT = 2300;
const FADE_AT = 3500;
const DONE_AT = 3800;

type Phase = 'lines' | 'flicker' | 'welcome' | 'fade' | 'done';

/**
 * Full-page boot sequence on every full load (it wraps the app in main.tsx, so in-app
 * navigation never shows it). The app renders and loads its data underneath, hidden from
 * assistive tech until the splash ends. Any key or click skips it; reduced motion skips it
 * entirely.
 */
export function BootSplash({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? 'done' : 'lines'));
  const [shownLines, setShownLines] = useState(1);
  const playing = phase !== 'done';

  useEffect(() => {
    if (!playing) return;
    const timers = [
      ...LINES.slice(1).map((_, i) => setTimeout(() => setShownLines(i + 2), (i + 1) * LINE_MS)),
      setTimeout(() => setPhase('flicker'), FLICKER_AT),
      setTimeout(() => setPhase('welcome'), WELCOME_AT),
      setTimeout(() => setPhase('fade'), FADE_AT),
      setTimeout(() => setPhase('done'), DONE_AT),
    ];
    const skip = () => setPhase('done');
    window.addEventListener('keydown', skip);
    window.addEventListener('click', skip);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('click', skip);
    };
    // Runs once per splash; `playing` only goes from true to false.
  }, [playing]);

  return (
    <>
      <div className="contents" aria-hidden={playing || undefined} inert={playing}>
        {children}
      </div>
      {playing && (
        <div
          role="status"
          aria-label="Loading Rayfield Autoshow"
          className={`boot-splash ${phase === 'fade' ? 'is-fading' : ''}`}
        >
          {(phase === 'lines' || phase === 'flicker') && (
            <div className={`boot-lines ${phase === 'flicker' ? 'is-flickering' : ''}`}>
              {LINES.slice(0, shownLines).map((line, i) => (
                <p key={line}>
                  {line}
                  {i === shownLines - 1 && (
                    <span className="boot-cursor animate-blink" aria-hidden="true" />
                  )}
                </p>
              ))}
            </div>
          )}
          {(phase === 'welcome' || phase === 'fade') && (
            <p className="boot-welcome">Welcome to Rayfield Autoshow</p>
          )}
        </div>
      )}
    </>
  );
}
