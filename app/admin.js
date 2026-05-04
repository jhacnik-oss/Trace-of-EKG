// Admin panel — password-gated. Post this week, schedule, view responses, edit archive, manage topics.

function AdminPage({
  state,
  setState
}) {
  const [auth, setAuth] = React.useState(() => sessionStorage.getItem('ekg-admin-auth') === '1');
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [tab, setTab] = React.useState('this-week');
  const submit = e => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('ekg-admin-auth', '1');
      setAuth(true);
      setErr('');
    } else {
      setErr('Incorrect password.');
    }
  };
  if (!auth) {
    return /*#__PURE__*/React.createElement("section", {
      className: "admin admin--locked"
    }, /*#__PURE__*/React.createElement("form", {
      className: "admin__login",
      onSubmit: submit
    }, /*#__PURE__*/React.createElement("div", {
      className: "admin__lock"
    }, "\u25C9"), /*#__PURE__*/React.createElement("h2", null, "Admin access"), /*#__PURE__*/React.createElement("p", {
      className: "admin__sub"
    }, "Local prototype controls. This is not production authentication."), /*#__PURE__*/React.createElement("input", {
      type: "password",
      value: pw,
      onChange: e => setPw(e.target.value),
      placeholder: "Password",
      autoFocus: true
    }), err && /*#__PURE__*/React.createElement("div", {
      className: "admin__err"
    }, err), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "btn btn--primary"
    }, "Unlock \u2192"), /*#__PURE__*/React.createElement("div", {
      className: "admin__hint"
    }, "Demo password: ", /*#__PURE__*/React.createElement("code", null, ADMIN_PASSWORD))));
  }
  const live = state.liveLesson;
  return /*#__PURE__*/React.createElement("section", {
    className: "admin"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Admin"), /*#__PURE__*/React.createElement("h2", {
    className: "admin__title"
  }, "Trace of EKG \xB7 control")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost",
    onClick: () => {
      sessionStorage.removeItem('ekg-admin-auth');
      setAuth(false);
    }
  }, "Sign out")), /*#__PURE__*/React.createElement("div", {
    className: "admin__tabs"
  }, ['this-week', 'live-stream', 'drafts', 'invites', 'approvals', 'submissions', 'schedule', 'archive', 'topics'].map(t => {
    const count = t === 'submissions' ? (state.submissions || []).filter(x => x.status === 'new').length : t === 'approvals' ? (state.pendingLessons || []).length : 0;
    return /*#__PURE__*/React.createElement("button", {
      key: t,
      className: `admin__tab ${tab === t ? 'admin__tab--on' : ''}`,
      onClick: () => setTab(t)
    }, t.replace('-', ' '), count > 0 && /*#__PURE__*/React.createElement("span", {
      className: "admin__tabbadge"
    }, count));
  })), tab === 'this-week' && /*#__PURE__*/React.createElement(ThisWeekPanel, {
    state: state,
    setState: setState
  }), tab === 'live-stream' && /*#__PURE__*/React.createElement(LiveStreamPanel, {
    state: state,
    setState: setState
  }), tab === 'drafts' && /*#__PURE__*/React.createElement(DraftsPanel, {
    state: state,
    setState: setState
  }), tab === 'invites' && /*#__PURE__*/React.createElement(InvitesPanel, {
    state: state,
    setState: setState
  }), tab === 'approvals' && /*#__PURE__*/React.createElement(ApprovalsPanel, {
    state: state,
    setState: setState
  }), tab === 'submissions' && /*#__PURE__*/React.createElement(SubmissionsPanel, {
    state: state,
    setState: setState
  }), tab === 'schedule' && /*#__PURE__*/React.createElement(SchedulePanel, {
    state: state,
    setState: setState
  }), tab === 'archive' && /*#__PURE__*/React.createElement(ArchiveAdminPanel, {
    state: state,
    setState: setState
  }), tab === 'topics' && /*#__PURE__*/React.createElement(TopicsPanel, {
    state: state,
    setState: setState
  }));
}
function SubmissionsPanel({
  state,
  setState
}) {
  const subs = state.submissions || [];
  const [filter, setFilter] = React.useState('all');
  const [openId, setOpenId] = React.useState(null);
  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter);
  const open = subs.find(s => s.id === openId);
  const setStatus = (id, status) => setState(s => ({
    ...s,
    submissions: s.submissions.map(x => x.id === id ? {
      ...x,
      status
    } : x)
  }));
  const remove = id => {
    if (!confirm('Delete this submission?')) return;
    setState(s => ({
      ...s,
      submissions: s.submissions.filter(x => x.id !== id)
    }));
    setOpenId(null);
  };
  const promoteToLive = sub => {
    setState(s => ({
      ...s,
      liveLesson: {
        ...s.liveLesson,
        title: sub.title || 'Submitted EKG',
        topic: sub.topic || s.liveLesson.topic,
        question: 'Interpret this EKG',
        answer: '',
        bullets: sub.notes ? sub.notes.split('\n').filter(Boolean) : [],
        imageData: sub.imageData || null,
        pdfData: sub.pdfData || null,
        imageUrl: sub.imageUrl || '',
        pdfUrl: sub.pdfUrl || '',
        responses: [],
        revealed: false,
        liveStartedAt: null
      },
      submissions: s.submissions.map(x => x.id === sub.id ? {
        ...x,
        status: 'used'
      } : x)
    }));
    alert('Loaded into "This Week". Open the This Week tab to edit and go live.');
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "admin__streamhead"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "admin__sub2"
  }, "Resident submissions (", subs.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "tweaks__opts"
  }, ['all', 'new', 'reviewed', 'used', 'archived'].map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    className: `tweaks__opt ${filter === f ? 'tweaks__opt--on' : ''}`,
    onClick: () => setFilter(f)
  }, f, f !== 'all' && ` · ${subs.filter(s => s.status === f).length}`)))), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "admin__empty"
  }, "Nothing here yet.") : /*#__PURE__*/React.createElement("ul", {
    className: "admin__sublist"
  }, filtered.map(sub => /*#__PURE__*/React.createElement("li", {
    key: sub.id,
    className: `admin__subitem admin__subitem--${sub.status}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__subthumb"
  }, sub.imageData || sub.imageUrl ? /*#__PURE__*/React.createElement("img", {
    src: sub.imageData || sub.imageUrl,
    alt: ""
  }) : sub.pdfData || sub.pdfUrl ? /*#__PURE__*/React.createElement("div", {
    className: "admin__subpdf"
  }, "PDF") : /*#__PURE__*/React.createElement("div", {
    className: "admin__subpdf"
  }, "\u2014")), /*#__PURE__*/React.createElement("div", {
    className: "admin__submeta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__subtitle"
  }, sub.title || /*#__PURE__*/React.createElement("em", {
    style: {
      color: 'var(--fg-faint)'
    }
  }, "Untitled tracing")), /*#__PURE__*/React.createElement("div", {
    className: "admin__subwho"
  }, sub.name, " \xB7 ", /*#__PURE__*/React.createElement("a", {
    href: `mailto:${sub.email}`
  }, sub.email)), sub.notes && /*#__PURE__*/React.createElement("div", {
    className: "admin__subnotes"
  }, sub.notes), /*#__PURE__*/React.createElement("div", {
    className: "admin__substamp"
  }, /*#__PURE__*/React.createElement("span", {
    className: `admin__substatus admin__substatus--${sub.status}`
  }, sub.status), "\xB7 ", new Date(sub.submittedAt).toLocaleString(), sub.topic && ` · ${(state.topics.find(t => t.id === sub.topic) || {}).name || sub.topic}`)), /*#__PURE__*/React.createElement("div", {
    className: "admin__subactions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost btn--sm",
    onClick: () => setOpenId(sub.id)
  }, "View"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary btn--sm",
    onClick: () => promoteToLive(sub)
  }, "Use \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost btn--sm",
    onClick: () => setStatus(sub.id, sub.status === 'reviewed' ? 'new' : 'reviewed')
  }, sub.status === 'reviewed' ? 'Unmark' : 'Mark reviewed'), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--danger btn--sm",
    onClick: () => remove(sub.id)
  }, "Delete"))))), open && /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: () => setOpenId(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal__card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal__close",
    onClick: () => setOpenId(null)
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "modal__meta"
  }, "SUBMISSION \xB7 ", new Date(open.submittedAt).toLocaleString(), " \xB7 ", open.status), /*#__PURE__*/React.createElement("h2", {
    className: "modal__title"
  }, open.title || 'Untitled tracing'), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      color: 'var(--fg-dim)'
    }
  }, "From ", /*#__PURE__*/React.createElement("strong", null, open.name), " \xB7 ", /*#__PURE__*/React.createElement("a", {
    href: `mailto:${open.email}`
  }, open.email)), /*#__PURE__*/React.createElement("div", {
    className: "modal__trace"
  }, open.imageData || open.imageUrl ? /*#__PURE__*/React.createElement("img", {
    src: open.imageData || open.imageUrl,
    alt: "",
    style: {
      maxWidth: '100%',
      display: 'block'
    }
  }) : open.pdfData || open.pdfUrl ? /*#__PURE__*/React.createElement("embed", {
    src: open.pdfData || open.pdfUrl,
    type: "application/pdf",
    width: "100%",
    height: "500"
  }) : null), open.notes && /*#__PURE__*/React.createElement("div", {
    className: "modal__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Notes from submitter"), /*#__PURE__*/React.createElement("p", {
    style: {
      whiteSpace: 'pre-wrap',
      marginTop: 8
    }
  }, open.notes)), /*#__PURE__*/React.createElement("div", {
    className: "admin__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: () => promoteToLive(open)
  }, "Use as this week \u2192"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost",
    onClick: () => setStatus(open.id, 'archived')
  }, "Archive"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--danger",
    onClick: () => remove(open.id)
  }, "Delete")))));
}
Object.assign(window, {
  SubmissionsPanel
});
function ThisWeekPanel({
  state,
  setState
}) {
  const live = state.liveLesson;
  const [draft, setDraft] = React.useState(live);
  React.useEffect(() => setDraft(live), [live.id]);
  const duration = draft.duration ?? LIVE_DURATION_S;
  const {
    remaining,
    openEnded
  } = useCountdown(live.liveStartedAt, live.duration ?? LIVE_DURATION_S);
  const isLive = live.liveStartedAt && (openEnded || remaining > 0) && !live.revealed;
  const patch = p => setDraft(d => ({
    ...d,
    ...p
  }));
  const save = () => setState(s => ({
    ...s,
    liveLesson: {
      ...s.liveLesson,
      ...draft
    }
  }));
  const goLive = () => setState(s => ({
    ...s,
    liveLesson: {
      ...s.liveLesson,
      ...draft,
      liveStartedAt: Date.now(),
      revealed: false,
      responses: []
    }
  }));
  const stop = () => setState(s => ({
    ...s,
    liveLesson: {
      ...s.liveLesson,
      liveStartedAt: null,
      revealed: false
    }
  }));
  const reveal = () => setState(s => ({
    ...s,
    liveLesson: {
      ...s.liveLesson,
      revealed: true
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "admin__grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Title"), /*#__PURE__*/React.createElement("input", {
    value: draft.title,
    onChange: e => patch({
      title: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: draft.date,
    onChange: e => patch({
      date: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Topic"), /*#__PURE__*/React.createElement("select", {
    value: draft.topic,
    onChange: e => patch({
      topic: e.target.value
    })
  }, state.topics.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name)))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Question"), /*#__PURE__*/React.createElement("input", {
    value: draft.question,
    onChange: e => patch({
      question: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Submission window"), /*#__PURE__*/React.createElement("div", {
    className: "admin__durations"
  }, [15, 30, 45, 60, 90, 120].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    type: "button",
    className: `tweaks__opt ${duration === s ? 'tweaks__opt--on' : ''}`,
    onClick: () => patch({
      duration: s
    })
  }, s, "s")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `tweaks__opt ${!duration ? 'tweaks__opt--on' : ''}`,
    onClick: () => patch({
      duration: 0
    })
  }, "Open \u2014 no timer"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "5",
    max: "600",
    value: duration || '',
    placeholder: "custom s",
    onChange: e => patch({
      duration: +e.target.value || 0
    }),
    style: {
      width: 90
    }
  }))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "EKG image or PDF (upload)"), /*#__PURE__*/React.createElement("div", {
    className: "admin__upload"
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*,application/pdf",
    onChange: async e => {
      const f = e.target.files?.[0];
      if (!f) return;
      const data = await fileToDataURL(f);
      if (f.type === 'application/pdf') patch({
        pdfData: data,
        imageData: null,
        imageUrl: ''
      });else patch({
        imageData: data,
        pdfData: null,
        imageUrl: ''
      });
    }
  }), (draft.imageData || draft.pdfData || draft.imageUrl) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn--ghost btn--sm",
    onClick: () => patch({
      imageData: null,
      pdfData: null,
      imageUrl: ''
    })
  }, "Clear"), /*#__PURE__*/React.createElement("span", {
    className: "admin__uploadhint"
  }, draft.pdfData ? 'PDF attached' : draft.imageData ? 'Image attached' : draft.imageUrl ? draft.imageUrl : 'Falls back to placeholder trace if blank'))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "\u2026or external image URL"), /*#__PURE__*/React.createElement("input", {
    value: draft.imageUrl || '',
    onChange: e => patch({
      imageUrl: e.target.value,
      imageData: null,
      pdfData: null
    }),
    placeholder: "https://\u2026"
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "The read (answer)"), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    value: draft.answer,
    onChange: e => patch({
      answer: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Teaching points (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    rows: 6,
    value: draft.bullets.join('\n'),
    onChange: e => patch({
      bullets: e.target.value.split('\n')
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost",
    onClick: save
  }, "Save draft"), !isLive && !live.revealed && /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: goLive
  }, "\u25B6 Go live ", duration ? `(${duration}s)` : '(open)'), isLive && /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: reveal
  }, "Reveal now"), (isLive || live.revealed) && /*#__PURE__*/React.createElement("button", {
    className: "btn btn--danger",
    onClick: stop
  }, "Reset to idle"))), /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__preview"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Live preview"), /*#__PURE__*/React.createElement("div", {
    className: "admin__previewframe"
  }, /*#__PURE__*/React.createElement(LessonMedia, {
    lesson: draft,
    height: 180,
    grid: true,
    color: "var(--accent)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__status"
  }, isLive ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--live"
  }), " Live \xB7 ", Math.ceil(remaining), "s \xB7 ", live.responses.length, " responses") : live.revealed ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--done"
  }), " Revealed \xB7 ", live.responses.length, " responses") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--idle"
  }), " Idle")))));
}
function LiveStreamPanel({
  state,
  setState
}) {
  const live = state.liveLesson;
  const clear = () => setState(s => ({
    ...s,
    liveLesson: {
      ...s.liveLesson,
      responses: []
    }
  }));
  const remove = i => setState(s => ({
    ...s,
    liveLesson: {
      ...s.liveLesson,
      responses: s.liveLesson.responses.filter((_, idx) => idx !== i)
    }
  }));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "admin__streamhead"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, live.responses.length), " responses"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost",
    onClick: clear
  }, "Clear all")), /*#__PURE__*/React.createElement("ul", {
    className: "admin__stream"
  }, live.responses.length === 0 && /*#__PURE__*/React.createElement("li", {
    className: "admin__empty"
  }, "No responses yet. Go live to start collecting."), live.responses.map((r, i) => {
    const parts = r.split(' — ');
    const text = parts[0];
    const name = parts.length > 1 ? parts.slice(1).join(' — ') : null;
    return /*#__PURE__*/React.createElement("li", {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      className: "admin__streamnum"
    }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", {
      className: "admin__streamtext"
    }, text), name && /*#__PURE__*/React.createElement("span", {
      className: "admin__streamname"
    }, name), /*#__PURE__*/React.createElement("button", {
      className: "admin__streamdel",
      onClick: () => remove(i)
    }, "\xD7"));
  })));
}
function SchedulePanel({
  state,
  setState
}) {
  const [draft, setDraft] = React.useState({
    title: '',
    date: '',
    topic: state.topics[0].id,
    question: 'Interpret this EKG',
    answer: '',
    bullets: ''
  });
  const add = () => {
    if (!draft.title || !draft.date) return;
    const entry = {
      ...draft,
      id: 'sched-' + Date.now(),
      bullets: draft.bullets.split('\n').filter(Boolean)
    };
    setState(s => ({
      ...s,
      schedule: [...s.schedule, entry]
    }));
    setDraft({
      title: '',
      date: '',
      topic: state.topics[0].id,
      question: 'Interpret this EKG',
      answer: '',
      bullets: ''
    });
  };
  const remove = id => setState(s => ({
    ...s,
    schedule: s.schedule.filter(x => x.id !== id)
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "admin__grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "admin__sub2"
  }, "Queue a future week"), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Title"), /*#__PURE__*/React.createElement("input", {
    value: draft.title,
    onChange: e => setDraft({
      ...draft,
      title: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__row2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: draft.date,
    onChange: e => setDraft({
      ...draft,
      date: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Topic"), /*#__PURE__*/React.createElement("select", {
    value: draft.topic,
    onChange: e => setDraft({
      ...draft,
      topic: e.target.value
    })
  }, state.topics.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name))))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "The read"), /*#__PURE__*/React.createElement("textarea", {
    rows: 2,
    value: draft.answer,
    onChange: e => setDraft({
      ...draft,
      answer: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Teaching points"), /*#__PURE__*/React.createElement("textarea", {
    rows: 5,
    value: draft.bullets,
    onChange: e => setDraft({
      ...draft,
      bullets: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: add
  }, "+ Schedule"))), /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "admin__sub2"
  }, "Upcoming"), state.schedule.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "admin__empty"
  }, "Nothing queued."), /*#__PURE__*/React.createElement("ul", {
    className: "admin__sched"
  }, state.schedule.map(s => {
    const topic = state.topics.find(t => t.id === s.topic);
    return /*#__PURE__*/React.createElement("li", {
      key: s.id
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600
      }
    }, s.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        opacity: 0.6
      }
    }, formatDate(s.date), " \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: topic?.color
      }
    }, topic?.name))), /*#__PURE__*/React.createElement("button", {
      className: "admin__streamdel",
      onClick: () => remove(s.id)
    }, "\xD7"));
  }))));
}
function ArchiveAdminPanel({
  state,
  setState
}) {
  const [editing, setEditing] = React.useState(null);
  const remove = id => {
    if (!confirm('Delete this lesson?')) return;
    setState(s => ({
      ...s,
      lessons: s.lessons.filter(l => l.id !== id)
    }));
  };
  const save = () => {
    setState(s => ({
      ...s,
      lessons: s.lessons.map(l => l.id === editing.id ? editing : l)
    }));
    setEditing(null);
  };
  if (editing) {
    return /*#__PURE__*/React.createElement("div", {
      className: "admin__col"
    }, /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "Title"), /*#__PURE__*/React.createElement("input", {
      value: editing.title,
      onChange: e => setEditing({
        ...editing,
        title: e.target.value
      })
    })), /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "Topic"), /*#__PURE__*/React.createElement("select", {
      value: editing.topic,
      onChange: e => setEditing({
        ...editing,
        topic: e.target.value
      })
    }, state.topics.map(t => /*#__PURE__*/React.createElement("option", {
      key: t.id,
      value: t.id
    }, t.name)))), /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "The read"), /*#__PURE__*/React.createElement("textarea", {
      rows: 3,
      value: editing.answer,
      onChange: e => setEditing({
        ...editing,
        answer: e.target.value
      })
    })), /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "Teaching points"), /*#__PURE__*/React.createElement("textarea", {
      rows: 6,
      value: editing.bullets.join('\n'),
      onChange: e => setEditing({
        ...editing,
        bullets: e.target.value.split('\n')
      })
    })), /*#__PURE__*/React.createElement("div", {
      className: "admin__actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost",
      onClick: () => setEditing(null)
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--primary",
      onClick: save
    }, "Save")));
  }
  return /*#__PURE__*/React.createElement("ul", {
    className: "admin__archivelist"
  }, state.lessons.map(l => {
    const topic = state.topics.find(t => t.id === l.topic);
    return /*#__PURE__*/React.createElement("li", {
      key: l.id
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600
      }
    }, l.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        opacity: 0.6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: topic?.color
      }
    }, topic?.name), " \xB7 ", formatDate(l.date), " \xB7 ", l.responses?.length || 0, " reads")), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost btn--sm",
      onClick: () => setEditing(l)
    }, "Edit"), /*#__PURE__*/React.createElement("button", {
      className: "admin__streamdel",
      onClick: () => remove(l.id)
    }, "\xD7"));
  }));
}
function TopicsPanel({
  state,
  setState
}) {
  const [draft, setDraft] = React.useState({
    name: '',
    color: '#888888'
  });
  const add = () => {
    if (!draft.name) return;
    const id = draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setState(s => ({
      ...s,
      topics: [...s.topics, {
        id,
        ...draft
      }]
    }));
    setDraft({
      name: '',
      color: '#888888'
    });
  };
  const remove = id => setState(s => ({
    ...s,
    topics: s.topics.filter(t => t.id !== id)
  }));
  const update = (id, p) => setState(s => ({
    ...s,
    topics: s.topics.map(t => t.id === id ? {
      ...t,
      ...p
    } : t)
  }));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("ul", {
    className: "admin__topics"
  }, state.topics.map(t => /*#__PURE__*/React.createElement("li", {
    key: t.id
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: t.color,
    onChange: e => update(t.id, {
      color: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    value: t.name,
    onChange: e => update(t.id, {
      name: e.target.value
    })
  }), /*#__PURE__*/React.createElement("button", {
    className: "admin__streamdel",
    onClick: () => remove(t.id)
  }, "\xD7")))), /*#__PURE__*/React.createElement("div", {
    className: "admin__addrow"
  }, /*#__PURE__*/React.createElement("input", {
    type: "color",
    value: draft.color,
    onChange: e => setDraft({
      ...draft,
      color: e.target.value
    })
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "New topic name",
    value: draft.name,
    onChange: e => setDraft({
      ...draft,
      name: e.target.value
    })
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: add
  }, "+ Add topic")));
}
function ApprovalsPanel({
  state,
  setState
}) {
  const pending = state.pendingLessons || [];
  const [editing, setEditing] = React.useState(null);
  const approve = lesson => {
    const archived = {
      ...lesson,
      id: lesson.id.replace('pending-', 'w')
    };
    setState(s => ({
      ...s,
      lessons: [archived, ...s.lessons],
      pendingLessons: s.pendingLessons.filter(p => p.id !== lesson.id)
    }));
    if (editing?.id === lesson.id) setEditing(null);
  };
  const reject = id => {
    if (!confirm('Remove this session without archiving?')) return;
    setState(s => ({
      ...s,
      pendingLessons: s.pendingLessons.filter(p => p.id !== id)
    }));
    if (editing?.id === id) setEditing(null);
  };
  if (pending.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "admin__empty"
    }, "No sessions pending review. Guest lecturers will appear here after they submit.");
  }
  if (editing) {
    return /*#__PURE__*/React.createElement("div", {
      className: "admin__col"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hero__label",
      style: {
        marginBottom: 12
      }
    }, "Editing pending session"), /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "Title"), /*#__PURE__*/React.createElement("input", {
      value: editing.title,
      onChange: e => setEditing({
        ...editing,
        title: e.target.value
      })
    })), /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "Topic"), /*#__PURE__*/React.createElement("select", {
      value: editing.topic,
      onChange: e => setEditing({
        ...editing,
        topic: e.target.value
      })
    }, state.topics.map(t => /*#__PURE__*/React.createElement("option", {
      key: t.id,
      value: t.id
    }, t.name)))), /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "The read"), /*#__PURE__*/React.createElement("textarea", {
      rows: 3,
      value: editing.answer,
      onChange: e => setEditing({
        ...editing,
        answer: e.target.value
      })
    })), /*#__PURE__*/React.createElement("label", {
      className: "admin__field"
    }, /*#__PURE__*/React.createElement("span", null, "Teaching points (one per line)"), /*#__PURE__*/React.createElement("textarea", {
      rows: 6,
      value: (editing.bullets || []).join('\n'),
      onChange: e => setEditing({
        ...editing,
        bullets: e.target.value.split('\n')
      })
    })), /*#__PURE__*/React.createElement("div", {
      className: "admin__actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost",
      onClick: () => setEditing(null)
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--primary",
      onClick: () => approve(editing)
    }, "Approve & archive \u2192"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--danger",
      onClick: () => reject(editing.id)
    }, "Reject")));
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "admin__streamhead"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "admin__sub2"
  }, "Pending guest sessions (", pending.length, ")")), /*#__PURE__*/React.createElement("ul", {
    className: "admin__sublist"
  }, pending.map(lesson => {
    const topic = state.topics.find(t => t.id === lesson.topic);
    return /*#__PURE__*/React.createElement("li", {
      key: lesson.id,
      className: "admin__subitem"
    }, /*#__PURE__*/React.createElement("div", {
      className: "admin__subthumb"
    }, /*#__PURE__*/React.createElement(LessonMedia, {
      lesson: lesson,
      height: 80,
      grid: false,
      color: "var(--accent)"
    })), /*#__PURE__*/React.createElement("div", {
      className: "admin__submeta"
    }, /*#__PURE__*/React.createElement("div", {
      className: "admin__subtitle"
    }, lesson.title || /*#__PURE__*/React.createElement("em", {
      style: {
        color: 'var(--fg-faint)'
      }
    }, "Untitled")), /*#__PURE__*/React.createElement("div", {
      className: "admin__subwho",
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "chip__dot",
      style: {
        background: topic?.color
      }
    }), topic?.name), /*#__PURE__*/React.createElement("div", {
      className: "admin__substamp"
    }, lesson.responses?.length || 0, " responses \xB7 submitted ", new Date(lesson.pendingAt).toLocaleString()), lesson.responses?.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "admin__subnotes"
    }, lesson.responses.slice(0, 5).join(' · '), lesson.responses.length > 5 ? ' …' : '')), /*#__PURE__*/React.createElement("div", {
      className: "admin__subactions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost btn--sm",
      onClick: () => setEditing(lesson)
    }, "Edit & review"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--primary btn--sm",
      onClick: () => approve(lesson)
    }, "Approve \u2192"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--danger btn--sm",
      onClick: () => reject(lesson.id)
    }, "Reject")));
  })));
}

// ─── Drafts panel — admin saves lecture drafts to load later ──────────────────

function DraftEditForm({
  draft: initialDraft,
  state,
  onSave,
  onCancel
}) {
  const [d, setD] = React.useState(initialDraft);
  const patch = p => setD(x => ({
    ...x,
    ...p
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label",
    style: {
      marginBottom: 12
    }
  }, initialDraft.savedAt ? 'Edit draft' : 'New draft'), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Title"), /*#__PURE__*/React.createElement("input", {
    value: d.title,
    onChange: e => patch({
      title: e.target.value
    }),
    placeholder: "e.g. Wellens' Syndrome"
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__row2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: d.date,
    onChange: e => patch({
      date: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Topic"), /*#__PURE__*/React.createElement("select", {
    value: d.topic,
    onChange: e => patch({
      topic: e.target.value
    })
  }, state.topics.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name))))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Question"), /*#__PURE__*/React.createElement("input", {
    value: d.question,
    onChange: e => patch({
      question: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "EKG image or PDF"), /*#__PURE__*/React.createElement("div", {
    className: "admin__upload"
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*,application/pdf",
    onChange: async e => {
      const f = e.target.files?.[0];
      if (!f) return;
      const data = await fileToDataURL(f);
      if (f.type === 'application/pdf') patch({
        pdfData: data,
        imageData: null,
        imageUrl: ''
      });else patch({
        imageData: data,
        pdfData: null,
        imageUrl: ''
      });
    }
  }), (d.imageData || d.pdfData || d.imageUrl) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn--ghost btn--sm",
    onClick: () => patch({
      imageData: null,
      pdfData: null,
      imageUrl: ''
    })
  }, "Clear"), /*#__PURE__*/React.createElement("span", {
    className: "admin__uploadhint"
  }, d.pdfData ? 'PDF attached' : d.imageData ? 'Image attached' : d.imageUrl || 'No image'))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "\u2026or image URL"), /*#__PURE__*/React.createElement("input", {
    value: d.imageUrl || '',
    onChange: e => patch({
      imageUrl: e.target.value,
      imageData: null,
      pdfData: null
    }),
    placeholder: "https://\u2026"
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "The read (answer)"), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    value: d.answer,
    onChange: e => patch({
      answer: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Teaching points (one per line)"), /*#__PURE__*/React.createElement("textarea", {
    rows: 5,
    value: (d.bullets || []).join('\n'),
    onChange: e => patch({
      bullets: e.target.value.split('\n')
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost",
    onClick: onCancel
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: () => onSave(d)
  }, "Save draft")));
}
function DraftsPanel({
  state,
  setState
}) {
  const drafts = state.drafts || [];
  const [editing, setEditing] = React.useState(null);
  const [isNew, setIsNew] = React.useState(false);
  const blankDraft = () => ({
    id: 'draft-' + Date.now().toString(36),
    title: '',
    topic: state.topics[0]?.id || '',
    date: '',
    question: 'Interpret this EKG',
    answer: '',
    bullets: [],
    imageData: null,
    pdfData: null,
    imageUrl: '',
    duration: 30,
    savedAt: null
  });
  const saveDraft = d => {
    const updated = {
      ...d,
      savedAt: Date.now()
    };
    setState(s => {
      const exists = s.drafts.find(x => x.id === d.id);
      return {
        ...s,
        drafts: exists ? s.drafts.map(x => x.id === d.id ? updated : x) : [updated, ...s.drafts]
      };
    });
    setEditing(null);
    setIsNew(false);
  };
  const remove = id => {
    if (!confirm('Delete this draft?')) return;
    setState(s => ({
      ...s,
      drafts: s.drafts.filter(x => x.id !== id)
    }));
    if (editing?.id === id) setEditing(null);
  };
  const loadToLive = d => {
    setState(s => ({
      ...s,
      liveLesson: {
        ...s.liveLesson,
        title: d.title,
        topic: d.topic,
        date: d.date,
        question: d.question,
        answer: d.answer,
        bullets: d.bullets || [],
        imageData: d.imageData,
        pdfData: d.pdfData,
        imageUrl: d.imageUrl || '',
        duration: d.duration,
        responses: [],
        revealed: false,
        liveStartedAt: null
      }
    }));
    alert('Draft loaded into "This Week". Open that tab to go live.');
  };
  if (editing || isNew) {
    return /*#__PURE__*/React.createElement(DraftEditForm, {
      draft: editing || blankDraft(),
      state: state,
      onSave: saveDraft,
      onCancel: () => {
        setEditing(null);
        setIsNew(false);
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "admin__streamhead"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "admin__sub2"
  }, "Saved drafts (", drafts.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: () => setIsNew(true)
  }, "+ New draft")), drafts.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "admin__empty"
  }, "No drafts yet. Create one to prepare a lecture in advance, then load it when it's time to go live."), /*#__PURE__*/React.createElement("ul", {
    className: "admin__sched"
  }, drafts.map(d => {
    const topic = state.topics.find(t => t.id === d.topic);
    return /*#__PURE__*/React.createElement("li", {
      key: d.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600
      }
    }, d.title || /*#__PURE__*/React.createElement("em", {
      style: {
        color: 'var(--fg-faint)'
      }
    }, "Untitled draft")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        opacity: 0.6
      }
    }, topic && /*#__PURE__*/React.createElement("span", {
      style: {
        color: topic.color
      }
    }, topic.name), d.date && ` · ${formatDate(d.date)}`, d.savedAt && ` · saved ${new Date(d.savedAt).toLocaleDateString()}`)), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost btn--sm",
      onClick: () => setEditing(d)
    }, "Edit"), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--primary btn--sm",
      onClick: () => loadToLive(d)
    }, "Load to live \u2192"), /*#__PURE__*/React.createElement("button", {
      className: "admin__streamdel",
      onClick: () => remove(d.id)
    }, "\xD7"));
  })));
}

// ─── Invites panel — generate and send invite links to guest lecturers ─────────

function InvitesPanel({
  state,
  setState
}) {
  const invites = state.invites || [];
  const [form, setForm] = React.useState({
    presenterName: '',
    presenterEmail: '',
    topic: state.topics[0]?.id || '',
    date: ''
  });
  const [generated, setGenerated] = React.useState(null);
  const [copied, setCopied] = React.useState('');
  const BASE_URL = `${location.origin}${location.pathname}`;
  const generateInvite = () => {
    if (!form.presenterName || !form.date) return;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const qs = `id=${encodeURIComponent(id)}&topic=${encodeURIComponent(form.topic)}&date=${encodeURIComponent(form.date)}&name=${encodeURIComponent(form.presenterName)}`;
    const url = `${BASE_URL}#draft?${qs}`;
    const invite = {
      ...form,
      id,
      url,
      createdAt: new Date().toISOString()
    };
    setState(s => ({
      ...s,
      invites: [invite, ...(s.invites || [])]
    }));
    setGenerated(invite);
    setForm({
      presenterName: '',
      presenterEmail: '',
      topic: state.topics[0]?.id || '',
      date: ''
    });
  };
  const removeInvite = id => {
    setState(s => ({
      ...s,
      invites: (s.invites || []).filter(x => x.id !== id)
    }));
    if (generated?.id === id) setGenerated(null);
  };
  const copyLink = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };
  const buildMailto = inv => {
    const topicObj = state.topics.find(t => t.id === inv.topic);
    const subject = encodeURIComponent(`Trace of EKG — You're presenting on ${formatDate(inv.date)}`);
    const body = encodeURIComponent(`Hi ${inv.presenterName},

You're invited to present at Trace of EKG on ${formatDate(inv.date)}.
Topic: ${topicObj?.name || inv.topic}

Prepare your lecture using this link:
${inv.url}

You can save your progress and return to this link any time before your presentation date. On the day, click Go Live directly from this page.

Questions? Reply to this email.`);
    return `mailto:${inv.presenterEmail}?subject=${subject}&body=${body}`;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "admin__grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "admin__sub2"
  }, "Create invite"), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Presenter name"), /*#__PURE__*/React.createElement("input", {
    value: form.presenterName,
    onChange: e => setForm({
      ...form,
      presenterName: e.target.value
    }),
    placeholder: "Dr. Smith"
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Presenter email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: form.presenterEmail,
    onChange: e => setForm({
      ...form,
      presenterEmail: e.target.value
    }),
    placeholder: "email@hospital.edu"
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__row2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Presentation date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => setForm({
      ...form,
      date: e.target.value
    })
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Topic"), /*#__PURE__*/React.createElement("select", {
    value: form.topic,
    onChange: e => setForm({
      ...form,
      topic: e.target.value
    })
  }, state.topics.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name))))), /*#__PURE__*/React.createElement("div", {
    className: "admin__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: generateInvite,
    disabled: !form.presenterName || !form.date
  }, "Generate invite link \u2192")), generated && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      padding: '20px 24px',
      border: '1px solid color-mix(in oklch, var(--accent-3) 40%, transparent)',
      background: 'color-mix(in oklch, var(--accent-3) 6%, transparent)',
      borderRadius: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label",
    style: {
      marginBottom: 8
    }
  }, "Invite generated for ", generated.presenterName), /*#__PURE__*/React.createElement("div", {
    className: "admin__field",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("input", {
    readOnly: true,
    value: generated.url,
    onClick: e => e.target.select(),
    style: {
      fontSize: 12,
      fontFamily: 'var(--font-mono)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost",
    onClick: () => copyLink(generated.url, 'generated')
  }, copied === 'generated' ? '✓ Copied' : 'Copy link'), generated.presenterEmail && /*#__PURE__*/React.createElement("a", {
    className: "btn btn--primary",
    href: buildMailto(generated),
    target: "_blank",
    rel: "noopener"
  }, "Open in email \u2192")))), /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "admin__sub2"
  }, "Sent invites (", invites.length, ")"), invites.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "admin__empty"
  }, "No invites yet."), /*#__PURE__*/React.createElement("ul", {
    className: "admin__sched"
  }, invites.map(inv => {
    const topic = state.topics.find(t => t.id === inv.topic);
    const isExpired = inv.date && new Date(inv.date) < new Date(new Date().toDateString());
    return /*#__PURE__*/React.createElement("li", {
      key: inv.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, inv.presenterName, isExpired && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        opacity: 0.45,
        fontWeight: 400
      }
    }, "expired")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        opacity: 0.6
      }
    }, formatDate(inv.date), topic && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: topic.color
      }
    }, topic.name)), inv.presenterEmail && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", inv.presenterEmail))), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost btn--sm",
      onClick: () => copyLink(inv.url, inv.id)
    }, copied === inv.id ? '✓' : 'Copy'), inv.presenterEmail && /*#__PURE__*/React.createElement("a", {
      className: "btn btn--ghost btn--sm",
      href: buildMailto(inv),
      target: "_blank",
      rel: "noopener"
    }, "Email"), /*#__PURE__*/React.createElement("button", {
      className: "admin__streamdel",
      onClick: () => removeInvite(inv.id)
    }, "\xD7"));
  }))));
}
Object.assign(window, {
  AdminPage,
  ApprovalsPanel,
  DraftsPanel,
  InvitesPanel
});
