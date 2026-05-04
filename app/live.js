// Live hero — the 30-second EKG experience.
// Phases:
//   idle    → before this week's trace goes live (waiting room)
//   live    → 30s countdown, EKG + question + submit
//   reveal  → word cloud of responses
//   teach   → teaching points w/ annotated trace

const LIVE_DURATION_S = 60;

// durationS: null/0 => open-ended (no countdown). Returns { remaining, elapsed, openEnded }.
function useCountdown(startedAt, durationS) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startedAt]);
  const openEnded = !durationS;
  if (!startedAt) return {
    remaining: durationS || 0,
    elapsed: 0,
    openEnded
  };
  const elapsed = (now - startedAt) / 1000;
  if (openEnded) return {
    remaining: Infinity,
    elapsed,
    openEnded
  };
  return {
    remaining: Math.max(0, durationS - elapsed),
    elapsed,
    openEnded
  };
}

// ─── Timer variants ──────────────────────────────────────────
function TimerRing({
  remaining,
  total,
  variant,
  size = 140
}) {
  const pct = remaining / total;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const label = Math.ceil(remaining);
  if (variant === 'bar') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: 'var(--font-mono)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 32,
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: -1,
        minWidth: 48
      }
    }, label, "s"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 6,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        width: `${pct * 100}%`,
        background: 'var(--accent)',
        transition: 'width 0.1s linear'
      }
    })));
  }
  if (variant === 'pulse') {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--font-mono)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 5,
        background: 'var(--accent)',
        animation: remaining > 0 ? 'ekg-pulse 1s infinite' : 'none'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: 1
      }
    }, String(label).padStart(2, '0'), /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: 0.5
      }
    }, " / ", total)));
  }
  // ring (default)
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      display: 'block',
      transform: 'rotate(-90deg)'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "rgba(255,255,255,0.08)",
    strokeWidth: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: "var(--accent)",
    strokeWidth: "3",
    strokeDasharray: `${dash} ${c}`,
    strokeLinecap: "round",
    style: {
      transition: 'stroke-dasharray 0.1s linear'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 36,
      fontWeight: 500,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: -1
    }
  }, label));
}

// ─── Word cloud reveal ──────────────────────────────────────
function WordCloud({
  responses,
  accent = 'var(--accent)'
}) {
  // Normalize + count.
  const counts = {};
  for (const raw of responses) {
    const text = raw.split(' — ')[0]; // strip name if appended
    const cleaned = text.trim().toLowerCase().replace(/[.,;:!?"'()]/g, '').replace(/\bt wave\b/g, 'T-wave').replace(/\s+/g, ' ');
    if (!cleaned) continue;
    counts[cleaned] = (counts[cleaned] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 40);
  if (entries.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        opacity: 0.5,
        fontStyle: 'italic',
        padding: 40,
        textAlign: 'center'
      }
    }, "No responses yet.");
  }
  const max = entries[0][1];

  // Deterministic pseudo-random layout — words laid out in a rough ring,
  // biggest in the middle.
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.4em 0.8em',
      alignItems: 'baseline',
      justifyContent: 'center',
      lineHeight: 1.1,
      padding: '24px 0'
    }
  }, entries.map(([word, n], i) => {
    const weight = n / max;
    const fontSize = 16 + weight * 54;
    const fontWeight = 300 + Math.round(weight * 500);
    const opacity = 0.45 + weight * 0.55;
    const italic = i % 5 === 2;
    const color = weight > 0.6 ? accent : 'var(--fg)';
    return /*#__PURE__*/React.createElement("span", {
      key: word,
      style: {
        fontSize,
        fontWeight,
        opacity,
        color,
        fontStyle: italic ? 'italic' : 'normal',
        fontFamily: 'var(--font-display)',
        letterSpacing: -0.02 * fontSize / 16,
        transform: `rotate(${(i * 37 % 11 - 5) * 0.25}deg)`,
        transformOrigin: 'center',
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }
    }, word);
  }));
}

