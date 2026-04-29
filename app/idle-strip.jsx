// STElevationStrip — a 2D rhythm strip animation for the idle landing.
// Shows NORMAL SINUS RHYTHM: P → narrow QRS → isoelectric ST → upright T,
// scrolling continuously on classic ECG paper.

(function () {
  const VB_W = 1400;     // viewBox width
  const VB_H = 200;      // viewBox height
  const BASELINE = 120;  // y-coordinate of the isoelectric line
  const MM = 4;          // 1 small box = 4 svg units

  // Build one PQRST beat for NORMAL SINUS RHYTHM:
  // - small upright P (~2mm)
  // - normal PR interval
  // - narrow QRS, R ~12mm
  // - isoelectric ST segment (no elevation)
  // - upright T wave ~3-4mm (smaller than R, asymmetric)
  // - return to baseline
  function beat(jitter = 0) {
    const j = (n) => (Math.random() - 0.5) * n * jitter;
    return [
      // TP segment
      ['L', 9 * MM + j(1), 0],
      // P wave
      ['Q', 1 * MM, -2 * MM, 2.5 * MM, 0],
      // PR segment
      ['L', 1.5 * MM, 0],
      // Q wave (small)
      ['L', 0.4 * MM, 1 * MM],
      // R wave
      ['L', 0.5 * MM, -13 * MM + j(0.4)],
      // S wave
      ['L', 0.6 * MM, 14 * MM + j(0.3)],
      // J-point — back to baseline (NO elevation)
      ['L', 0.4 * MM, -1 * MM],
      // ST segment — flat, isoelectric
      ['L', 2 * MM, 0],
      // T wave — upright, ~3.5mm, asymmetric
      ['Q', 1.5 * MM, -3.5 * MM, 4 * MM, -3 * MM + j(0.2)],
      ['Q', 2 * MM, 1 * MM, 3 * MM, 3 * MM],
      // Return to baseline
      ['L', 1.5 * MM, 0],
    ];
  }

  // Generate a long path of N beats, return SVG path "d" + total width.
  function buildBeatPath(n) {
    let d = `M0 ${BASELINE} `;
    let x = 0, y = BASELINE;
    for (let i = 0; i < n; i++) {
      const cmds = beat(0.6);
      for (const c of cmds) {
        if (c[0] === 'L') {
          x += c[1]; y += c[2];
          d += `L${x.toFixed(1)} ${y.toFixed(1)} `;
        } else if (c[0] === 'Q') {
          const cx = x + c[1], cy = y + c[2];
          x += c[3]; y += c[4];
          d += `Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} `;
        }
      }
      // Snap baseline to avoid drift
      d += `L${x.toFixed(1)} ${BASELINE} `;
      y = BASELINE;
    }
    return { d, width: x };
  }

  function STElevationStrip({ height = 280, speed = 38 }) {
    // Build one long path; we render it twice end-to-end and translate to scroll.
    const { d, width } = React.useMemo(() => buildBeatPath(8), []);
    const [offset, setOffset] = React.useState(0);
    const reduced = React.useRef(
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    React.useEffect(() => {
      if (reduced.current) return;
      let raf, last = performance.now();
      const tick = (t) => {
        const dt = (t - last) / 1000; last = t;
        setOffset((o) => (o + dt * speed) % width);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, [width, speed]);

    // Compute beat anchor positions in the path so we can place ST-elev callouts.
    // Each beat occupies "beatW" units; the J-point sits at a known offset.
    const beatW = width / 8;
    // Approximate offset within a beat where J-point lives:
    // TP(8) + P-bezier midpoint (~2.5/2) + PR(1.5) + Q(0.4) + R(0.5) + S(0.6) ≈ 11.6 mm * MM
    const jOffsetInBeat = 11.6 * MM;

    const stripWidth = width * 2; // tiled

    return (
      <div className="stemi" aria-label="Animated rhythm strip showing ST-segment elevation">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height={height}
          preserveAspectRatio="none"
          className="stemi__svg"
        >
          <defs>
            {/* ECG paper: warm cream with red 1mm/5mm grid */}
            <pattern id="stemi-grid-sm" width={MM} height={MM} patternUnits="userSpaceOnUse">
              <rect width={MM} height={MM} fill="transparent" />
              <path d={`M${MM} 0H0V${MM}`} fill="none" stroke="rgba(200,53,77,0.18)" strokeWidth="0.4" />
            </pattern>
            <pattern id="stemi-grid-lg" width={MM * 5} height={MM * 5} patternUnits="userSpaceOnUse">
              <rect width={MM * 5} height={MM * 5} fill="url(#stemi-grid-sm)" />
              <path d={`M${MM * 5} 0H0V${MM * 5}`} fill="none" stroke="rgba(200,53,77,0.42)" strokeWidth="0.7" />
            </pattern>
            <linearGradient id="stemi-fade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="var(--bg)" stopOpacity="1" />
              <stop offset="0.06" stopColor="var(--bg)" stopOpacity="0" />
              <stop offset="0.94" stopColor="var(--bg)" stopOpacity="0" />
              <stop offset="1" stopColor="var(--bg)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* paper */}
          <rect width={VB_W} height={VB_H} fill="url(#stemi-grid-lg)" />

          {/* baseline reference (very faint) */}
          <line x1="0" x2={VB_W} y1={BASELINE} y2={BASELINE}
            stroke="rgba(120,30,50,0.18)" strokeWidth="0.4" strokeDasharray="2 3" />

          {/* The trace, tiled */}
          <g transform={`translate(${-offset},0)`}>
            <path d={d} fill="none" stroke="#1a1310" strokeWidth="1.6"
              strokeLinejoin="round" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 0.6px #1a1310)' }} />
            <path d={d} transform={`translate(${width},0)`}
              fill="none" stroke="#1a1310" strokeWidth="1.6"
              strokeLinejoin="round" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 0.6px #1a1310)' }} />
          </g>

          {/* edge fades */}
          <rect width={VB_W} height={VB_H} fill="url(#stemi-fade)" pointerEvents="none" />
        </svg>
      </div>
    );
  }

  Object.assign(window, { STElevationStrip });
})();
