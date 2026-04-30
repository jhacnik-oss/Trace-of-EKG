// Guest lecturer page — no password required.
// Guests can edit this week's content, go live, reveal, reset,
// and view the live response stream (with names).
// After reveal, they submit the session for admin approval before it hits the archive.

function GuestPage({ state, setState }) {
  const live = state.liveLesson;
  const [draft, setDraft] = React.useState(live);
  const [view, setView] = React.useState('setup'); // 'setup' | 'submitted'

  // Keep draft in sync if admin updates the lesson externally.
  React.useEffect(() => setDraft(live), [live.id]);

  const duration = draft.duration ?? LIVE_DURATION_S;
  const { remaining, openEnded } = useCountdown(live.liveStartedAt, live.duration ?? LIVE_DURATION_S);
  const isLive = live.liveStartedAt && (openEnded || remaining > 0) && !live.revealed;

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const save   = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, ...draft } }));
  const goLive = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, ...draft, liveStartedAt: Date.now(), revealed: false, responses: [] } }));
  const stop   = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, liveStartedAt: null, revealed: false } }));
  const reveal = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, revealed: true } }));

  const submitForReview = () => {
    const entry = {
      ...state.liveLesson,
      id: 'pending-' + Date.now().toString(36),
      pendingAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      pendingLessons: [entry, ...(s.pendingLessons || [])],
      // reset live lesson back to idle so the site is clean for next week
      liveLesson: { ...s.liveLesson, liveStartedAt: null, revealed: false, responses: [] },
    }));
    setView('submitted');
  };

  if (view === 'submitted') {
    return (
      <section className="admin" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✓</div>
        <h2 className="admin__title" style={{ marginBottom: 12 }}>Session submitted.</h2>
        <p style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20, marginBottom: 32 }}>
          The session is in the admin's review queue and will appear in the archive once approved.
        </p>
        <button className="btn btn--ghost" onClick={() => setView('setup')}>← Back</button>
      </section>
    );
  }

  return (
    <section className="admin">
      <div className="admin__head">
        <div>
          <div className="hero__label">Guest Lecturer</div>
          <h2 className="admin__title">This week's session</h2>
        </div>
        <div className="admin__status" style={{ alignSelf: 'flex-end' }}>
          {isLive
            ? <><span className="dot dot--live" /> Live · {openEnded ? 'Open' : `${Math.ceil(remaining)}s`} · {live.responses.length} responses</>
            : live.revealed
            ? <><span className="dot dot--done" /> Revealed · {live.responses.length} responses</>
            : <><span className="dot dot--idle" /> Idle</>}
        </div>
      </div>

      <div className="admin__grid">
        {/* ── Left col: edit + controls ── */}
        <div className="admin__col">
          <label className="admin__field">
            <span>Title</span>
            <input value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
          </label>
          <div className="admin__row2">
            <label className="admin__field">
              <span>Week #</span>
              <input type="number" value={draft.week} onChange={(e) => patch({ week: +e.target.value })} />
            </label>
            <label className="admin__field">
              <span>Date</span>
              <input type="date" value={draft.date} onChange={(e) => patch({ date: e.target.value })} />
            </label>
          </div>
          <label className="admin__field">
            <span>Topic</span>
            <select value={draft.topic} onChange={(e) => patch({ topic: e.target.value })}>
              {state.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="admin__field">
            <span>Question</span>
            <input value={draft.question} onChange={(e) => patch({ question: e.target.value })} />
          </label>
          <div className="admin__field">
            <span>Submission window</span>
            <div className="admin__durations">
              {[15, 30, 45, 60, 90, 120].map((s) => (
                <button key={s} type="button"
                  className={`tweaks__opt ${duration === s ? 'tweaks__opt--on' : ''}`}
                  onClick={() => patch({ duration: s })}>{s}s</button>
              ))}
              <button type="button"
                className={`tweaks__opt ${!duration ? 'tweaks__opt--on' : ''}`}
                onClick={() => patch({ duration: 0 })}>Open — no timer</button>
            </div>
          </div>
          <label className="admin__field">
            <span>EKG image or PDF (upload)</span>
            <div className="admin__upload">
              <input type="file" accept="image/*,application/pdf" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                const data = await fileToDataURL(f);
                if (f.type === 'application/pdf') patch({ pdfData: data, imageData: null, imageUrl: '' });
                else patch({ imageData: data, pdfData: null, imageUrl: '' });
              }} />
              {(draft.imageData || draft.pdfData || draft.imageUrl) && (
                <button type="button" className="btn btn--ghost btn--sm"
                  onClick={() => patch({ imageData: null, pdfData: null, imageUrl: '' })}>Clear</button>
              )}
              <span className="admin__uploadhint">
                {draft.pdfData ? 'PDF attached' : draft.imageData ? 'Image attached' : draft.imageUrl || 'Falls back to placeholder if blank'}
              </span>
            </div>
          </label>
          <label className="admin__field">
            <span>…or external image URL</span>
            <input value={draft.imageUrl || ''} onChange={(e) => patch({ imageUrl: e.target.value, imageData: null, pdfData: null })} placeholder="https://…" />
          </label>
          <label className="admin__field">
            <span>The read (answer)</span>
            <textarea rows={3} value={draft.answer} onChange={(e) => patch({ answer: e.target.value })} />
          </label>
          <label className="admin__field">
            <span>Teaching points (one per line)</span>
            <textarea rows={6} value={draft.bullets.join('\n')} onChange={(e) => patch({ bullets: e.target.value.split('\n') })} />
          </label>
          <div className="admin__actions">
            <button className="btn btn--ghost" onClick={save}>Save draft</button>
            {!isLive && !live.revealed && (
              <button className="btn btn--primary" onClick={goLive}>
                ▶ Go live {duration ? `(${duration}s)` : '(open)'}
              </button>
            )}
            {isLive && <button className="btn btn--primary" onClick={reveal}>Reveal now</button>}
            {(isLive || live.revealed) && <button className="btn btn--danger" onClick={stop}>Reset to idle</button>}
          </div>

          {/* Submit for review — only shown after reveal */}
          {live.revealed && (
            <div style={{
              marginTop: 24, padding: '20px 24px',
              border: '1px solid color-mix(in oklch, var(--accent-3) 40%, transparent)',
              background: 'color-mix(in oklch, var(--accent-3) 6%, transparent)',
              borderRadius: 2,
            }}>
              <div className="hero__label" style={{ marginBottom: 8 }}>Session complete</div>
              <p style={{ margin: '0 0 16px', color: 'var(--fg-dim)', fontSize: 15, lineHeight: 1.5 }}>
                Submit this session to the admin for review. Once approved it will appear in the archive.
              </p>
              <button className="btn btn--primary" onClick={submitForReview}>
                Submit for admin review →
              </button>
            </div>
          )}
        </div>

        {/* ── Right col: preview + live response stream ── */}
        <div className="admin__col">
          <div className="admin__preview">
            <div className="hero__label">EKG preview</div>
            <div className="admin__previewframe">
              <LessonMedia lesson={draft} height={180} grid={true} color="var(--accent)" />
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="admin__streamhead">
              <div><strong>{live.responses.length}</strong> responses</div>
            </div>
            <ul className="admin__stream">
              {live.responses.length === 0
                ? <li className="admin__empty">No responses yet. Go live to start collecting.</li>
                : live.responses.map((r, i) => (
                    <li key={i}>
                      <span className="admin__streamnum">{String(i + 1).padStart(2, '0')}</span>
                      <span className="admin__streamtext">{r}</span>
                    </li>
                  ))
              }
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { GuestPage });
