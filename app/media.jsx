// LessonMedia — renders uploaded EKG image/PDF if present, else falls
// back to the deterministic placeholder trace.
// Accepts any of: lesson.imageUrl (remote), lesson.imageData (data URL
// from file upload), lesson.pdfData (data URL for PDF — rendered in an
// <embed>).

function LessonMedia({ lesson, height = 240, color = 'var(--accent)', grid = true, animate = false, bg = 'var(--card)', fit = 'contain' }) {
  const src = lesson.imageData || lesson.imageUrl;
  const pdf = lesson.pdfData;

  if (pdf) {
    return (
      <div style={{ width: '100%', height, background: '#fff', borderRadius: 2, overflow: 'hidden' }}>
        <embed src={pdf} type="application/pdf" width="100%" height="100%" style={{ display: 'block' }} />
      </div>
    );
  }
  if (src) {
    return (
      <div style={{
        width: '100%', height,
        background: bg,
        borderRadius: 2, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src={src} alt={lesson.title || 'EKG'} style={{
          maxWidth: '100%', maxHeight: '100%',
          objectFit: fit, display: 'block',
        }} />
      </div>
    );
  }
  return <EKGTrace lesson={lesson} width="100%" height={height} animate={animate} grid={grid} color={color} />;
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

Object.assign(window, { LessonMedia, fileToDataURL });
