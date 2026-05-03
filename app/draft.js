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
  } catch {
    return null;
  }
}
function saveGuestDraft(id, data) {
  try {
    const all = JSON.parse(localStorage.getItem(GUEST_DRAFTS_KEY) || '{}');
    all[id] = {
      ...data,
      savedAt: Date.now()
    };
    localStorage.setItem(GUEST_DRAFTS_KEY, JSON.stringify(all));
  } catch {}
}
function DraftPage({
  state,
  setState,
  params
}) {
  const {
    id: inviteId,
    topic: inviteTopic,
    date: inviteDate,
    name: inviteName
  } = params;
  if (!inviteId) {
    return /*#__PURE__*/React.createElement("section", {
      className: "admin",
      style: {
        textAlign: 'center',
        paddingTop: 100
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 48,
        marginBottom: 16
      }
    }, "\u26A0"), /*#__PURE__*/React.createElement("h2", {
      className: "admin__title"
    }, "Invalid invite link"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--fg-dim)'
      }
    }, "This link is missing required parameters. Check your email for the correct link."));
  }
  const isExpired = inviteDate && inviteDate < todayLocalISO();
  if (isExpired) {
    return /*#__PURE__*/React.createElement("section", {
      className: "admin",
      style: {
        textAlign: 'center',
        paddingTop: 100
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 48,
        marginBottom: 16
      }
    }, "\u25F7"), /*#__PURE__*/React.createElement("h2", {
      className: "admin__title"
    }, "Presentation date passed"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--fg-dim)'
      }
    }, "This invite was for ", formatDate(inviteDate), ". The link is no longer active."));
  }
  const live = state.liveLesson;
  const {
    remaining,
    openEnded
  } = useCountdown(live.liveStartedAt, live.duration ?? LIVE_DURATION_S);
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
      duration: 30
    };
  });
  const patch = p => {
    setDraft(d => ({
      ...d,
      ...p
    }));
    setSaved(false);
  };

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
    setState(s => ({
      ...s,
      liveLesson: {
        ...s.liveLesson,
        ...draft,
        id: inviteId,
        liveStartedAt: Date.now(),
        revealed: false,
        responses: []
      }
    }));
  };
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
  const submitForReview = () => {
    const entry = {
      ...state.liveLesson,
      presenterName: draft.presenterName,
      id: 'pending-' + Date.now().toString(36),
      pendingAt: new Date().toISOString()
    };
    setState(s => ({
      ...s,
      pendingLessons: [entry, ...(s.pendingLessons || [])],
      liveLesson: {
        ...s.liveLesson,
        liveStartedAt: null,
        revealed: false,
        responses: []
      }
    }));
    setView('submitted');
  };
  const topicObj = state.topics.find(t => t.id === (inviteTopic || draft.topic));
  const duration = draft.duration ?? LIVE_DURATION_S;
  const savedAt = loadGuestDraft(inviteId)?.savedAt;
  if (view === 'submitted') {
    return /*#__PURE__*/React.createElement("section", {
      className: "admin",
      style: {
        textAlign: 'center',
        paddingTop: 100
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 56,
        marginBottom: 20
      }
    }, "\u2713"), /*#__PURE__*/React.createElement("h2", {
      className: "admin__title",
      style: {
        marginBottom: 12
      }
    }, "Session submitted."), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--fg-dim)',
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 20
      }
    }, "In the admin's review queue. It will appear in the archive once approved."));
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "admin"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Presenter draft"), /*#__PURE__*/React.createElement("h2", {
    className: "admin__title"
  }, draft.presenterName || 'Your lecture')), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, topicObj && /*#__PURE__*/React.createElement("div", {
    className: "hero__label",
    style: {
      color: topicObj.color
    }
  }, topicObj.name), inviteDate && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--fg-dim)',
      marginTop: 4
    }
  }, "Presenting ", formatDate(inviteDate)))), /*#__PURE__*/React.createElement("div", {
    className: "admin__status",
    style: {
      marginBottom: 24
    }
  }, isLive ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--live"
  }), " Live \xB7 ", openEnded ? 'Open' : `${Math.ceil(remaining)}s`, " \xB7 ", live.responses.length, " responses") : live.revealed ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--done"
  }), " Revealed \xB7 ", live.responses.length, " responses") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--idle"
  }), " Draft", savedAt ? ` · saved ${new Date(savedAt).toLocaleTimeString()}` : ' · unsaved')), /*#__PURE__*/React.createElement("div", {
    className: "admin__grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Your name"), /*#__PURE__*/React.createElement("input", {
    value: draft.presenterName,
    onChange: e => patch({
      presenterName: e.target.value
    }),
    placeholder: "Dr. Smith"
  })), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Lecture title"), /*#__PURE__*/React.createElement("input", {
    value: draft.title,
    onChange: e => patch({
      title: e.target.value
    }),
    placeholder: "e.g. Wellens' Syndrome"
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Topic"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, topicObj && /*#__PURE__*/React.createElement("span", {
    className: "chip__dot",
    style: {
      background: topicObj.color
    }
  }), /*#__PURE__*/React.createElement("span", null, topicObj?.name || inviteTopic))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "Question to display"), /*#__PURE__*/React.createElement("input", {
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
  }, "Open"))), /*#__PURE__*/React.createElement("label", {
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
  }, draft.pdfData ? 'PDF attached' : draft.imageData ? 'Image attached' : draft.imageUrl || 'No image yet — falls back to placeholder'))), /*#__PURE__*/React.createElement("label", {
    className: "admin__field"
  }, /*#__PURE__*/React.createElement("span", null, "\u2026or image URL"), /*#__PURE__*/React.createElement("input", {
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
    value: (draft.bullets || []).join('\n'),
    onChange: e => patch({
      bullets: e.target.value.split('\n')
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "admin__actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn--ghost",
    onClick: save
  }, saved ? '✓ Saved' : 'Save progress'), !isLive && !live.revealed && /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: goLive
  }, "\u25B6 Go live ", duration ? `(${duration}s)` : '(open)'), isLive && /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: reveal
  }, "Reveal now"), (isLive || live.revealed) && /*#__PURE__*/React.createElement("button", {
    className: "btn btn--danger",
    onClick: stop
  }, "Reset")), live.revealed && /*#__PURE__*/React.createElement("div", {
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
  }, "Session complete"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      color: 'var(--fg-dim)',
      fontSize: 15,
      lineHeight: 1.5
    }
  }, "Submit this session for admin review. Once approved it will appear in the archive."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: submitForReview
  }, "Submit for review \u2192"))), /*#__PURE__*/React.createElement("div", {
    className: "admin__col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__preview"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "EKG preview"), /*#__PURE__*/React.createElement("div", {
    className: "admin__previewframe"
  }, /*#__PURE__*/React.createElement(LessonMedia, {
    lesson: draft,
    height: 180,
    grid: true,
    color: "var(--accent)"
  }))), isLive || live.revealed ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__streamhead"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, live.responses.length), " responses")), /*#__PURE__*/React.createElement("ul", {
    className: "admin__stream"
  }, live.responses.length === 0 ? /*#__PURE__*/React.createElement("li", {
    className: "admin__empty"
  }, "No responses yet.") : live.responses.map((r, i) => {
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
    }, name));
  }))) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      color: 'var(--fg-dim)',
      fontSize: 14,
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label",
    style: {
      marginBottom: 10
    }
  }, "How it works"), /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      paddingLeft: 20
    }
  }, /*#__PURE__*/React.createElement("li", null, "Fill in your lecture content and save your progress."), /*#__PURE__*/React.createElement("li", null, "Return to this link any time before ", formatDate(inviteDate), " to keep editing."), /*#__PURE__*/React.createElement("li", null, "On presentation day, click ", /*#__PURE__*/React.createElement("strong", null, "Go live"), "."), /*#__PURE__*/React.createElement("li", null, "Residents submit their reads during the countdown."), /*#__PURE__*/React.createElement("li", null, "Click ", /*#__PURE__*/React.createElement("strong", null, "Reveal now"), " to show the answer and word cloud."), /*#__PURE__*/React.createElement("li", null, "Submit the session for the archive."))))));
}
Object.assign(window, {
  DraftPage
});
