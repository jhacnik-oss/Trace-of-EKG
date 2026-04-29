// App shell — nav, routing, tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "paper",
  "typography": "display",
  "timer": "ring",
  "archive": "by-topic",
  "dark": false
}/*EDITMODE-END*/;
const TWEAK_KEY = 'ekg-tweaks-v2'; // bumped to reset cached dark-mode preference

const PALETTES = {
  indigo: 'indigo',
  mono: 'mono',
  paper: 'paper',
  acid: 'acid',
};

function App() {
  const [state, setState] = useAppState();
  const [route, setRoute] = React.useState(() => location.hash.replace('#', '') || 'home');
  const [tweaks, setTweaks] = React.useState(() => {
    try { return { ...TWEAK_DEFAULTS, ...(JSON.parse(localStorage.getItem(TWEAK_KEY) || '{}')) }; }
    catch { return TWEAK_DEFAULTS; }
  });
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  React.useEffect(() => {
    const r = () => setRoute(location.hash.replace('#', '') || 'home');
    window.addEventListener('hashchange', r);
    return () => window.removeEventListener('hashchange', r);
  }, []);

  React.useEffect(() => {
    const d = document.documentElement;
    d.setAttribute('data-theme', tweaks.palette === 'indigo' ? '' : tweaks.palette);
    d.setAttribute('data-typography', tweaks.typography);
    d.setAttribute('data-mode', tweaks.dark ? 'dark' : 'light');
    localStorage.setItem(TWEAK_KEY, JSON.stringify(tweaks));
  }, [tweaks]);

  // Tweaks protocol
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data;
      if (!d) return;
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const patchTweak = (k, v) => {
    setTweaks((t) => {
      const next = { ...t, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return next;
    });
  };

  const go = (r) => { location.hash = r; setRoute(r); };

  return (
    <div className="page">
      <nav className="nav">
        <button className="nav__brand" onClick={() => go('home')}>
          <Logo />
        </button>
        <div className="nav__links">
          <button className={`nav__link ${route === 'home' ? 'nav__link--on' : ''}`} onClick={() => go('home')}>Live</button>
          <button className={`nav__link ${route === 'archive' ? 'nav__link--on' : ''}`} onClick={() => go('archive')}>Archive</button>
          <button className={`nav__link ${route === 'submit' ? 'nav__link--on' : ''}`} onClick={() => go('submit')}>Submit</button>
          <button className={`nav__link ${route === 'admin' ? 'nav__link--on' : ''}`} onClick={() => go('admin')}>Admin</button>
          <button
            className="nav__darkmode"
            onClick={() => patchTweak('dark', !tweaks.dark)}
            aria-label={tweaks.dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {tweaks.dark ? '☀ Light' : '☾ Dark'}
          </button>
        </div>
      </nav>

      {route === 'home' && (
        <>
          <LiveHero state={state} setState={setState} timerVariant={tweaks.timer} dark={tweaks.dark} />
          <Archive state={state} layout={tweaks.archive} />
        </>
      )}
      {route === 'archive' && <Archive state={state} layout={tweaks.archive} />}
      {route === 'submit' && <SubmitPage state={state} setState={setState} />}
      {route === 'admin' && <AdminPage state={state} setState={setState} />}

      <footer className="footer">
        <div>TRACE OF EKG · WEEKLY · FIVE MINUTES</div>
        <div>© 2026 · HACNIK </div>
      </footer>

      {tweaksOpen && <TweaksPanel tweaks={tweaks} patch={patchTweak} onClose={() => { setTweaksOpen(false); window.parent.postMessage({ type: '__deactivate_edit_mode' }, '*'); }} />}
    </div>
  );
}

function Logo() {
  // Small inline EKG-trace-into-wordmark logo.
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width="28" height="18" viewBox="0 0 28 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 9 L7 9 L9 4 L11 14 L13 2 L15 16 L17 9 L27 9" style={{ color: 'var(--accent)' }} />
      </svg>
      <span>Trace<em> of</em>  EKG</span>
    </span>
  );
}

function TweaksPanel({ tweaks, patch, onClose }) {
  const swatches = [
    { id: 'indigo', fg: '#efe6d6', bg: '#120b1f', accent: '#ff4d5e' },
    { id: 'mono', fg: '#e8e5df', bg: '#0e0e0e', accent: '#e8e5df' },
    { id: 'paper', fg: '#1a1208', bg: '#f1ead8', accent: '#c8354d' },
    { id: 'acid', fg: '#e6ffe0', bg: '#0a1a14', accent: '#b8ff3e' },
  ];
  return (
    <div className="tweaks">
      <div className="tweaks__head">
        <div className="tweaks__title">Tweaks</div>
        <button className="tweaks__close" onClick={onClose}>×</button>
      </div>
      <div className="tweaks__row">
        <div className="tweaks__label">Mode</div>
        <div className="tweaks__opts">
          <button className={`tweaks__opt ${!tweaks.dark ? 'tweaks__opt--on' : ''}`} onClick={() => patch('dark', false)}>☀ light</button>
          <button className={`tweaks__opt ${tweaks.dark ? 'tweaks__opt--on' : ''}`} onClick={() => patch('dark', true)}>☾ dark</button>
        </div>
      </div>
      <div className="tweaks__row">
        <div className="tweaks__label">Palette</div>
        <div className="tweaks__swatches">
          {swatches.map((s) => (
            <button key={s.id} className={`tweaks__swatch ${tweaks.palette === s.id ? 'tweaks__swatch--on' : ''}`}
              onClick={() => patch('palette', s.id)}
              style={{ background: `conic-gradient(${s.bg} 0 33%, ${s.fg} 33% 66%, ${s.accent} 66% 100%)` }}
              title={s.id} />
          ))}
        </div>
      </div>
      <div className="tweaks__row">
        <div className="tweaks__label">Typography</div>
        <div className="tweaks__opts">
          {['display', 'swiss', 'editorial', 'brutal'].map((t) => (
            <button key={t} className={`tweaks__opt ${tweaks.typography === t ? 'tweaks__opt--on' : ''}`} onClick={() => patch('typography', t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="tweaks__row">
        <div className="tweaks__label">Timer</div>
        <div className="tweaks__opts">
          {['ring', 'bar', 'pulse'].map((t) => (
            <button key={t} className={`tweaks__opt ${tweaks.timer === t ? 'tweaks__opt--on' : ''}`} onClick={() => patch('timer', t)}>{t}</button>
          ))}
        </div>
      </div>
      <div className="tweaks__row">
        <div className="tweaks__label">Archive layout</div>
        <div className="tweaks__opts">
          {['by-topic', 'grid', 'list'].map((t) => (
            <button key={t} className={`tweaks__opt ${tweaks.archive === t ? 'tweaks__opt--on' : ''}`} onClick={() => patch('archive', t)}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { App, TweaksPanel, Logo, TWEAK_DEFAULTS });
