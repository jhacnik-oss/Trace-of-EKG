// Guest lecturer page — no password required.
// Guests can edit this week's content, go live, reveal, reset,
// and view the live response stream (with names).
// After reveal, they submit the session for admin approval before it hits the archive.

function GuestPage({
  state,
  setState
}) {
  const live = state.liveLesson;
  const [draft, setDraft] = React.useState(live);
  const [view, setView] = React.useState('setup'); // 'setup' | 'submitted'

  // Keep draft in sync if admin updates the lesson externally.
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
  const submitForReview = () => {
    const entry = {
      ...state.liveLesson,
      id: 'pending-' + Date.now().toString(36),
      pendingAt: new Date().toISOString()
    };
    setState(s => ({
      ...s,
      pendingLessons: [entry, ...(s.pendingLessons || [])],
      // reset live lesson back to idle so the site is clean for next week
      liveLesson: {
        ...s.liveLesson,
        liveStartedAt: null,
        revealed: false,
        responses: []
      }
    }));
    setView('submitted');
  };
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
        fontSize: 20,
        marginBottom: 32
      }
    }, "The session is in the admin's review queue and will appear in the archive once approved."), /*#__PURE__*/React.createElement("button", {
      className: "btn btn--ghost",
      onClick: () => setView('setup')
    }, "\u2190 Back"));
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "admin"
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Guest Lecturer"), /*#__PURE__*/React.createElement("h2", {
    className: "admin__title"
  }, "This week's session")), /*#__PURE__*/React.createElement("div", {
    className: "admin__status",
    style: {
      alignSelf: 'flex-end'
    }
  }, isLive ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--live"
  }), " Live \xB7 ", openEnded ? 'Open' : `${Math.ceil(remaining)}s`, " \xB7 ", live.responses.length, " responses") : live.revealed ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--done"
  }), " Revealed \xB7 ", live.responses.length, " responses") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot dot--idle"
  }), " Idle"))), /*#__PURE__*/React.createElement("div", {
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
  }, "Open \u2014 no timer"))), /*#__PURE__*/React.createElement("label", {
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
  }, draft.pdfData ? 'PDF attached' : draft.imageData ? 'Image attached' : draft.imageUrl || 'Falls back to placeholder if blank'))), /*#__PURE__*/React.createElement("label", {
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
  }, "Reset to idle")), live.revealed && /*#__PURE__*/React.createElement("div", {
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
  }, "Submit this session to the admin for review. Once approved it will appear in the archive."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn--primary",
    onClick: submitForReview
  }, "Submit for admin review \u2192"))), /*#__PURE__*/React.createElement("div", {
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
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "admin__streamhead"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, live.responses.length), " responses")), /*#__PURE__*/React.createElement("ul", {
    className: "admin__stream"
  }, live.responses.length === 0 ? /*#__PURE__*/React.createElement("li", {
    className: "admin__empty"
  }, "No responses yet. Go live to start collecting.") : live.responses.map((r, i) => {
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
  }))))));
}
Object.assign(window, {
  GuestPage
});
