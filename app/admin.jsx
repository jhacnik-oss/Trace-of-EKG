// Admin panel — password-gated. Post this week, schedule, view responses, edit archive, manage topics.

function AdminPage({ state, setState }) {
  const [auth, setAuth] = React.useState(() => sessionStorage.getItem('ekg-admin-auth') === '1');
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [tab, setTab] = React.useState('this-week');

  const submit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('ekg-admin-auth', '1');
      setAuth(true); setErr('');
    } else {
      setErr('Incorrect password.');
    }
  };

  if (!auth) {
    return (
      <section className="admin admin--locked">
        <form className="admin__login" onSubmit={submit}>
          <div className="admin__lock">◉</div>
          <h2>Admin access</h2>
          <p className="admin__sub">For the program director only.</p>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoFocus />
          {err && <div className="admin__err">{err}</div>}
          <button type="submit" className="btn btn--primary">Unlock →</button>
          <div className="admin__hint">Demo password: <code>sinus</code></div>
        </form>
      </section>
    );
  }

  const live = state.liveLesson;

  return (
    <section className="admin">
      <div className="admin__head">
        <div>
          <div className="hero__label">Admin</div>
          <h2 className="admin__title">Trace of EKG · control</h2>
        </div>
        <button className="btn btn--ghost" onClick={() => { sessionStorage.removeItem('ekg-admin-auth'); setAuth(false); }}>Sign out</button>
      </div>
      <div className="admin__tabs">
        {['this-week', 'live-stream', 'approvals', 'submissions', 'schedule', 'archive', 'topics'].map((t) => {
          const count = t === 'submissions'
            ? (state.submissions || []).filter((x) => x.status === 'new').length
            : t === 'approvals'
            ? (state.pendingLessons || []).length
            : 0;
          return (
            <button key={t} className={`admin__tab ${tab === t ? 'admin__tab--on' : ''}`} onClick={() => setTab(t)}>
              {t.replace('-', ' ')}
              {count > 0 && <span className="admin__tabbadge">{count}</span>}
            </button>
          );
        })}
      </div>

      {tab === 'this-week' && <ThisWeekPanel state={state} setState={setState} />}
      {tab === 'live-stream' && <LiveStreamPanel state={state} setState={setState} />}
      {tab === 'approvals' && <ApprovalsPanel state={state} setState={setState} />}
      {tab === 'submissions' && <SubmissionsPanel state={state} setState={setState} />}
      {tab === 'schedule' && <SchedulePanel state={state} setState={setState} />}
      {tab === 'archive' && <ArchiveAdminPanel state={state} setState={setState} />}
      {tab === 'topics' && <TopicsPanel state={state} setState={setState} />}
    </section>
  );
}

