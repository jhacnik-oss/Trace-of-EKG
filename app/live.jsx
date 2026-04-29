// Live hero — the 30-second EKG experience.
// Phases:
//   idle    → before this week's trace goes live (waiting room)
//   live    → 30s countdown, EKG + question + submit
//   reveal  → word cloud of responses
//   teach   → teaching points w/ annotated trace

const LIVE_DURATION_S = 30;

// durationS: null/0 => open-ended (no countdown). Returns { remaining, elapsed, openEnded }.
function useCountdown(startedAt, durationS) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startedAt]);
  const openEnded = !durationS;
  if (!startedAt) return { remaining: durationS || 0, elapsed: 0, openEnded };
  const elapsed = (now - startedAt) / 1000;
  if (openEnded) return { remaining: Infinity, elapsed, openEnded };
  return { remaining: Math.max(0, durationS - elapsed), elapsed, openEnded };
}

// ─── Timer variants ──────────────────────────────────────────
function TimerRing({ remaining, total, variant, size = 140 }) {
  const pct = remaining / total;
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  const label = Math.ceil(remaining);
  if (variant === 'bar') {
    return (
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'var(--font-mono)' }}>
        <div style={{ fontSize: 32, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: -1, minWidth: 48 }}>{label}s</div>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct * 100}%`, background: 'var(--accent)', transition: 'width 0.1s linear' }} />
        </div>
      </div>
    );
  }
  if (variant === 'pulse') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)' }}>
        <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)',
          animation: remaining > 0 ? 'ekg-pulse 1s infinite' : 'none' }} />
        <div style={{ fontSize: 22, fontWeight: 500, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
          {String(label).padStart(2, '0')}<span style={{ opacity: 0.5 }}> / {total}</span>
        </div>
      </div>
    );
  }
  // ring (default)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="3"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.1s linear' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 500, fontVariantNumeric: 'tabular-nums', letterSpacing: -1 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Word cloud reveal ──────────────────────────────────────
function WordCloud({ responses, accent = 'var(--accent)' }) {
  // Normalize + count.
  const counts = {};
  for (const raw of responses) {
    const cleaned = raw.trim().toLowerCase()
      .replace(/[.,;:!?"'()]/g, '')
      .replace(/\bt wave\b/g, 'T-wave')
      .replace(/\s+/g, ' ');
    if (!cleaned) continue;
    counts[cleaned] = (counts[cleaned] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 40);
  if (entries.length === 0) {
    return <div style={{ opacity: 0.5, fontStyle: 'italic', padding: 40, textAlign: 'center' }}>No responses yet.</div>;
  }
  const max = entries[0][1];

  // Deterministic pseudo-random layout — words laid out in a rough ring,
  // biggest in the middle.
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4em 0.8em', alignItems: 'baseline', justifyContent: 'center',
      lineHeight: 1.1, padding: '24px 0' }}>
      {entries.map(([word, n], i) => {
        const weight = n / max;
        const fontSize = 16 + weight * 54;
        const fontWeight = 300 + Math.round(weight * 500);
        const opacity = 0.45 + weight * 0.55;
        const italic = i % 5 === 2;
        const color = weight > 0.6 ? accent : 'var(--fg)';
        return (
          <span key={word} style={{
            fontSize, fontWeight, opacity, color,
            fontStyle: italic ? 'italic' : 'normal',
            fontFamily: 'var(--font-display)',
            letterSpacing: -0.02 * fontSize / 16,
            transform: `rotate(${((i * 37) % 11 - 5) * 0.25}deg)`,
            transformOrigin: 'center',
            display: 'inline-block',
            whiteSpace: 'nowrap',
          }}>{word}</span>
        );
      })}
    </div>
  );
}

// ─── Live section (main hero) ───────────────────────────────
function LiveHero({ state, setState, timerVariant = 'ring', dark = false }) {
  const lesson = state.liveLesson;
  const duration = lesson.duration ?? LIVE_DURATION_S;
  const { remaining, openEnded } = useCountdown(lesson.liveStartedAt, duration);
  const active = lesson.liveStartedAt && (openEnded || remaining > 0) && !lesson.revealed;
  const expired = !openEnded && lesson.liveStartedAt && remaining <= 0;

  // Auto-advance: once timer hits 0 (only if timed), move to reveal.
  React.useEffect(() => {
    if (expired && !lesson.revealed) {
      const t = setTimeout(() => {
        setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, revealed: true } }));
      }, 400);
      return () => clearTimeout(t);
    }
  }, [expired, lesson.revealed]);

  const [answer, setAnswer] = React.useState('');
  const [name, setName] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const submit = (e) => {
    e?.preventDefault();
    if (!answer.trim() || submitted) return;
    const entry = name.trim() ? `${answer.trim()} — ${name.trim()}` : answer.trim();
    setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, responses: [...s.liveLesson.responses, answer.trim()] } }));
    setSubmitted(true);
  };

  // Reveal phase
  if (lesson.revealed) {
    return <RevealAndTeach lesson={lesson} state={state} setState={setState} />;
  }

  // Idle phase (waiting for admin to start)
  if (!lesson.liveStartedAt) {
    return <IdleHero lesson={lesson} dark={dark} />;
  }

  // Live phase
  return (
    <section className="hero hero--live">
      <div className="hero__topbar">
        <div className="hero__status">
          <span className="dot dot--live" /> <span>Live · Week {String(lesson.week).padStart(2, '0')}</span>
        </div>
        <div className="hero__timer">
          {openEnded ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              <span className="dot dot--live" style={{ marginRight: 8 }} />Open
            </div>
          ) : (
            <TimerRing remaining={remaining} total={duration} variant={timerVariant} />
          )}
        </div>
      </div>
      <div className="hero__trace">
        <LessonMedia lesson={lesson} height={280} color="#ffe89a" grid={true} animate={true} />
      </div>
      <div className="hero__live-row">
        <div className="hero__question">
          <div className="hero__label">This week</div>
          <h2 className="hero__prompt">{lesson.question}.</h2>
        </div>
        <form className="hero__form" onSubmit={submit}>
          {submitted ? (
            <div className="hero__submitted">
              <div className="hero__check">✓</div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Submitted.</div>
                <div style={{ opacity: 0.7, fontSize: 14 }}>Responses reveal when the timer ends.</div>
              </div>
            </div>
          ) : (
            <>
              <textarea
                className="hero__textarea"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your read…"
                rows={2}
                disabled={!active}
                autoFocus
              />
              <div className="hero__formrow">
                <input
                  className="hero__nameinput"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (optional)"
                  disabled={!active}
                />
                <button type="submit" className="btn btn--primary" disabled={!active || !answer.trim()}>
                  Submit anonymously →
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </section>
  );
}

// ─── Reveal + teach (post-timer) ────────────────────────────
function RevealAndTeach({ lesson, state, setState }) {
  const [phase, setPhase] = React.useState('reveal'); // 'reveal' | 'teach'
  return (
    <section className="hero hero--reveal">
      <div className="hero__topbar">
        <div className="hero__status">
          <span className="dot dot--done" /> <span>Week {String(lesson.week).padStart(2, '0')} · {phase === 'reveal' ? 'Responses' : 'Teaching points'}</span>
        </div>
        <div className="hero__tabs">
          <button className={`tab ${phase === 'reveal' ? 'tab--on' : ''}`} onClick={() => setPhase('reveal')}>Responses</button>
          <button className={`tab ${phase === 'teach' ? 'tab--on' : ''}`} onClick={() => setPhase('teach')}>Teaching</button>
        </div>
      </div>
      {phase === 'reveal' ? (
        <div className="hero__reveal">
          <div className="hero__label">{lesson.responses.length} anonymous reads</div>
          <h2 className="hero__prompt">{lesson.question}.</h2>
          <div className="hero__cloud">
            <WordCloud responses={lesson.responses} />
          </div>
          <div className="hero__revealfooter">
            <div className="hero__answer">
              <span className="hero__answerlabel">The read</span>
              <span className="hero__answertext">{lesson.answer}</span>
            </div>
            <button className="btn btn--primary" onClick={() => setPhase('teach')}>Teaching points →</button>
          </div>
        </div>
      ) : (
        <div className="hero__teach">
          <div className="hero__teachleft">
            <div className="hero__label">Teaching</div>
            <h2 className="hero__teachtitle">{lesson.title}</h2>
            <ol className="hero__bullets">
              {lesson.bullets.map((b, i) => (
                <li key={i}><span className="hero__bulletnum">{String(i + 1).padStart(2, '0')}</span>{b}</li>
              ))}
            </ol>
            <div className="hero__revealfooter">
              <a className="btn btn--ghost" href="#archive">Add to archive →</a>
              <button className="btn btn--primary" onClick={() => setPhase('reveal')}>← Responses</button>
            </div>
          </div>
          <div className="hero__teachright">
            <div className="hero__annotated">
              <LessonMedia lesson={lesson} height={260} grid={true} color="var(--accent)" />
              <div className="hero__annotation">
                <span className="hero__anndot" />
                <span>{lesson.answer.split('—')[0]?.trim() || lesson.title}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function IdleHero({ lesson, dark = false }) {
  const week = String(lesson.week).padStart(2, '0');
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
    const h = Math.floor((ms % 86400000) / 3600000);
    nextLabel = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h` : 'soon';
  }

  return (
    <section className="hero hero--idle2">
      {/* Strip is the centerpiece — full bleed */}
      <div className="idle__strip">
        <STElevationStrip height={300} speed={42} dark={dark} />
      </div>

      {/* Headline + lede in an asymmetric grid */}
      <div className="idle__masthead">
        <div className="idle__kicker">
          <span className="idle__tick">/ /</span>
          <span>WEEKLY EKG TEACHING</span>
        </div>
        <h1 className="idle__title">
          A <em>Trace</em> of <span className="idle__title-accent">EKG</span>
        </h1>
        <p className="idle__lede">
          Five minutes. One real EKG. We open it for thirty seconds, take your read, then
          unpack the answer together — with the differential, the pitfalls, and what to do at 3 a.m.
        </p>
        <div className="idle__ctarow">
          <a className="btn btn--primary" href="#archive">Browse the archive →</a>
          <a className="btn btn--ghost" href="#submit">Submit a tracing</a>
          {nextLabel && (
            <span className="idle__next">
              <span className="idle__nextdot" />
              Next live in <strong>{nextLabel}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Three stat cards — what you get, who it's for, where to start */}
      <div className="idle__rail">
        <div className="idle__cell">
          <div className="idle__cellnum">01</div>
          <div className="idle__celltitle">30-second read.</div>
          <div className="idle__cellbody">
            Tuesdays at noon, the week's tracing goes live for thirty seconds.
            Type your read, see the room's, then the teaching.
          </div>
        </div>
        <div className="idle__cell">
          <div className="idle__cellnum">02</div>
          <div className="idle__celltitle">Always on file.</div>
          <div className="idle__cellbody">
            Every past lesson is in the archive — searchable by topic,
            with the trace, the differential, and the pearls.
          </div>
        </div>
        <div className="idle__cell">
          <div className="idle__cellnum">03</div>
          <div className="idle__celltitle">Send us yours.</div>
          <div className="idle__cellbody">
            Got a tracing worth teaching from? Submit it (de-identified)
            and we'll feature the best in upcoming weeks.
          </div>
        </div>
      </div>

      {/* Footer marker — typographic, no status pill */}
      <div className="idle__marker">
        <span>TRACE OF EKG · {topic.toUpperCase()} · ISSUE {week}</span>
        <span className="idle__markersep">—</span>
        <span className="idle__markerlive">
          <span className="idle__armdot" />
          Awaiting live signal
        </span>
      </div>
    </section>
  );
}

Object.assign(window, { LiveHero, WordCloud, TimerRing, LIVE_DURATION_S });
