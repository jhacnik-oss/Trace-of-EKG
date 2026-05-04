// App shell — nav, routing, tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "paper",
  "typography": "display",
  "timer": "bar",
  "archive": "by-topic",
  "dark": false
} /*EDITMODE-END*/;
const TWEAK_KEY = 'ekg-tweaks-v2'; // bumped to reset cached dark-mode preference

const PALETTES = {
  indigo: 'indigo',
  mono: 'mono',
  paper: 'paper',
  acid: 'acid'
};
function parseRoute(hash) {
  const h = (hash || '').replace(/^#/, '');
  const qi = h.indexOf('?');
  if (qi === -1) return {
    route: h || 'home',
    params: {}
  };
  const params = {};
  h.slice(qi + 1).split('&').forEach(pair => {
    const ei = pair.indexOf('=');
    if (ei < 0) return;
    try {
      params[decodeURIComponent(pair.slice(0, ei))] = decodeURIComponent(pair.slice(ei + 1).replace(/\+/g, ' '));
    } catch {}
  });
  return {
    route: h.slice(0, qi) || 'home',
    params
  };
}
function App() {
  const [state, setState] = useAppState();
  const [{
    route,
    params
  }, setRouteState] = React.useState(() => parseRoute(location.hash));
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      return {
        ...TWEAK_DEFAULTS,
        ...JSON.parse(localStorage.getItem(TWEAK_KEY) || '{}')
      };
    } catch {
      return TWEAK_DEFAULTS;
    }
  });
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  React.useEffect(() => {
    const r = () => setRouteState(parseRoute(location.hash));
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
    const onMsg = e => {
      const d = e.data;
      if (!d) return;
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const patchTweak = (k, v) => {
    setTweaks(t => {
      const next = {
        ...t,
        [k]: v
      };
      window.parent.postMessage({
        type: '__edit_mode_set_keys',
        edits: {
          [k]: v
        }
      }, '*');
      return next;
    });
  };
  const go = r => {
    location.hash = r;
    setRouteState(parseRoute(r));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "nav"
  }, /*#__PURE__*/React.createElement("button", {
    className: "nav__brand",
    onClick: () => go('home')
  }, /*#__PURE__*/React.createElement(Logo, null)), /*#__PURE__*/React.createElement("div", {
    className: "nav__links"
  }, /*#__PURE__*/React.createElement("button", {
    className: `nav__link ${route === 'home' ? 'nav__link--on' : ''}`,
    onClick: () => go('home')
  }, "Live"), /*#__PURE__*/React.createElement("button", {
    className: `nav__link ${route === 'archive' ? 'nav__link--on' : ''}`,
    onClick: () => go('archive')
  }, "Archive"), /*#__PURE__*/React.createElement("button", {
    className: `nav__link ${route === 'submit' ? 'nav__link--on' : ''}`,
    onClick: () => go('submit')
  }, "Submit"), /*#__PURE__*/React.createElement("button", {
    className: `nav__link ${route === 'lecture' ? 'nav__link--on' : ''}`,
    onClick: () => go('lecture')
  }, "Lecture"), /*#__PURE__*/React.createElement("button", {
    className: "nav__darkmode",
    onClick: () => patchTweak('dark', !tweaks.dark),
    "aria-label": tweaks.dark ? 'Switch to light mode' : 'Switch to dark mode'
  }, tweaks.dark ? '☀ Light' : '☾ Dark'))), /*#__PURE__*/React.createElement(ConnectionBanner, {
    route: route
  }), route === 'home' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LiveHero, {
    state: state,
    setState: setState,
    timerVariant: tweaks.timer,
    dark: tweaks.dark
  }), /*#__PURE__*/React.createElement(Archive, {
    state: state,
    layout: tweaks.archive
  })), route === 'archive' && /*#__PURE__*/React.createElement(Archive, {
    state: state,
    layout: tweaks.archive
  }), route === 'submit' && /*#__PURE__*/React.createElement(SubmitPage, {
    state: state,
    setState: setState
  }), route === 'admin' && /*#__PURE__*/React.createElement(AdminPage, {
    state: state,
    setState: setState
  }), route === 'lecture' && /*#__PURE__*/React.createElement(GuestPage, {
    state: state,
    setState: setState
  }), route === 'draft' && /*#__PURE__*/React.createElement(DraftPage, {
    state: state,
    setState: setState,
    params: params
  }), /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", null, "TRACE OF EKG \xB7 WEEKLY \xB7 FIVE MINUTES"), /*#__PURE__*/React.createElement("div", null, "\xA9 2026 \xB7 HACNIK "), /*#__PURE__*/React.createElement("button", {
    className: "footer__admin",
    onClick: () => go('admin')
  }, "admin")), tweaksOpen && /*#__PURE__*/React.createElement(TweaksPanel, {
    tweaks: tweaks,
    patch: patchTweak,
    onClose: () => {
      setTweaksOpen(false);
      window.parent.postMessage({
        type: '__deactivate_edit_mode'
      }, '*');
    }
  }));
}
function ConnectionBanner({
  route
}) {
  const isAdminRoute = ['admin', 'lecture', 'draft'].includes(route);
  if (!DEMO_MODE) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "demo-banner",
    role: "status"
  }, /*#__PURE__*/React.createElement("strong", null, "Local demo."), /*#__PURE__*/React.createElement("span", null, isAdminRoute ? 'Admin and presenter controls are prototype-only and are not secure authentication.' : 'Submissions, responses, and uploads stay in this browser and are not sent to an admin.'));
}
function Logo() {
  // Small inline EKG-trace-into-wordmark logo.
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "28",
    height: "18",
    viewBox: "0 0 28 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 9 L7 9 L9 4 L11 14 L13 2 L15 16 L17 9 L27 9",
    style: {
      color: 'var(--accent)'
    }
  })), /*#__PURE__*/React.createElement("span", null, "Trace", /*#__PURE__*/React.createElement("em", null, " of"), "  EKG"));
}
function TweaksPanel({
  tweaks,
  patch,
  onClose
}) {
  const swatches = [{
    id: 'indigo',
    fg: '#efe6d6',
    bg: '#120b1f',
    accent: '#ff4d5e'
  }, {
    id: 'mono',
    fg: '#e8e5df',
    bg: '#0e0e0e',
    accent: '#e8e5df'
  }, {
    id: 'paper',
    fg: '#1a1208',
    bg: '#f1ead8',
    accent: '#c8354d'
  }, {
    id: 'acid',
    fg: '#e6ffe0',
    bg: '#0a1a14',
    accent: '#b8ff3e'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "tweaks"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tweaks__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tweaks__title"
  }, "Tweaks"), /*#__PURE__*/React.createElement("button", {
    className: "tweaks__close",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tweaks__label"
  }, "Mode"), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__opts"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tweaks__opt ${!tweaks.dark ? 'tweaks__opt--on' : ''}`,
    onClick: () => patch('dark', false)
  }, "\u2600 light"), /*#__PURE__*/React.createElement("button", {
    className: `tweaks__opt ${tweaks.dark ? 'tweaks__opt--on' : ''}`,
    onClick: () => patch('dark', true)
  }, "\u263E dark"))), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tweaks__label"
  }, "Palette"), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__swatches"
  }, swatches.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    className: `tweaks__swatch ${tweaks.palette === s.id ? 'tweaks__swatch--on' : ''}`,
    onClick: () => patch('palette', s.id),
    style: {
      background: `conic-gradient(${s.bg} 0 33%, ${s.fg} 33% 66%, ${s.accent} 66% 100%)`
    },
    title: s.id
  })))), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tweaks__label"
  }, "Typography"), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__opts"
  }, ['display', 'swiss', 'editorial', 'brutal'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: `tweaks__opt ${tweaks.typography === t ? 'tweaks__opt--on' : ''}`,
    onClick: () => patch('typography', t)
  }, t)))), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tweaks__label"
  }, "Timer"), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__opts"
  }, ['ring', 'bar', 'pulse'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: `tweaks__opt ${tweaks.timer === t ? 'tweaks__opt--on' : ''}`,
    onClick: () => patch('timer', t)
  }, t)))), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tweaks__label"
  }, "Archive layout"), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__opts"
  }, ['by-topic', 'grid', 'list'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: `tweaks__opt ${tweaks.archive === t ? 'tweaks__opt--on' : ''}`,
    onClick: () => patch('archive', t)
  }, t)))));
}
Object.assign(window, {
  App,
  ConnectionBanner,
  TweaksPanel,
  Logo,
  TWEAK_DEFAULTS,
  parseRoute
});
