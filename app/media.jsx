// LessonMedia — renders uploaded EKG image/PDF if present, else falls
// back to the deterministic placeholder trace.
// Accepts uploaded data URLs during local demo mode and remote Firebase
// Storage URLs when the site is connected.

function LessonMedia({ lesson, height = 240, color = 'var(--accent)', grid = true, animate = false, bg = 'var(--card)', fit = 'contain' }) {
  const src = lesson.imageData || lesson.imageUrl;
  const pdf = lesson.pdfData || lesson.pdfUrl;

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

// File -> data URL helper. Images are compressed by default to stay well under
// Firestore's 1MB document limit. Storage-backed flows can preserve originals.
function fileToDataURL(file, options = {}) {
  const { preserveImageQuality = false } = options;
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf' || preserveImageQuality) {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
      return;
    }
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 900;
        const scale = img.width > MAX ? MAX / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

Object.assign(window, { LessonMedia, fileToDataURL });
