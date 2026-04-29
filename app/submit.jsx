// Submit page — users upload an EKG tracing with their name + email.
// Stored on state.submissions; admin can review and promote to a lesson.

function SubmitPage({ state, setState }) {
  const [form, setForm] = React.useState({
    name: '', email: '', title: '', topic: '', notes: '',
    imageData: null, pdfData: null, fileName: '',
    consent: false,
  });
  const [status, setStatus] = React.useState('idle'); // idle | sending | sent | error
  const [err, setErr] = React.useState('');
  const fileRef = React.useRef(null);

  const patch = (p) => setForm((f) => ({ ...f, ...p }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErr('File too large (8MB max).'); return;
    }
    setErr('');
    const data = await fileToDataURL(file);
    if (file.type === 'application/pdf') {
      patch({ pdfData: data, imageData: null, fileName: file.name });
    } else if (file.type.startsWith('image/')) {
      patch({ imageData: data, pdfData: null, fileName: file.name });
    } else {
      setErr('Please upload an image (PNG / JPG) or PDF.');
    }
  };

  const clearFile = () => {
    patch({ imageData: null, pdfData: null, fileName: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const submit = (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) return setErr('Please enter your name.');
    if (!validEmail(form.email)) return setErr('Please enter a valid email.');
    if (!form.imageData && !form.pdfData) return setErr('Please attach an EKG image or PDF.');
    if (!form.consent) return setErr('Please confirm the submission is de-identified.');

    setStatus('sending');
    const entry = {
      id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      submittedAt: new Date().toISOString(),
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
      topic: form.topic,
      notes: form.notes.trim(),
      imageData: form.imageData,
      pdfData: form.pdfData,
      fileName: form.fileName,
      status: 'new', // new | reviewed | used | archived
    };
    setState((s) => ({ ...s, submissions: [entry, ...(s.submissions || [])] }));
    setTimeout(() => setStatus('sent'), 400);
  };

  if (status === 'sent') {
    return (
      <section className="submit">
        <div className="submit__thanks">
          <div className="submit__thanks-mark">◉</div>
          <h1 className="submit__thanks-title">Tracing received.</h1>
          <p className="submit__thanks-sub">
            Thank you, {form.name.split(' ')[0]}. We'll review it and reach out at <em>{form.email}</em> if we feature it.
          </p>
          <div className="submit__thanks-actions">
            <button className="btn btn--primary" onClick={() => {
              setForm({ name: '', email: '', title: '', topic: '', notes: '', imageData: null, pdfData: null, fileName: '', consent: false });
              setStatus('idle');
            }}>Submit another</button>
            <a className="btn btn--ghost" href="#home">Back to live</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="submit">
      <header className="submit__head">
        <div className="hero__label">Submit an EKG</div>
        <h1 className="submit__title">Have a tracing worth sharing?</h1>
        <p className="submit__lede">
          Interesting, subtle, or straight-up puzzling — send it in. If we feature it in a
          future five-minute lesson, we'll credit you (or keep you anonymous, your call).
        </p>
      </header>

      <form className="submit__form" onSubmit={submit}>
        <div className="submit__grid">
          <label className="submit__field">
            <span className="submit__lab">Your name</span>
            <input value={form.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Dr. Jane Morgan" />
          </label>
          <label className="submit__field">
            <span className="submit__lab">Email</span>
            <input type="email" value={form.email} onChange={(e) => patch({ email: e.target.value })} placeholder="you@hospital.org" />
          </label>
          <label className="submit__field submit__field--full">
            <span className="submit__lab">Suggested title <em className="submit__optional">optional</em></span>
            <input value={form.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Brugada type 1 — middle-aged male with syncope" />
          </label>
          <label className="submit__field">
            <span className="submit__lab">Topic <em className="submit__optional">optional</em></span>
            <select value={form.topic} onChange={(e) => patch({ topic: e.target.value })}>
              <option value="">— pick one —</option>
              {state.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="submit__field submit__field--full">
            <span className="submit__lab">Notes / teaching points <em className="submit__optional">optional</em></span>
            <textarea rows="4" value={form.notes} onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Clinical context, the question you'd ask, your read, anything we should know." />
          </label>

          <div className="submit__field submit__field--full">
            <span className="submit__lab">EKG tracing <em className="submit__optional">PNG, JPG, or PDF · 8MB max</em></span>
            <div className="submit__drop">
              {(form.imageData || form.pdfData) ? (
                <div className="submit__preview">
                  {form.imageData ? (
                    <img src={form.imageData} alt="EKG preview" />
                  ) : (
                    <div className="submit__pdf">📄 {form.fileName}</div>
                  )}
                  <div className="submit__preview-meta">
                    <div className="submit__file-name">{form.fileName}</div>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={clearFile}>Replace</button>
                  </div>
                </div>
              ) : (
                <label className="submit__dropzone">
                  <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} hidden />
                  <div className="submit__dz-mark">＋</div>
                  <div className="submit__dz-title">Drop a file or click to browse</div>
                  <div className="submit__dz-sub">PNG · JPG · PDF · up to 8MB</div>
                </label>
              )}
            </div>
          </div>

          <label className="submit__field submit__field--full submit__consent">
            <input type="checkbox" checked={form.consent} onChange={(e) => patch({ consent: e.target.checked })} />
            <span>
              I confirm this tracing has been <strong>de-identified</strong> — no patient name,
              MRN, DOB, or other PHI is visible — and I have the right to share it.
            </span>
          </label>
        </div>

        {err && <div className="submit__err">{err}</div>}

        <div className="submit__actions">
          <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send tracing →'}
          </button>
          <a className="btn btn--ghost" href="#home">Cancel</a>
        </div>
      </form>
    </section>
  );
}

Object.assign(window, { SubmitPage });