function SubmissionsPanel({ state, setState }) {
  const subs = state.submissions || [];
  const [filter, setFilter] = React.useState('all');
  const [openId, setOpenId] = React.useState(null);

  const filtered = filter === 'all' ? subs : subs.filter((s) => s.status === filter);
  const open = subs.find((s) => s.id === openId);

  const setStatus = (id, status) => setState((s) => ({
    ...s, submissions: s.submissions.map((x) => x.id === id ? { ...x, status } : x),
  }));
  const remove = (id) => {
    if (!confirm('Delete this submission?')) return;
    setState((s) => ({ ...s, submissions: s.submissions.filter((x) => x.id !== id) }));
    setOpenId(null);
  };
  const promoteToLive = (sub) => {
    setState((s) => ({
      ...s,
      liveLesson: {
        ...s.liveLesson,
        title: sub.title || 'Submitted EKG',
        topic: sub.topic || s.liveLesson.topic,
        question: 'Interpret this EKG',
        answer: '',
        bullets: sub.notes ? sub.notes.split('\n').filter(Boolean) : [],
        imageData: sub.imageData,
        pdfData: sub.pdfData,
        imageUrl: '',
        responses: [],
        revealed: false,
        liveStartedAt: null,
      },
      submissions: s.submissions.map((x) => x.id === sub.id ? { ...x, status: 'used' } : x),
    }));
    alert('Loaded into "This Week". Open the This Week tab to edit and go live.');
  };

  return (
    <div>
      <div className="admin__streamhead">
        <h3 className="admin__sub2">Resident submissions ({subs.length})</h3>
        <div className="tweaks__opts">
          {['all', 'new', 'reviewed', 'used', 'archived'].map((f) => (
            <button key={f} className={`tweaks__opt ${filter === f ? 'tweaks__opt--on' : ''}`} onClick={() => setFilter(f)}>
              {f}{f !== 'all' && ` · ${subs.filter((s) => s.status === f).length}`}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="admin__empty">Nothing here yet.</div>
      ) : (
        <ul className="admin__sublist">
          {filtered.map((sub) => (
            <li key={sub.id} className={`admin__subitem admin__subitem--${sub.status}`}>
              <div className="admin__subthumb">
                {sub.imageData ? <img src={sub.imageData} alt="" /> : sub.pdfData ? <div className="admin__subpdf">PDF</div> : <div className="admin__subpdf">—</div>}
              </div>
              <div className="admin__submeta">
                <div className="admin__subtitle">{sub.title || <em style={{ color: 'var(--fg-faint)' }}>Untitled tracing</em>}</div>
                <div className="admin__subwho">{sub.name} · <a href={`mailto:${sub.email}`}>{sub.email}</a></div>
                {sub.notes && <div className="admin__subnotes">{sub.notes}</div>}
                <div className="admin__substamp">
                  <span className={`admin__substatus admin__substatus--${sub.status}`}>{sub.status}</span>
                  · {new Date(sub.submittedAt).toLocaleString()}
                  {sub.topic && ` · ${(state.topics.find((t) => t.id === sub.topic) || {}).name || sub.topic}`}
                </div>
              </div>
              <div className="admin__subactions">
                <button className="btn btn--ghost btn--sm" onClick={() => setOpenId(sub.id)}>View</button>
                <button className="btn btn--primary btn--sm" onClick={() => promoteToLive(sub)}>Use →</button>
                <button className="btn btn--ghost btn--sm" onClick={() => setStatus(sub.id, sub.status === 'reviewed' ? 'new' : 'reviewed')}>
                  {sub.status === 'reviewed' ? 'Unmark' : 'Mark reviewed'}
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => remove(sub.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="modal" onClick={() => setOpenId(null)}>
          <div className="modal__card" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setOpenId(null)}>×</button>
            <div className="modal__meta">SUBMISSION · {new Date(open.submittedAt).toLocaleString()} · {open.status}</div>
            <h2 className="modal__title">{open.title || 'Untitled tracing'}</h2>
            <div style={{ marginTop: 8, color: 'var(--fg-dim)' }}>From <strong>{open.name}</strong> · <a href={`mailto:${open.email}`}>{open.email}</a></div>
            <div className="modal__trace">
              {open.imageData ? (
                <img src={open.imageData} alt="" style={{ maxWidth: '100%', display: 'block' }} />
              ) : open.pdfData ? (
                <embed src={open.pdfData} type="application/pdf" width="100%" height="500" />
              ) : null}
            </div>
            {open.notes && (
              <div className="modal__section">
                <div className="hero__label">Notes from submitter</div>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{open.notes}</p>
              </div>
            )}
            <div className="admin__actions">
              <button className="btn btn--primary" onClick={() => promoteToLive(open)}>Use as this week →</button>
              <button className="btn btn--ghost" onClick={() => setStatus(open.id, 'archived')}>Archive</button>
              <button className="btn btn--danger" onClick={() => remove(open.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SubmissionsPanel });

function ThisWeekPanel({ state, setState }) {
  const live = state.liveLesson;
  const [draft, setDraft] = React.useState(live);
  React.useEffect(() => setDraft(live), [live.id]);

  const duration = draft.duration ?? LIVE_DURATION_S;
  const { remaining, openEnded } = useCountdown(live.liveStartedAt, live.duration ?? LIVE_DURATION_S);
  const isLive = live.liveStartedAt && (openEnded || remaining > 0) && !live.revealed;

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const save = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, ...draft } }));
  const goLive = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, ...draft, liveStartedAt: Date.now(), revealed: false, responses: [] } }));
  const stop = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, liveStartedAt: null, revealed: false } }));
  const reveal = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, revealed: true } }));

  return (
    <div className="admin__grid">
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
              className={`tweaks__opt ${(!duration) ? 'tweaks__opt--on' : ''}`}
              onClick={() => patch({ duration: 0 })}>Open — no timer</button>
            <input type="number" min="5" max="600"
              value={duration || ''} placeholder="custom s"
              onChange={(e) => patch({ duration: +e.target.value || 0 })}
              style={{ width: 90 }} />
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
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => patch({ imageData: null, pdfData: null, imageUrl: '' })}>Clear</button>
            )}
            <span className="admin__uploadhint">
              {draft.pdfData ? 'PDF attached' : draft.imageData ? 'Image attached' : draft.imageUrl ? draft.imageUrl : 'Falls back to placeholder trace if blank'}
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
      </div>
      <div className="admin__col">
        <div className="admin__preview">
          <div className="hero__label">Live preview</div>
          <div className="admin__previewframe">
            <LessonMedia lesson={draft} height={180} grid={true} color="var(--accent)" />
          </div>
          <div className="admin__status">
            {isLive ? <><span className="dot dot--live" /> Live · {Math.ceil(remaining)}s · {live.responses.length} responses</> :
             live.revealed ? <><span className="dot dot--done" /> Revealed · {live.responses.length} responses</> :
             <><span className="dot dot--idle" /> Idle</>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveStreamPanel({ state, setState }) {
  const live = state.liveLesson;
  const clear = () => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, responses: [] } }));
  const remove = (i) => setState((s) => ({ ...s, liveLesson: { ...s.liveLesson, responses: s.liveLesson.responses.filter((_, idx) => idx !== i) } }));
  return (
    <div>
      <div className="admin__streamhead">
        <div><strong>{live.responses.length}</strong> responses for Week {live.week}</div>
        <button className="btn btn--ghost" onClick={clear}>Clear all</button>
      </div>
      <ul className="admin__stream">
        {live.responses.length === 0 && <li className="admin__empty">No responses yet. Go live to start collecting.</li>}
        {live.responses.map((r, i) => (
          <li key={i}>
            <span className="admin__streamnum">{String(i + 1).padStart(2, '0')}</span>
            <span className="admin__streamtext">{r}</span>
            <button className="admin__streamdel" onClick={() => remove(i)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SchedulePanel({ state, setState }) {
  const [draft, setDraft] = React.useState({ title: '', date: '', topic: state.topics[0].id, question: 'Interpret this EKG', answer: '', bullets: '' });
  const add = () => {
    if (!draft.title || !draft.date) return;
    const entry = { ...draft, id: 'sched-' + Date.now(), bullets: draft.bullets.split('\n').filter(Boolean) };
    setState((s) => ({ ...s, schedule: [...s.schedule, entry] }));
    setDraft({ title: '', date: '', topic: state.topics[0].id, question: 'Interpret this EKG', answer: '', bullets: '' });
  };
  const remove = (id) => setState((s) => ({ ...s, schedule: s.schedule.filter((x) => x.id !== id) }));
  return (
    <div className="admin__grid">
      <div className="admin__col">
        <h3 className="admin__sub2">Queue a future week</h3>
        <label className="admin__field"><span>Title</span>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <div className="admin__row2">
          <label className="admin__field"><span>Date</span>
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="admin__field"><span>Topic</span>
            <select value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })}>
              {state.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select></label>
        </div>
        <label className="admin__field"><span>The read</span>
          <textarea rows={2} value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} /></label>
        <label className="admin__field"><span>Teaching points</span>
          <textarea rows={5} value={draft.bullets} onChange={(e) => setDraft({ ...draft, bullets: e.target.value })} /></label>
        <div className="admin__actions"><button className="btn btn--primary" onClick={add}>+ Schedule</button></div>
      </div>
      <div className="admin__col">
        <h3 className="admin__sub2">Upcoming</h3>
        {state.schedule.length === 0 && <div className="admin__empty">Nothing queued.</div>}
        <ul className="admin__sched">
          {state.schedule.map((s) => {
            const topic = state.topics.find((t) => t.id === s.topic);
            return (
              <li key={s.id}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 13, opacity: 0.6 }}>
                    {formatDate(s.date)} · <span style={{ color: topic?.color }}>{topic?.name}</span>
                  </div>
                </div>
                <button className="admin__streamdel" onClick={() => remove(s.id)}>×</button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ArchiveAdminPanel({ state, setState }) {
  const [editing, setEditing] = React.useState(null);
  const remove = (id) => {
    if (!confirm('Delete this lesson?')) return;
    setState((s) => ({ ...s, lessons: s.lessons.filter((l) => l.id !== id) }));
  };
  const save = () => {
    setState((s) => ({ ...s, lessons: s.lessons.map((l) => l.id === editing.id ? editing : l) }));
    setEditing(null);
  };
  if (editing) {
    return (
      <div className="admin__col">
        <label className="admin__field"><span>Title</span>
          <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
        <label className="admin__field"><span>Topic</span>
          <select value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })}>
            {state.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></label>
        <label className="admin__field"><span>The read</span>
          <textarea rows={3} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} /></label>
        <label className="admin__field"><span>Teaching points</span>
          <textarea rows={6} value={editing.bullets.join('\n')} onChange={(e) => setEditing({ ...editing, bullets: e.target.value.split('\n') })} /></label>
        <div className="admin__actions">
          <button className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={save}>Save</button>
        </div>
      </div>
    );
  }
  return (
    <ul className="admin__archivelist">
      {state.lessons.map((l) => {
        const topic = state.topics.find((t) => t.id === l.topic);
        return (
          <li key={l.id}>
            <span className="archive__week">W{String(l.week).padStart(2, '0')}</span>
            <span style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{l.title}</div>
              <div style={{ fontSize: 13, opacity: 0.6 }}>
                <span style={{ color: topic?.color }}>{topic?.name}</span> · {formatDate(l.date)} · {l.responses?.length || 0} reads
              </div>
            </span>
            <button className="btn btn--ghost btn--sm" onClick={() => setEditing(l)}>Edit</button>
            <button className="admin__streamdel" onClick={() => remove(l.id)}>×</button>
          </li>
        );
      })}
    </ul>
  );
}

function TopicsPanel({ state, setState }) {
  const [draft, setDraft] = React.useState({ name: '', color: '#888888' });
  const add = () => {
    if (!draft.name) return;
    const id = draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setState((s) => ({ ...s, topics: [...s.topics, { id, ...draft }] }));
    setDraft({ name: '', color: '#888888' });
  };
  const remove = (id) => setState((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== id) }));
  const update = (id, p) => setState((s) => ({ ...s, topics: s.topics.map((t) => t.id === id ? { ...t, ...p } : t) }));
  return (
    <div>
      <ul className="admin__topics">
        {state.topics.map((t) => (
          <li key={t.id}>
            <input type="color" value={t.color} onChange={(e) => update(t.id, { color: e.target.value })} />
            <input value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} />
            <button className="admin__streamdel" onClick={() => remove(t.id)}>×</button>
          </li>
        ))}
      </ul>
      <div className="admin__addrow">
        <input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
        <input placeholder="New topic name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <button className="btn btn--primary" onClick={add}>+ Add topic</button>
      </div>
    </div>
  );
}