// ─── Live section (main hero) ───────────────────────────────
function LiveHero({
  state,
  setState,
  timerVariant = 'bar',
  dark = false
}) {
  const lesson = state.liveLesson;
  const duration = lesson.duration ?? LIVE_DURATION_S;
  // Always use bar on mobile — ring is too large for phone viewports.
  const effectiveVariant = window.innerWidth <= 640 ? 'bar' : timerVariant;
  const {
    remaining,
    openEnded
  } = useCountdown(lesson.liveStartedAt, duration);
  const active = lesson.liveStartedAt && (openEnded || remaining > 0) && !lesson.revealed;
  const expired = !openEnded && lesson.liveStartedAt && remaining <= 0;
  const [answer, setAnswer] = React.useState('');
  const [name, setName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const submit = e => {
    e?.preventDefault();
    if (!answer.trim() || submitted) return;
    const entry = name.trim() ? `${answer.trim()} — ${name.trim()}` : answer.trim();
    setState(s => ({
      ...s,
      liveLesson: {
        ...s.liveLesson,
        responses: [...s.liveLesson.responses, entry]
      }
    }));
    setSubmitted(true);
  };

  // Reveal phase
  if (lesson.revealed) {
    return /*#__PURE__*/React.createElement(RevealAndTeach, {
      lesson: lesson,
      state: state,
      setState: setState
    });
  }

  // Idle phase (waiting for admin to start)
  if (!lesson.liveStartedAt) {
    return /*#__PURE__*/React.createElement(IdleHero, {
      lesson: lesson,
      dark: dark
    });
  }

  // Live phase
  return /*#__PURE__*/React.createElement("section", {
    className: "hero hero--live"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--live"
  }), " ", /*#__PURE__*/React.createElement("span", null, "Live \xB7 ", formatDate(lesson.date)), lesson.responses.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.55
    }
  }, "\xB7 ", lesson.responses.length, " ", lesson.responses.length === 1 ? 'response' : 'responses')), /*#__PURE__*/React.createElement("div", {
    className: "hero__timer"
  }, openEnded ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--accent)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--live",
    style: {
      marginRight: 8
    }
  }), "Open") : /*#__PURE__*/React.createElement(TimerRing, {
    remaining: remaining,
    total: duration,
    variant: effectiveVariant
  }))), /*#__PURE__*/React.createElement("div", {
    className: "hero__trace"
  }, /*#__PURE__*/React.createElement(LessonMedia, {
    lesson: lesson,
    height: 280,
    color: "#ffe89a",
    grid: true,
    animate: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "hero__live-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__question"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "This week"), /*#__PURE__*/React.createElement("h2", {
    className: "hero__prompt"
  }, lesson.question, ".")), /*#__PURE__*/React.createElement("form", {
    className: "hero__form",
    onSubmit: submit
  }, submitted ? /*#__PURE__*/React.createElement("div", {
    className: "hero__submitted"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__check"
  }, "\u2713"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      marginBottom: 4
    }
  }, "Submitted."), /*#__PURE__*/React.createElement("div", {
    style: {
      opacity: 0.7,
      fontSize: 14
    }
  }, lesson.responses.length, " ", lesson.responses.length === 1 ? 'response' : 'responses', " so far \xB7 reveals when the instructor opens the read."))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("textarea", {
    className: "hero__textarea",
    value: answer,
    onChange: e => setAnswer(e.target.value),
    placeholder: "Your read\u2026",
    rows: 2,
    disabled: !active,
    autoFocus: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero__formrow"
  }, /*#__PURE__*/React.createElement("input", {
    className: "hero__nameinput",
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "Name (optional)",
    disabled: !active
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn--primary",
    disabled: !active || !answer.trim()
  }, name.trim() ? 'Submit →' : 'Submit anonymously →'))))));
}

