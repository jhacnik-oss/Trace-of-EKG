// Submit page — users upload an EKG tracing with their name + email.
// Stored on state.submissions; admin can review and promote to a lesson.

function SubmitPage({
  state,
  setState
}) {
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    title: '',
    topic: '',
    notes: '',
    imageData: null,
    pdfData: null,
    fileName: '',
    consent: false
  });
  const [status, setStatus] = React.useState('idle'); // idle | sending | sent | error
  const [err, setErr] = React.useState('');
  const fileRef = React.useRef(null);
  const patch = p => setForm(f => ({
    ...f,
    ...p
  }));
  const onFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErr('File too large (8MB max).');
      return;
    }
    setErr('');
    const data = await fileToDataURL(file);
    if (file.type === 'application/pdf') {
      patch({
        pdfData: data,
        imageData: null,
        fileName: file.name
      });
    } else if (file.type.startsWith('image/')) {
      patch({
        imageData: data,
        pdfData: null,
        fileName: file.name
      });
    } else {
      setErr('Please upload an image (PNG / JPG) or PDF.');
    }
  };
  const clearFile = () => {
    patch({
      imageData: null,
      pdfData: null,
      fileName: ''
    });
    if (fileRef.current) fileRef.current.value = '';
  };
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim()) return setErr('Please enter your name.');
    if (!validEmail(form.email)) return setErr('Please enter a valid email.');
    if (!form.imageData && !form.pdfData) return setErr('Please attach an EKG image or PDF.');
    if (!form.consent) return setErr('Please confirm the submission is de-identified.');
    setStatus('sending');
    try {
      let upload = null;
      if (!DEMO_MODE && window.traceFirebase?.uploadDataUrl) {
        upload = await window.traceFirebase.uploadDataUrl(form.imageData || form.pdfData, form.fileName, 'submissions');
      }
      const entry = {
        id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        submittedAt: new Date().toISOString(),
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim(),
        topic: form.topic,
        notes: form.notes.trim(),
        imageData: DEMO_MODE ? form.imageData : null,
        pdfData: DEMO_MODE ? form.pdfData : null,
        imageUrl: upload && form.imageData ? upload.url : '',
        pdfUrl: upload && form.pdfData ? upload.url : '',
        storagePath: upload?.path || '',
        fileName: form.fileName,
        status: 'new' // new | reviewed | used | archived
      };
      setState(s => ({
        ...s,
        submissions: [entry, ...(s.submissions || [])]
      }));
      setTimeout(() => setStatus('sent'), 400);
    } catch (error) {
      console.error(error);
      setErr('Could not send the tracing. Please try again.');
      setStatus('error');
    }
  };
  if (status === 'sent') {
    return /*#__PURE__*/React.createElement("section", {
      className: "submit"
    }, /*#__PURE__*/React.createElement("div", {
      className: "submit__thanks"
    }, /*#__PURE__*/React.createElement("div", {
      className: "submit__thanks-mark"
    }, "\u25C9"), /*#__PURE__*/React.createElement("h1", {
      className: "submit__thanks-title"
    }, DEMO_MODE ? 'Tracing saved locally.' : 'Tracing received.'), /*#__PURE__*/React.createElement("p", {
      className: "submit__thanks-sub"
    }, DEMO_MODE ? /*#__PURE__*/React.createElement(React.Fragment, null, "Thank you, ", form.name.split(' ')[0], ". This prototype saved the tracing in this browser only.") : /*#__PURE__*/React.createElement(React.Fragment, null, "Thank you, ", form.name.split(' ')[0], ". We'll review it and reach out at ", /*#__PURE__*/React.createElement("em", null, form.email), " if we feature it.")), /*#__PURE__*/React.createElement("div", {
      className: "submit__thanks-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn--primary",
      onClick: () => {
        setForm({
          name: '',
          email: '',
          title: '',
          topic: '',
          notes: '',
          imageData: null,
          pdfData: null,
          fileName: '',
          consent: false
        });
        setStatus('idle');
      }
    }, "Submit another"), /*#__PURE__*/React.createElement("a", {
      className: "btn btn--ghost",
      href: "#home"
    }, "Back to live"))));
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "submit"
  }, /*#__PURE__*/React.createElement("header", {
    className: "submit__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero__label"
  }, "Submit an EKG"), /*#__PURE__*/React.createElement("h1", {
    className: "submit__title"
  }, "Have a tracing worth sharing?"), /*#__PURE__*/React.createElement("p", {
    className: "submit__lede"
  }, DEMO_MODE ? 'Interesting, subtle, or straight-up puzzling — try the submission flow. In this static prototype, uploads stay in your browser.' : /*#__PURE__*/React.createElement(React.Fragment, null, "Interesting, subtle, or straight-up puzzling \u2014 send it in. If we feature it in a future five-minute lesson, we'll credit you (or keep you anonymous, your call)."))), /*#__PURE__*/React.createElement("form", {
    className: "submit__form",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("div", {
    className: "submit__grid"
  }, /*#__PURE__*/React.createElement("label", {
    className: "submit__field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "submit__lab"
  }, "Your name"), /*#__PURE__*/React.createElement("input", {
    value: form.name,
    onChange: e => patch({
      name: e.target.value
    }),
    placeholder: "Dr. Michael A Miller"
  })), /*#__PURE__*/React.createElement("label", {
    className: "submit__field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "submit__lab"
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: form.email,
    onChange: e => patch({
      email: e.target.value
    }),
    placeholder: "you@hospital.org"
  })), /*#__PURE__*/React.createElement("label", {
    className: "submit__field submit__field--full"
  }, /*#__PURE__*/React.createElement("span", {
    className: "submit__lab"
  }, "Suggested title ", /*#__PURE__*/React.createElement("em", {
    className: "submit__optional"
  }, "optional")), /*#__PURE__*/React.createElement("input", {
    value: form.title,
    onChange: e => patch({
      title: e.target.value
    }),
    placeholder: "e.g. Brugada type 1 \u2014 middle-aged male with syncope"
  })), /*#__PURE__*/React.createElement("label", {
    className: "submit__field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "submit__lab"
  }, "Topic ", /*#__PURE__*/React.createElement("em", {
    className: "submit__optional"
  }, "optional")), /*#__PURE__*/React.createElement("select", {
    value: form.topic,
    onChange: e => patch({
      topic: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 pick one \u2014"), state.topics.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name)))), /*#__PURE__*/React.createElement("label", {
    className: "submit__field submit__field--full"
  }, /*#__PURE__*/React.createElement("span", {
    className: "submit__lab"
  }, "Notes / teaching points ", /*#__PURE__*/React.createElement("em", {
    className: "submit__optional"
  }, "optional")), /*#__PURE__*/React.createElement("textarea", {
    rows: "4",
    value: form.notes,
    onChange: e => patch({
      notes: e.target.value
    }),
    placeholder: "Clinical context, the question you'd ask, your read, anything we should know."
  })), /*#__PURE__*/React.createElement("div", {
    className: "submit__field submit__field--full"
  }, /*#__PURE__*/React.createElement("span", {
    className: "submit__lab"
  }, "EKG tracing ", /*#__PURE__*/React.createElement("em", {
    className: "submit__optional"
  }, "PNG, JPG, or PDF \xB7 8MB max")), /*#__PURE__*/React.createElement("div", {
    className: "submit__drop"
  }, form.imageData || form.pdfData ? /*#__PURE__*/React.createElement("div", {
    className: "submit__preview"
  }, form.imageData ? /*#__PURE__*/React.createElement("img", {
    src: form.imageData,
    alt: "EKG preview"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "submit__pdf"
  }, "\uD83D\uDCC4 ", form.fileName), /*#__PURE__*/React.createElement("div", {
    className: "submit__preview-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "submit__file-name"
  }, form.fileName), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn--ghost btn--sm",
    onClick: clearFile
  }, "Replace"))) : /*#__PURE__*/React.createElement("label", {
    className: "submit__dropzone"
  }, /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*,application/pdf",
    onChange: onFile,
    hidden: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "submit__dz-mark"
  }, "\uFF0B"), /*#__PURE__*/React.createElement("div", {
    className: "submit__dz-title"
  }, "Drop a file or click to browse"), /*#__PURE__*/React.createElement("div", {
    className: "submit__dz-sub"
  }, "PNG \xB7 JPG \xB7 PDF \xB7 up to 8MB")))), /*#__PURE__*/React.createElement("label", {
    className: "submit__field submit__field--full submit__consent"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: form.consent,
    onChange: e => patch({
      consent: e.target.checked
    })
  }), /*#__PURE__*/React.createElement("span", null, "I confirm this tracing has been ", /*#__PURE__*/React.createElement("strong", null, "de-identified"), " \u2014 no patient name, MRN, DOB, or other PHI is visible \u2014 and I have the right to share it."))), err && /*#__PURE__*/React.createElement("div", {
    className: "submit__err"
  }, err), /*#__PURE__*/React.createElement("div", {
    className: "submit__actions"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn btn--primary",
    disabled: status === 'sending'
  }, status === 'sending' ? 'Saving…' : DEMO_MODE ? 'Save locally →' : 'Send tracing →'), /*#__PURE__*/React.createElement("a", {
    className: "btn btn--ghost",
    href: "#home"
  }, "Cancel"))));
}
Object.assign(window, {
  SubmitPage
});
