import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { BootSplash } from './BootSplash';

const LINES = [
  'INITIATE STARTUP...',
  'RESOLVE DNS...',
  'REVERSE PROXY...',
  'SECURE CONNECTION...',
  'SECURED',
  'LOADING...',
];

function renderSplash() {
  render(
    <BootSplash>
      <button>The app</button>
    </BootSplash>,
  );
}

const app = () => screen.queryByRole('button', { name: 'The app' });
const splash = () => screen.queryByRole('status', { name: 'Loading Rayfield Autoshow' });

describe('boot splash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // The test setup reports reduced motion (no splash); this user hasn't asked for it.
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({ matches: false, media: query }) as MediaQueryList,
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('types the lines in order, shows the welcome after 2 s, then the app', () => {
    renderSplash();
    // The app is rendered (and loading) underneath, but hidden until the splash ends.
    expect(app()).not.toBeInTheDocument();

    LINES.forEach((line, i) => {
      expect(within(splash()!).getByText(line)).toBeInTheDocument();
      const next = LINES[i + 1];
      if (next) expect(within(splash()!).queryByText(next)).not.toBeInTheDocument();
      act(() => vi.advanceTimersByTime(333));
    });

    act(() => vi.advanceTimersByTime(2300 - 6 * 333));
    expect(within(splash()!).getByText('Welcome to Rayfield Autoshow')).toBeInTheDocument();
    expect(within(splash()!).queryByText('LOADING...')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3800 - 2300));
    expect(splash()).not.toBeInTheDocument();
    expect(app()).toBeInTheDocument();
  });

  it('a key press skips straight to the app', () => {
    renderSplash();

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(splash()).not.toBeInTheDocument();
    expect(app()).toBeInTheDocument();
  });
});