// ─── Reveal + teach (post-timer) ────────────────────────────
function RevealAndTeach({
  lesson,
  state,
  setState
}) {
  const [phase, setPhase] = React.useState('reveal'); // 'reveal' | 'teach'
  return /*#__PURE__*/React.createElement("section", {
    className: "hero hero--reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--done"
  }), " ", /*#__PURE__*/React.createElement("span", null, formatDate(lesson.date), " \xB7 ", phase === 'reveal' ? 'Responses' : 'Teaching points')), /*#__PURE__*/React.createElement("div", {
    className: "hero__tabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: `tab ${phase === 'reveal' ? 'tab--on' : ''}`,
    onClick: () => setPhase('reveal')
  }, "Responses"), /*#__PURE__*/React.createElement("button", {
    className: `tab ${phase === 'teach' ? 'tab--on' : ''}`,
    onClick: () => setPhase('teach')
  }, "Teaching"))), phase === 'reveal' ? /*#__PURE__*/React.createElement("div", {
    className: "hero__reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, lesson.responses.length, " anonymous reads"), /*#__PURE__*/React.createElement("h2", {
    className: "hero__prompt"
  }, lesson.question, "."), /*#__PURE__*/React.createElement("div", {
    className: "hero__cloud"
  }, /*#__PURE__*/React.createElement(WordCloud, {
    responses: lesson.responses
  })), /*#__PURE__*/React.createElement("div", {
    className: "hero__answer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__answerlabel"
  }, "The read"), /*#__PURE__*/React.createElement("div", {
    className: "hero__answertext"
  }, lesson.answer)), /*#__PURE__*/React.createElement("div", {
    className: "hero__revealfooter"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: () => setPhase('teach')
  }, "Teaching points \u2192"))) : /*#__PURE__*/React.createElement("div", {
    className: "hero__teach"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__teachleft"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Teaching"), /*#__PURE__*/React.createElement("h2", {
    className: "hero__teachtitle"
  }, lesson.title), /*#__PURE__*/React.createElement("ol", {
    className: "hero__bullets"
  }, lesson.bullets.map((b, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero__bulletnum"
  }, String(i + 1).padStart(2, '0')), b))), /*#__PURE__*/React.createElement("div", {
    className: "hero__revealfooter"
  }, /*#__PURE__*/React.createElement("a", {
    className: "btn btn--ghost",
    href: "#archive"
  }, "View archive \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: () => setPhase('reveal')
  }, "\u2190 Responses"))), /*#__PURE__*/React.createElement("div", {
    className: "hero__teachright"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__annotated"
  }, /*#__PURE__*/React.createElement(LessonMedia, {
    lesson: lesson,
    height: 260,
    grid: true,
    color: "var(--accent)"
  }), /*#__PURE__*/React.createElement("div", {
    className: "hero__annotation"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero__anndot"
  }), /*#__PURE__*/React.createElement("span", null, lesson.answer.split('—')[0]?.trim() || lesson.title))))));
}
function IdleHero({
  lesson,
  dark = false
}) {
  const topic = lesson.topic || 'ischemia';
  const next = lesson.nextLiveAt ? new Date(lesson.nextLiveAt) : null;
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  // Days/hours until next live
  let nextLabel = null;
  if (next && next > now) {
    const ms = next - now;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor(ms % 86400000 / 3600000);
    nextLabel = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h` : 'soon';
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "hero hero--idle2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "idle__strip"
  }, /*#__PURE__*/React.createElement(STElevationStrip, {
    height: 300,
    speed: 42,
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    className: "idle__masthead"
  }, /*#__PURE__*/React.createElement("div", {
    className: "idle__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "idle__tick"
  }, "/ /"), /*#__PURE__*/React.createElement("span", null, "WEEKLY EKG TEACHING")), /*#__PURE__*/React.createElement("h1", {
    className: "idle__title"
  }, "A Trace of ", /*#__PURE__*/React.createElement("span", {
    className: "idle__title-accent"
  }, "EKG")), /*#__PURE__*/React.createElement("p", {
    className: "idle__lede"
  }, "A weekly microteaching lecture series on emergency EKGs."), /*#__PURE__*/React.createElement("div", {
    className: "idle__ctarow"
  }, /*#__PURE__*/React.createElement("a", {
    className: "btn btn--primary",
    href: "#archive"
  }, "Browse the archive \u2192"), /*#__PURE__*/React.createElement("a", {
    className: "btn btn--ghost",
    href: "#submit"
  }, "Submit a tracing"), nextLabel && /*#__PURE__*/React.createElement("span", {
    className: "idle__next"
  }, /*#__PURE__*/React.createElement("span", {
    className: "idle__nextdot"
  }), "Next live in ", /*#__PURE__*/React.createElement("strong", null, nextLabel)))), /*#__PURE__*/React.createElement("div", {
    className: "idle__rail"
  }, /*#__PURE__*/React.createElement("div", {
    className: "idle__cell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "idle__cellnum"
  }, "01"), /*#__PURE__*/React.createElement("div", {
    className: "idle__celltitle"
  }, "Real-Time Interpretation."), /*#__PURE__*/React.createElement("div", {
    className: "idle__cellbody"
  }, "Weekly didactic lectures with interactive EKG interpretation.")), /*#__PURE__*/React.createElement("div", {
    className: "idle__cell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "idle__cellnum"
  }, "02"), /*#__PURE__*/React.createElement("div", {
    className: "idle__celltitle"
  }, "Always on file."), /*#__PURE__*/React.createElement("div", {
    className: "idle__cellbody"
  }, "Every past lesson is in the archive \u2014 searchable by topic, with the trace, the differential, and the pearls.")), /*#__PURE__*/React.createElement("div", {
    className: "idle__cell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "idle__cellnum"
  }, "03"), /*#__PURE__*/React.createElement("div", {
    className: "idle__celltitle"
  }, "Send us yours."), /*#__PURE__*/React.createElement("div", {
    className: "idle__cellbody"
  }, "Got a tracing worth teaching from? Submit it (de-identified) and we'll feature the best in upcoming weeks."))), /*#__PURE__*/React.createElement("div", {
    className: "idle__marker"
  }, /*#__PURE__*/React.createElement("span", null, "TRACE OF EKG \xB7 ", topic.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    className: "idle__markersep"
  }, "\u2014"), /*#__PURE__*/React.createElement("span", {
    className: "idle__markerlive"
  }, /*#__PURE__*/React.createElement("span", {
    className: "idle__armdot"
  }), "Awaiting live signal")));
}
Object.assign(window, {
  LiveHero,
  WordCloud,
  TimerRing,
  LIVE_DURATION_S
});
