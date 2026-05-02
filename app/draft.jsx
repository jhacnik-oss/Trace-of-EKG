// Guest draft page — accessed via invite link only.
// URL format: #draft?id=<inviteId>&topic=<topicId>&date=<YYYY-MM-DD>&name=<presenterName>
//
// Drafts are saved to a separate localStorage key (not main app state) because
// guests have their own browsers. Keyed by invite ID so the same link always
// loads the same in-progress draft.

const GUEST_DRAFTS_KEY = 'ekg-guest-drafts-v1';

function loadGuestDraft(id) {
  try {
    const all = JSON.parse(localStorage.getItem(GUEST_DRAFTS_KEY) || '{}');
    return all[id] || null;
  } catch { return null; }
}

function saveGuestDraft(id, data) {
  try {
    const all = JSON.parse(localStorage.getItem(GUEST_DRAFTS_KEY) || '{}');
    all[id] = { ...data, savedAt: Date.now() };
    localStorage.setItem(GUEST_DRAFTS_KEY, JSON.stringify(all));
  } catch {}
}

function DraftPage({ state, setState, params }) {
  const { id: inviteId, topic: inviteTopic, date: inviteDate, name: inviteName } = params;

  if (!inviteId) {
    return (
      <section className="admin" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
        <h2 className="admin__title">Invalid invite link</h2>
        <p style={{ color: 'var(--fg-dim)' }}>This link is missing required parameters. Check your email for the correct link.</p>
      </section>
    );
  }

  const isExpired = inviteDate && inviteDate < new Date().toISOString().slice(0, 10);

  if (isExpired) {
    return (
      <section className="admin" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>◷</div>
        <h2 className="admin__title">Presentation date passed</h2>
        <p style={{ color: 'var(--fg-dim)' }}>This invite was for {formatDate(inviteDate)}. The link is no longer active.</p>
      </section>
    );
  }

  const live = state.liveLesson;
  const { remaining, openEnded } = useCountdown(live.liveStartedAt, live.duration ?? LIVE_DURATION_S);
  const isLive = live.liveStartedAt && (openEnded || remaining > 0) && !live.revealed;

  const [view, setView] = React.useState('edit'); // 'edit' | 'submitted'
  const [saved, setSaved] = React.useState(false);

  const [draft, setDraft] = React.useState(() => {
    const existing = loadGuestDraft(inviteId);
    if (existing) return existing;
    return {
      id: inviteId,
      presenterName: inviteName || '',
      topic: inviteTopic || state.topics[0]?.id || '',
      date: inviteDate || '',
      title: '',
      question: 'Interpret this EKG',
      answer: '',
      bullets: [],
      imageData: null,
      pdfData: null,
      imageUrl: '',
      duration: 30,
    };
  });

  const patch = (p) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  // Debounced autosave — 3s after last change.
  React.useEffect(() => {
    if (!inviteId) return;
    const t = setTimeout(() => {
      saveGuestDraft(inviteId, draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 3000);
    return () => clearTimeout(t);
  }, [draft]);

  const save = () => {
    saveGuestDraft(inviteId, draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const goLive = () => {
    saveGuestDraft(inviteId, draft);
    setState((s) => ({
      ...s,
      liveLesson: {
        ...s.liveLesson,
        ...draft,
        id: inviteId,
        liveStartedAt: Date.now(),
        revealed: false,
        responses: [],
      },
    }));
  };

  const stop = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, liveStartedAt: null, revealed: false } }));
  const reveal = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, revealed: true } }));

  const submitForReview = () => {
    const entry = {
      ...state.liveLesson,
      presenterName: draft.presenterName,
      id: 'pending-' + Date.now().toString(36),
      pendingAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      pendingLessons: [entry, ...(s.pendingLessons || [])],
      liveLesson: { ...s.liveLesson, liveStartedAt: null, revealed: false, responses: [] },
    }));
    setView('submitted');
  };

  const topicObj = state.topics.find((t) => t.id === (inviteTopic || draft.topic));
  const duration = draft.duration ?? LIVE_DURATION_S;
  const savedAt = loadGuestDraft(inviteId)?.savedAt;

  if (view === 'submitted') {
    return (
      <section className="admin" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✓</div>
        <h2 className="admin__title" style={{ marginBottom: 12 }}>Session submitted.</h2>
        <p style={{ color: 'var(--fg-dim)', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 20 }}>
          In the admin's review queue. It will appear in the archive once approved.
        </p>
      </section>
    );
  }

  return (
    <section className="admin">
      <div className="admin__head">
        <div>
          <div className="hero__label">Presenter draft</div>
          <h2 className="admin__title">{draft.presenterName || 'Your lecture'}</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          {topicObj && <div className="hero__label" style={{ color: topicObj.color }}>{topicObj.name}</div>}
          {inviteDate && <div style={{ fontSize: 13, color: 'var(--fg-dim)', marginTop: 4 }}>Presenting {formatDate(inviteDate)}</div>}
        </div>
      </div>

      <div className="admin__status" style={{ marginBottom: 24 }}>
        {isLive
          ? <><span className="dot dot--live" /> Live · {openEnded ? 'Open' : `${Math.ceil(remaining)}s`} · {live.responses.length} responses</>
          : live.revealed
          ? <><span className="dot dot--done" /> Revealed · {live.responses.length} responses</>
          : <><span className="dot dot--idle" /> Draft{savedAt ? ` · saved ${new Date(savedAt).toLocaleTimeString()}` : ' · unsaved'}</>}
      </div>

      <div className="admin__grid">
        {/* ── Left col: edit form + controls ── */}
        <div className="admin__col">
          <label className="admin__field">
            <span>Your name</span>
            <input value={draft.presenterName} onChange={(e) => patch({ presenterName: e.target.value })} placeholder="Dr. Smith" />
          </label>
          <label className="admin__field">
            <span>Lecture title</span>
            <input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Wellens' Syndrome" />
          </label>
          <div className="admin__field">
            <span>Topic</span>
            <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              {topicObj && <span className="chip__dot" style={{ background: topicObj.color }} />}
              <span>{topicObj?.name || inviteTopic}</span>
            </div>
          </div>
          <label className="admin__field">
            <span>Question to display</span>
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
                onClick={() => patch({ duration: 0 })}>Open</button>
            </div>
          </div>
          <label className="admin__field">
            <span>EKG image or PDF</span>
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
                {draft.pdfData ? 'PDF attached' : draft.imageData ? 'Image attached' : draft.imageUrl || 'No image yet — falls back to placeholder'}
              </span>
            </div>
          </label>
          <label className="admin__field">
            <span>…or image URL</span>
            <input value={draft.imageUrl || ''} onChange={(e) => patch({ imageUrl: e.target.value, imageData: null, pdfData: null })} placeholder="https://…" />
          </label>
          <label className="admin__field">
            <span>The read (answer)</span>
            <textarea rows={3} value={draft.answer} onChange={(e) => patch({ answer: e.target.value })} />
          </label>
          <label className="admin__field">
            <span>Teaching points (one per line)</span>
            <textarea rows={6} value={(draft.bullets || []).join('\n')} onChange={(e) => patch({ bullets: e.target.value.split('\n') })} />
          </label>

          <div className="admin__actions">
            <button className="btn btn--ghost" onClick={save}>
              {saved ? '✓ Saved' : 'Save progress'}
            </button>
            {!isLive && !live.revealed && (
              <button className="btn btn--primary" onClick={goLive}>
                ▶ Go live {duration ? `(${duration}s)` : '(open)'}
              </button>
            )}
            {isLive && <button className="btn btn--primary" onClick={reveal}>Reveal now</button>}
            {(isLive || live.revealed) && <button className="btn btn--danger" onClick={stop}>Reset</button>}
          </div>

          {live.revealed && (
            <div style={{
              marginTop: 24, padding: '20px 24px',
              border: '1px solid color-mix(in oklch, var(--accent-3) 40%, transparent)',
              background: 'color-mix(in oklch, var(--accent-3) 6%, transparent)',
              borderRadius: 2,
            }}>
              <div className="hero__label" style={{ marginBottom: 8 }}>Session complete</div>
              <p style={{ margin: '0 0 16px', color: 'var(--fg-dim)', fontSize: 15, lineHeight: 1.5 }}>
                Submit this session for admin review. Once approved it will appear in the archive.
              </p>
              <button className="btn btn--primary" onClick={submitForReview}>
                Submit for review →
              </button>
            </div>
          )}
        </div>

        {/* ── Right col: preview + stream ── */}
        <div className="admin__col">
          <div className="admin__preview">
            <div className="hero__label">EKG preview</div>
            <div className="admin__previewframe">
              <LessonMedia lesson={draft} height={180} grid={true} color="var(--accent)" />
            </div>
          </div>

          {(isLive || live.revealed) ? (
            <div style={{ marginTop: 24 }}>
              <div className="admin__streamhead">
                <div><strong>{live.responses.length}</strong> responses</div>
              </div>
              <ul className="admin__stream">
                {live.responses.length === 0
                  ? <li className="admin__empty">No responses yet.</li>
                  : live.responses.map((r, i) => {
                      const parts = r.split(' — ');
                      const text = parts[0];
                      const name = parts.length > 1 ? parts.slice(1).join(' — ') : null;
                      return (
                        <li key={i}>
                          <span className="admin__streamnum">{String(i + 1).padStart(2, '0')}</span>
                          <span className="admin__streamtext">{text}</span>
                          {name && <span className="admin__streamname">{name}</span>}
                        </li>
                      );
                    })}
              </ul>
            </div>
          ) : (
            <div style={{ marginTop: 24, color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1.7 }}>
              <div className="hero__label" style={{ marginBottom: 10 }}>How it works</div>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                <li>Fill in your lecture content and save your progress.</li>
                <li>Return to this link any time before {formatDate(inviteDate)} to keep editing.</li>
                <li>On presentation day, click <strong>Go live</strong>.</li>
                <li>Residents submit their reads during the countdown.</li>
                <li>Click <strong>Reveal now</strong> to show the answer and word cloud.</li>
                <li>Submit the session for the archive.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { DraftPage });
