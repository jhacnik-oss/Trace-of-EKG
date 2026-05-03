// Archive + admin page.

function Archive({
  state,
  layout = 'by-topic'
}) {
  const allLessons = [state.liveLesson, ...state.lessons].filter(Boolean);
  const [openId, setOpenId] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const filtered = filter === 'all' ? allLessons : allLessons.filter(l => l.topic === filter);
  const open = allLessons.find(l => l.id === openId);
  return /*#__PURE__*/React.createElement("section", {
    id: "archive",
    className: "archive"
  }, /*#__PURE__*/React.createElement("div", {
    className: "archive__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hero__label",
    style: {
      fontFamily: '"Space Grotesk"'
    }
  }, "Archive"), /*#__PURE__*/React.createElement("h2", {
    className: "archive__title"
  }, "The Archive")), /*#__PURE__*/React.createElement("div", {
    className: "archive__filters"
  }, /*#__PURE__*/React.createElement("button", {
    className: `chip ${filter === 'all' ? 'chip--on' : ''}`,
    onClick: () => setFilter('all')
  }, "All \xB7 ", allLessons.length), state.topics.map(t => {
    const count = allLessons.filter(l => l.topic === t.id).length;
    if (!count) return null;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      className: `chip ${filter === t.id ? 'chip--on' : ''}`,
      style: filter === t.id ? {
        '--chip-accent': t.color
      } : {},
      onClick: () => setFilter(t.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "chip__dot",
      style: {
        background: t.color
      }
    }), t.name, " \xB7 ", count);
  }))), layout === 'list' && /*#__PURE__*/React.createElement("ul", {
    className: "archive__list"
  }, filtered.map(l => {
    const topic = state.topics.find(t => t.id === l.topic);
    return /*#__PURE__*/React.createElement("li", {
      key: l.id,
      className: "archive__row",
      onClick: () => setOpenId(l.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "archive__rowtitle"
    }, l.title), /*#__PURE__*/React.createElement("span", {
      className: "archive__topic",
      style: {
        color: topic?.color
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "chip__dot",
      style: {
        background: topic?.color
      }
    }), " ", topic?.name), /*#__PURE__*/React.createElement("span", {
      className: "archive__date"
    }, formatDate(l.date)));
  })), layout === 'grid' && /*#__PURE__*/React.createElement("div", {
    className: "archive__grid"
  }, filtered.map(l => /*#__PURE__*/React.createElement(LessonCard, {
    key: l.id,
    lesson: l,
    topics: state.topics,
    onClick: () => setOpenId(l.id)
  }))), layout === 'by-topic' && /*#__PURE__*/React.createElement("div", {
    className: "archive__topics"
  }, state.topics.map(t => {
    const lessons = filtered.filter(l => l.topic === t.id);
    if (!lessons.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      className: "archive__topicblock"
    }, /*#__PURE__*/React.createElement("div", {
      className: "archive__topichead",
      style: {
        '--topic-color': t.color
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "archive__topicname"
    }, t.name), /*#__PURE__*/React.createElement("span", {
      className: "archive__topiccount"
    }, lessons.length), /*#__PURE__*/React.createElement("span", {
      className: "archive__topicline"
    })), /*#__PURE__*/React.createElement("div", {
      className: "archive__grid"
    }, lessons.map(l => /*#__PURE__*/React.createElement(LessonCard, {
      key: l.id,
      lesson: l,
      topics: state.topics,
      onClick: () => setOpenId(l.id)
    }))));
  })), open && /*#__PURE__*/React.createElement(LessonModal, {
    lesson: open,
    topics: state.topics,
    onClose: () => setOpenId(null)
  }));
}
function LessonCard({
  lesson,
  topics,
  onClick
}) {
  const topic = topics.find(t => t.id === lesson.topic);
  return /*#__PURE__*/React.createElement("button", {
    className: "card",
    onClick: onClick
  }, /*#__PURE__*/React.createElement("div", {
    className: "card__trace"
  }, /*#__PURE__*/React.createElement(LessonMedia, {
    lesson: lesson,
    height: 80,
    grid: false,
    color: "rgba(232,229,223,0.55)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "card__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip__dot",
    style: {
      background: topic?.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "card__topic"
  }, topic?.name)), /*#__PURE__*/React.createElement("div", {
    className: "card__title"
  }, lesson.title), /*#__PURE__*/React.createElement("div", {
    className: "card__date"
  }, formatDate(lesson.date))));
}
function LessonModal({
  lesson,
  topics,
  onClose
}) {
  const topic = topics.find(t => t.id === lesson.topic);
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', k);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal__card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal__close",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "modal__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal__meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "chip__dot",
    style: {
      background: topic?.color
    }
  }), /*#__PURE__*/React.createElement("span", null, topic?.name), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: 0.4
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, formatDate(lesson.date))), /*#__PURE__*/React.createElement("h2", {
    className: "modal__title"
  }, lesson.title)), /*#__PURE__*/React.createElement("div", {
    className: "modal__trace"
  }, /*#__PURE__*/React.createElement(LessonMedia, {
    lesson: lesson,
    height: 260,
    grid: true,
    color: "var(--accent)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "The read"), /*#__PURE__*/React.createElement("p", {
    className: "modal__answer"
  }, lesson.answer)), /*#__PURE__*/React.createElement("div", {
    className: "modal__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Teaching points"), /*#__PURE__*/React.createElement("ol", {
    className: "modal__bullets"
  }, lesson.bullets.map((b, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero__bulletnum"
  }, String(i + 1).padStart(2, '0')), b)))), lesson.responses && lesson.responses.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "modal__section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, lesson.responses.length, " resident reads"), /*#__PURE__*/React.createElement(WordCloud, {
    responses: lesson.responses
  }))))), document.body);
}
function dateOnlyToLocalDate(iso) {
  if (typeof iso !== 'string') return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatDate(iso) {
  try {
    const d = dateOnlyToLocalDate(iso) || new Date(String(iso));
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return iso;
  }
}
Object.assign(window, {
  Archive,
  LessonCard,
  LessonModal,
  dateOnlyToLocalDate,
  todayLocalISO,
  formatDate
});
