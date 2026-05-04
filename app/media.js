// LessonMedia — renders uploaded EKG image/PDF if present, else falls
// back to the deterministic placeholder trace.
// Accepts uploaded data URLs during local demo mode and remote Firebase
// Storage URLs when the site is connected.

function LessonMedia({
  lesson,
  height = 240,
  color = 'var(--accent)',
  grid = true,
  animate = false,
  bg = 'var(--card)',
  fit = 'contain'
}) {
  const src = lesson.imageData || lesson.imageUrl;
  const pdf = lesson.pdfData || lesson.pdfUrl;
  if (pdf) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height,
        background: '#fff',
        borderRadius: 2,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("embed", {
      src: pdf,
      type: "application/pdf",
      width: "100%",
      height: "100%",
      style: {
        display: 'block'
      }
    }));
  }
  if (src) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height,
        background: bg,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: src,
      alt: lesson.title || 'EKG',
      style: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: fit,
        display: 'block'
      }
    }));
  }
  return /*#__PURE__*/React.createElement(EKGTrace, {
    lesson: lesson,
    width: "100%",
    height: height,
    animate: animate,
    grid: grid,
    color: color
  });
}

// File -> data URL helper
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
Object.assign(window, {
  LessonMedia,
  fileToDataURL
});
