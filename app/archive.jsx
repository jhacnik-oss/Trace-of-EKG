// Archive + admin page.

function Archive({ state, layout = 'by-topic' }) {
  const allLessons = [state.liveLesson, ...state.lessons].filter(Boolean);
  const [openId, setOpenId] = React.useState(null);
  const [filter, setFilter] = React.useState('all');

  const filtered = filter === 'all' ? allLessons : allLessons.filter((l) => l.topic === filter);

  const open = allLessons.find((l) => l.id === openId);

  return (
    <section id="archive" className="archive">
      <div className="archive__head">
        <div>
          <div className="hero__label" style={{ fontFamily: '"Space Grotesk"' }}>Archive</div>
          <h2 className="archive__title">The Archive</h2>
        </div>
        <div className="archive__filters">
          <button className={`chip ${filter === 'all' ? 'chip--on' : ''}`} onClick={() => setFilter('all')}>All · {allLessons.length}</button>
          {state.topics.map((t) => {
            const count = allLessons.filter((l) => l.topic === t.id).length;
            if (!count) return null;
            return (
              <button key={t.id} className={`chip ${filter === t.id ? 'chip--on' : ''}`}
                style={filter === t.id ? { '--chip-accent': t.color } : {}}
                onClick={() => setFilter(t.id)}>
                <span className="chip__dot" style={{ background: t.color }} />
                {t.name} · {count}
              </button>
            );
          })}
        </div>
      </div>

      {layout === 'list' && (
        <ul className="archive__list">
          {filtered.map((l) => {
            const topic = state.topics.find((t) => t.id === l.topic);
            return (
              <li key={l.id} className="archive__row" onClick={() => setOpenId(l.id)}>
                <span className="archive__rowtitle">{l.title}</span>
                <span className="archive__topic" style={{ color: topic?.color }}>
                  <span className="chip__dot" style={{ background: topic?.color }} /> {topic?.name}
                </span>
                <span className="archive__date">{formatDate(l.date)}</span>
              </li>
            );
          })}
        </ul>
      )}

      {layout === 'grid' && (
        <div className="archive__grid">
          {filtered.map((l) => <LessonCard key={l.id} lesson={l} topics={state.topics} onClick={() => setOpenId(l.id)} />)}
        </div>
      )}

      {layout === 'by-topic' && (
        <div className="archive__topics">
          {state.topics.map((t) => {
            const lessons = filtered.filter((l) => l.topic === t.id);
            if (!lessons.length) return null;
            return (
              <div key={t.id} className="archive__topicblock">
                <div className="archive__topichead" style={{ '--topic-color': t.color }}>
                  <span className="archive__topicname">{t.name}</span>
                  <span className="archive__topiccount">{lessons.length}</span>
                  <span className="archive__topicline" />
                </div>
                <div className="archive__grid">
                  {lessons.map((l) => <LessonCard key={l.id} lesson={l} topics={state.topics} onClick={() => setOpenId(l.id)} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && <LessonModal lesson={open} topics={state.topics} onClose={() => setOpenId(null)} />}
    </section>
  );
}

function LessonCard({ lesson, topics, onClick }) {
  const topic = topics.find((t) => t.id === lesson.topic);
  return (
    <button className="card" onClick={onClick}>
      <div className="card__trace">
        <LessonMedia lesson={lesson} height={80} grid={false} color="rgba(232,229,223,0.55)" />
      </div>
      <div className="card__body">
        <div className="card__meta">
          <span className="chip__dot" style={{ background: topic?.color }} />
          <span className="card__topic">{topic?.name}</span>
        </div>
        <div className="card__title">{lesson.title}</div>
        <div className="card__date">{formatDate(lesson.date)}</div>
      </div>
    </button>
  );
}

function LessonModal({ lesson, topics, onClose }) {
  const topic = topics.find((t) => t.id === lesson.topic);
  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="modal" onClick={onClose}>
      <div className="modal__card" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>×</button>
        <div className="modal__head">
          <div className="modal__meta">
            <span className="chip__dot" style={{ background: topic?.color }} />
            <span>{topic?.name}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>{formatDate(lesson.date)}</span>
          </div>
          <h2 className="modal__title">{lesson.title}</h2>
        </div>
        <div className="modal__trace">
          <LessonMedia lesson={lesson} height={260} grid={true} color="var(--accent)" />
        </div>
        <div className="modal__body">
          <div className="modal__section">
            <div className="hero__label">The read</div>
            <p className="modal__answer">{lesson.answer}</p>
          </div>
          <div className="modal__section">
            <div className="hero__label">Teaching points</div>
            <ol className="modal__bullets">
              {lesson.bullets.map((b, i) => (
                <li key={i}><span className="hero__bulletnum">{String(i + 1).padStart(2, '0')}</span>{b}</li>
              ))}
            </ol>
          </div>
          {lesson.responses && lesson.responses.length > 0 && (
            <div className="modal__section">
              <div className="hero__label">{lesson.responses.length} resident reads</div>
              <WordCloud responses={lesson.responses} />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return iso; }
}

Object.assign(window, { Archive, LessonCard, LessonModal, dateOnlyToLocalDate, todayLocalISO, formatDate });
