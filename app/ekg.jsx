// EKG trace component — draws a continuously scrolling or static trace
// using SVG path math. Deterministic (based on lesson id) so each lesson
// has a recognizable waveform, but purely illustrative — not medically
// accurate imagery.

function seedFrom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build one PQRST beat as relative path commands, parameterized by archetype.
// Archetypes correspond loosely to lesson topics.
const ARCHETYPES = {
  ischemia: { pHeight: 3, qDepth: 2, rHeight: 28, sDepth: 6, stElev: 4, tHeight: 14, tWidth: 1.3 },
  blocks: { pHeight: 4, qDepth: 1, rHeight: 22, sDepth: 4, stElev: 0, tHeight: 7, tWidth: 1, prGap: 1.8 },
  arrhythmias: { pHeight: 2, qDepth: 3, rHeight: 30, sDepth: 8, stElev: 1, tHeight: 8, tWidth: 0.9 },
  hypertrophy: { pHeight: 5, qDepth: 1, rHeight: 36, sDepth: 10, stElev: -2, tHeight: 9, tWidth: 1.1 },
  electrolytes: { pHeight: 2, qDepth: 2, rHeight: 24, sDepth: 5, stElev: 0, tHeight: 18, tWidth: 0.6 }, // peaked T
  peds: { pHeight: 3, qDepth: 2, rHeight: 20, sDepth: 4, stElev: 0, tHeight: 8, tWidth: 1, beatRate: 1.4 },
  pacing: { pHeight: 0, qDepth: 0, rHeight: 26, sDepth: 7, stElev: 0, tHeight: 8, tWidth: 1.2, paced: true },
  mimics: { pHeight: 3, qDepth: 2, rHeight: 24, sDepth: 6, stElev: 2, tHeight: 10, tWidth: 1, wideQRS: true },
  default: { pHeight: 3, qDepth: 2, rHeight: 24, sDepth: 5, stElev: 0, tHeight: 9, tWidth: 1 },
};

function buildBeat(arch, rng) {
  const a = { ...ARCHETYPES.default, ...(ARCHETYPES[arch] || {}) };
  const j = (n) => (rng() - 0.5) * n; // jitter
  const pts = [];
  let x = 0;
  pts.push([x, 0]);
  // PR baseline
  x += 6 + j(1); pts.push([x, 0]);
  // P wave (small bump)
  x += 4; pts.push([x, -a.pHeight + j(0.4)]);
  x += 4; pts.push([x, 0]);
  // PR segment
  x += (a.prGap || 1) * 4 + j(0.5); pts.push([x, 0]);
  // Q
  x += 1.5; pts.push([x, a.qDepth + j(0.3)]);
  // R (spike up). Wide QRS for mimics/pacing.
  const qrsW = a.wideQRS || a.paced ? 4 : 2;
  x += qrsW; pts.push([x, -a.rHeight + j(1)]);
  // S
  x += qrsW; pts.push([x, a.sDepth + j(0.5)]);
  x += 1; pts.push([x, 0 - a.stElev + j(0.2)]);
  // ST segment
  x += 4 + j(0.5); pts.push([x, 0 - a.stElev]);
  // T wave (bump). Peaked for electrolytes (narrow).
  const tW = 4 * a.tWidth;
  x += tW; pts.push([x, -a.tHeight + j(0.6)]);
  x += tW; pts.push([x, 0]);
  // TP baseline
  x += 10 + j(1); pts.push([x, 0]);
  return pts;
}

// Render EKG as full-width SVG. `animate` = scrolling trace; `static` = show all beats.
function EKGTrace({ lesson, width = 1200, height = 220, color = '#e8e5df', grid = true, animate = false, speed = 1, bg = 'transparent', style = {}, highlight = null }) {
  const arch = lesson?.topic || 'default';
  const rng = mulberry32(seedFrom(lesson?.id || 'default'));
  const beats = 8;
  const beatPoints = [];
  for (let i = 0; i < beats; i++) beatPoints.push(buildBeat(arch, rng));

  const beatWidth = beatPoints[0][beatPoints[0].length - 1][0];
  const pad = 20;
  const vbW = beatWidth * beats + pad * 2;
  const vbH = 80;
  const yCenter = vbH * 0.55;

  let d = '';
  let cursor = pad;
  for (let i = 0; i < beats; i++) {
    const pts = beatPoints[i];
    for (let k = 0; k < pts.length; k++) {
      const [px, py] = pts[k];
      const X = cursor + px;
      const Y = yCenter + py * 0.6;
      d += (k === 0 && i === 0 ? 'M' : 'L') + X.toFixed(2) + ' ' + Y.toFixed(2) + ' ';
    }
    cursor += beatWidth;
  }

  const [offset, setOffset] = React.useState(0);
  React.useEffect(() => {
    if (!animate) return;
    let raf;
    let last = performance.now();
    const tick = (t) => {
      const dt = (t - last) / 1000; last = t;
      setOffset((o) => (o + dt * 40 * speed) % beatWidth);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, speed, beatWidth]);

  const gridId = `ekg-grid-${arch}`;
  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} width={width} height={height} preserveAspectRatio="none"
      style={{ display: 'block', background: bg, ...style }}>
      {grid && (
        <>
          <defs>
            <pattern id={gridId + '-sm'} width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M2 0H0V2" fill="none" stroke="rgba(200,53,77,0.12)" strokeWidth="0.15" />
            </pattern>
            <pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill={`url(#${gridId}-sm)`} />
              <path d="M10 0H0V10" fill="none" stroke="rgba(200,53,77,0.32)" strokeWidth="0.25" />
            </pattern>
          </defs>
          <rect width={vbW} height={vbH} fill={`url(#${gridId})`} />
        </>
      )}
      {highlight && (
        <rect x={highlight.x} y={highlight.y} width={highlight.w} height={highlight.h}
          fill="rgba(255,235,120,0.18)" stroke="rgba(255,210,60,0.6)" strokeWidth="0.3" rx="1" />
      )}
      <g transform={animate ? `translate(${-offset},0)` : ''}>
        <path d={d} fill="none" stroke={color} strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 1.5px ${color})` }} />
      </g>
    </svg>
  );
}

Object.assign(window, { EKGTrace });