function ApprovalsPanel({ state, setState }) {
  const pending = state.pendingLessons || [];
  const [editing, setEditing] = React.useState(null);

  const approve = (lesson) => {
    const archived = { ...lesson, id: lesson.id.replace('pending-', 'w'), week: lesson.week || state.currentWeek };
    setState((s) => ({
      ...s,
      lessons: [archived, ...s.lessons],
      pendingLessons: s.pendingLessons.filter((p) => p.id !== lesson.id),
    }));
    if (editing?.id === lesson.id) setEditing(null);
  };

  const reject = (id) => {
    if (!confirm('Remove this session without archiving?')) return;
    setState((s) => ({ ...s, pendingLessons: s.pendingLessons.filter((p) => p.id !== id) }));
    if (editing?.id === id) setEditing(null);
  };

  if (pending.length === 0) {
    return <div className="admin__empty">No sessions pending review. Guest lecturers will appear here after they submit.</div>;
  }

  if (editing) {
    return (
      <div className="admin__col">
        <div className="hero__label" style={{ marginBottom: 12 }}>Editing pending session</div>
        <label className="admin__field"><span>Title</span>
          <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
        <label className="admin__field"><span>Topic</span>
          <select value={editing.topic} onChange={(e) => setEditing({ ...editing, topic: e.target.value })}>
            {state.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select></label>
        <label className="admin__field"><span>The read</span>
          <textarea rows={3} value={editing.answer} onChange={(e) => setEditing({ ...editing, answer: e.target.value })} /></label>
        <label className="admin__field"><span>Teaching points (one per line)</span>
          <textarea rows={6} value={(editing.bullets || []).join('\n')} onChange={(e) => setEditing({ ...editing, bullets: e.target.value.split('\n') })} /></label>
        <div className="admin__actions">
          <button className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn btn--primary" onClick={() => approve(editing)}>Approve & archive →</button>
          <button className="btn btn--danger" onClick={() => reject(editing.id)}>Reject</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin__streamhead">
        <h3 className="admin__sub2">Pending guest sessions ({pending.length})</h3>
      </div>
      <ul className="admin__sublist">
        {pending.map((lesson) => {
          const topic = state.topics.find((t) => t.id === lesson.topic);
          return (
            <li key={lesson.id} className="admin__subitem">
              <div className="admin__subthumb">
                <LessonMedia lesson={lesson} height={80} grid={false} color="var(--accent)" />
              </div>
              <div className="admin__submeta">
                <div className="admin__subtitle">{lesson.title || <em style={{ color: 'var(--fg-faint)' }}>Untitled</em>}</div>
                <div className="admin__subwho" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chip__dot" style={{ background: topic?.color }} />
                  {topic?.name}
                </div>
                <div className="admin__substamp">
                  {lesson.responses?.length || 0} responses · submitted {new Date(lesson.pendingAt).toLocaleString()}
                </div>
                {lesson.responses?.length > 0 && (
                  <div className="admin__subnotes">
                    {lesson.responses.slice(0, 5).join(' · ')}{lesson.responses.length > 5 ? ' …' : ''}
                  </div>
                )}
              </div>
              <div className="admin__subactions">
                <button className="btn btn--ghost btn--sm" onClick={() => setEditing(lesson)}>Edit & review</button>
                <button className="btn btn--primary btn--sm" onClick={() => approve(lesson)}>Approve →</button>
                <button className="btn btn--danger btn--sm" onClick={() => reject(lesson.id)}>Reject</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

Object.assign(window, { AdminPage, ApprovalsPanel });
