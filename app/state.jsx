// Shared state + storage for Trace of EKG.
// Firebase mode syncs across devices. Demo mode persists to localStorage.

const STORAGE_KEY = 'trace-of-ekg-v1';
const FIREBASE_ENABLED = Boolean(window.traceFirebase?.enabled);
const DEMO_MODE = !FIREBASE_ENABLED;
const ADMIN_PASSWORD = 'sinus'; // local demo password, not production auth

const TOPICS = [
  { id: 'ischemia', name: 'Ischemia & Infarction', color: '#c8354d' },
  { id: 'blocks', name: 'Conduction Blocks', color: '#3a5fcd' },
  { id: 'arrhythmias', name: 'Arrhythmias', color: '#d88a2b' },
  { id: 'hypertrophy', name: 'Hypertrophy & Chamber', color: '#5b8f3e' },
  { id: 'electrolytes', name: 'Electrolytes & Toxic', color: '#8b4ab8' },
  { id: 'peds', name: 'Pediatric & Congenital', color: '#2d8f8f' },
  { id: 'pacing', name: 'Pacing & Devices', color: '#6b6b6b' },
  { id: 'mimics', name: 'STEMI Mimics', color: '#b8512a' },
];

// Seed lessons — the archive ships with a handful of past weeks.
const SEED_LESSONS = [
  {
    id: 'w28',
    week: 28,
    date: '2026-04-16',
    title: 'Wellens\u2019 Syndrome',
    topic: 'ischemia',
    question: 'Interpret this EKG',
    answer: 'Wellens\u2019 Type A — biphasic T waves in V2\u2013V3. Critical LAD stenosis. Do not stress test.',
    bullets: [
      'Biphasic or deeply inverted T waves in V2\u2013V3 during a pain-free interval',
      'Implies critical proximal LAD stenosis \u2014 a "widow-maker" in waiting',
      'Troponin often normal or minimally elevated',
      'Stress testing is contraindicated. Cath lab, not treadmill.',
      'Type A: biphasic (25%). Type B: deeply inverted (75%).',
    ],
    responses: [
      'Wellens', 'biphasic T V2-V3', 'LAD lesion', 'Wellens syndrome', 'T wave inversion',
      'Wellens A', 'proximal LAD', 'widow maker', 'Wellens pattern', 'critical LAD',
      'pain free interval', 'NSTEMI', 'biphasic T waves', 'Wellens', 'LAD stenosis',
      'pseudonormalization', 'Wellens type A', 'anterior ischemia', 'LAD', 'T wave',
    ],
  },
  {
    id: 'w27',
    week: 27,
    date: '2026-04-09',
    title: 'De Winter T Waves',
    topic: 'ischemia',
    question: 'Interpret this EKG',
    answer: 'De Winter pattern — upsloping ST depression with tall symmetric T waves in precordials. LAD occlusion equivalent.',
    bullets: [
      'Upsloping ST depression at the J point, >1mm in V1\u2013V6',
      'Tall, symmetric, prominent T waves following the ST depression',
      '~2% of LAD occlusions \u2014 STEMI equivalent, treat as such',
      'No ST elevation required \u2014 classic "non-STEMI STEMI"',
      'Often static throughout the infarction; doesn\u2019t evolve like classic STEMI',
    ],
    responses: [
      'de Winter', 'LAD occlusion', 'De Winter T', 'STEMI equivalent', 'LAD',
      'upsloping ST depression', 'tall T waves', 'hyperacute T', 'De Winter pattern', 'proximal LAD',
      'anterior MI', 'occlusion MI', 'OMI', 'De Winter', 'LAD OMI',
    ],
  },
  {
    id: 'w26',
    week: 26,
    date: '2026-04-02',
    title: 'Posterior STEMI',
    topic: 'ischemia',
    question: 'Interpret this EKG',
    answer: 'Posterior STEMI — horizontal ST depression V1\u2013V3 with tall R waves. Get posterior leads V7\u2013V9.',
    bullets: [
      'Horizontal ST depression in V1\u2013V3 (mirror image of posterior ST elevation)',
      'Tall R waves in V1\u2013V2 (R > S by mid-MI)',
      'Upright T waves in V1\u2013V3',
      'Confirm with posterior leads V7\u2013V9: \u22651mm ST elevation is diagnostic',
      'Often accompanies inferior STEMI \u2014 check II/III/aVF',
    ],
    responses: [
      'posterior STEMI', 'posterior MI', 'V7-V9', 'posterior infarct', 'STEMI',
      'ST depression V1-V3', 'tall R V1', 'posterior wall', 'circumflex', 'RCA',
    ],
  },
  {
    id: 'w25',
    week: 25,
    date: '2026-03-26',
    title: 'Mobitz II',
    topic: 'blocks',
    question: 'Interpret this EKG',
    answer: 'Mobitz Type II \u2014 intermittent non-conducted P waves without PR prolongation. Pacing likely needed.',
    bullets: [
      'Fixed PR interval with sudden non-conducted P waves',
      'Infranodal block (His-Purkinje) \u2014 unstable, can progress to complete heart block',
      'Often associated with bundle branch block',
      'Atropine unlikely to help; prepare for transcutaneous/transvenous pacing',
      'Admission + cardiology consult; permanent pacemaker usually indicated',
    ],
    responses: [
      'Mobitz II', 'second degree AV block', 'Mobitz 2', 'type II block', 'high grade AV block',
      'infranodal', 'needs pacemaker', 'Mobitz', '2nd degree type II', 'AV block',
    ],
  },
  {
    id: 'w24',
    week: 24,
    date: '2026-03-19',
    title: 'Hyperkalemia',
    topic: 'electrolytes',
    question: 'Interpret this EKG',
    answer: 'Hyperkalemia \u2014 peaked T waves, widened QRS. Calcium gluconate now.',
    bullets: [
      'Peaked, narrow-based T waves (earliest sign, K ~5.5\u20136.5)',
      'PR prolongation, P-wave flattening (K ~6.5\u20137.5)',
      'QRS widening, "sine wave" pattern (K >8)',
      'Calcium stabilizes myocyte membrane \u2014 give before shifting agents',
      'Insulin/D50, albuterol shift; dialysis removes',
    ],
    responses: [
      'hyperkalemia', 'peaked T waves', 'high potassium', 'K+', 'sine wave',
      'hyperK', 'peaked T', 'wide QRS', 'hyperkalemia', 'calcium gluconate',
    ],
  },
  {
    id: 'w23',
    week: 23,
    date: '2026-03-12',
    title: 'Brugada Pattern',
    topic: 'arrhythmias',
    question: 'Interpret this EKG',
    answer: 'Brugada Type 1 \u2014 coved ST elevation V1\u2013V2 with T-wave inversion. Risk of sudden death.',
    bullets: [
      'Type 1 ("coved"): \u22652mm ST elevation, downsloping, with inverted T in V1\u2013V2',
      'Type 2/3 ("saddleback"): less specific, often needs provocation',
      'Associated with SCN5A sodium channelopathy',
      'Risk: polymorphic VT/VF \u2192 sudden cardiac death, often during sleep or fever',
      'Avoid sodium channel blockers; ICD for symptomatic or high-risk patients',
    ],
    responses: [
      'Brugada', 'Brugada type 1', 'coved ST V1', 'sodium channelopathy', 'SCN5A',
      'sudden death', 'ICD', 'Brugada pattern', 'channelopathy',
    ],
  },
  {
    id: 'w22',
    week: 22,
    date: '2026-03-05',
    title: 'LBBB + Sgarbossa',
    topic: 'mimics',
    question: 'Interpret this EKG',
    answer: 'LBBB with concordant ST elevation in V5\u2013V6 \u2014 Sgarbossa-positive. Acute MI.',
    bullets: [
      'Concordant ST elevation \u22651mm in leads with positive QRS \u2014 5 points',
      'Concordant ST depression \u22651mm in V1\u2013V3 \u2014 3 points',
      'Discordant ST elevation >5mm \u2014 2 points (modified: ratio >0.25)',
      '\u22653 points = specific for AMI in the setting of LBBB',
      'Smith-modified criteria more sensitive than original',
    ],
    responses: [
      'Sgarbossa', 'LBBB with MI', 'modified Sgarbossa', 'concordant ST', 'LBBB MI',
      'Smith-modified', 'Sgarbossa criteria', 'acute MI LBBB',
    ],
  },
  {
    id: 'w21',
    week: 21,
    date: '2026-02-26',
    title: 'WPW',
    topic: 'arrhythmias',
    question: 'Interpret this EKG',
    answer: 'Wolff-Parkinson-White \u2014 short PR, delta wave, wide QRS. Accessory pathway.',
    bullets: [
      'Short PR (<120ms), delta wave (slurred QRS upstroke), wide QRS',
      'Bundle of Kent \u2014 accessory AV pathway bypassing the AV node',
      'Orthodromic AVRT (narrow) most common; antidromic rare',
      'AFib with WPW is dangerous: avoid AV-nodal blockers (adenosine, Ca-blockers, digoxin, beta-blockers)',
      'Procainamide or cardioversion for AFib+WPW',
    ],
    responses: [
      'WPW', 'Wolff-Parkinson-White', 'delta wave', 'pre-excitation', 'short PR',
      'accessory pathway', 'bundle of Kent', 'WPW pattern', 'AVRT',
    ],
  },
];

const DEFAULT_STATE = {
  currentWeek: 29,
  liveLesson: {
    id: 'w29',
    week: 29,
    date: '2026-04-23',
    title: 'Hyperacute T Waves',
    topic: 'ischemia',
    question: 'Interpret this EKG',
    answer: 'Hyperacute T waves \u2014 tall, broad-based, symmetric T waves. Earliest sign of STEMI. Proximal LAD.',
    bullets: [
      'Broad-based, tall, symmetric T waves \u2014 "fat and friendly" but deadly',
      'Often precede ST elevation by minutes to hours',
      'Easily missed or mistaken for hyperkalemia (narrow, peaked T)',
      'High clinical suspicion + serial EKGs \u2014 repeat in 10 minutes',
      'OMI equivalent \u2014 treat as STEMI even without ST elevation',
    ],
    responses: [],
    revealed: false,
    liveStartedAt: null, // timestamp when admin starts the 30s window
  },
  lessons: SEED_LESSONS,
  schedule: [], // future weeks: [{ date, title, topic, question, answer, bullets }]
  submissions: [], // user-submitted EKGs: { id, submittedAt, name, email, title, notes, topic, imageData, pdfData, status }
  pendingLessons: [], // guest-run sessions awaiting admin approval before archive
  topics: TOPICS,
  drafts: [],   // admin-saved lecture drafts: [{ id, title, topic, date, question, answer, bullets, imageData, pdfData, imageUrl, duration, savedAt }]
  invites: [],  // guest invite links: [{ id, presenterName, presenterEmail, topic, date, url, createdAt }]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // Merge in any new default keys without clobbering saved data.
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (e) {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
}

function normalizeState(value) {
  return { ...structuredClone(DEFAULT_STATE), ...(value || {}) };
}

function cleanForFirestore(value) {
  return JSON.parse(JSON.stringify(value));
}

async function saveRemoteState(updater, optimisticState) {
  if (!FIREBASE_ENABLED) return;
  const ref = window.traceFirebase.mainRef;
  try {
    await window.traceFirebase.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = normalizeState(snap.exists ? snap.data() : DEFAULT_STATE);
      const next = typeof updater === 'function' ? updater(current) : optimisticState;
      tx.set(ref, cleanForFirestore(normalizeState(next)), { merge: false });
    });
  } catch (error) {
    console.error('Trace state sync failed:', error);
  }
}

function useAppState() {
  const [state, setState] = React.useState(loadState);
  const stateRef = React.useRef(state);

  React.useEffect(() => { stateRef.current = state; }, [state]);

  React.useEffect(() => {
    if (FIREBASE_ENABLED) return undefined;
    saveState(state);
  }, [state]);

  React.useEffect(() => {
    if (!FIREBASE_ENABLED) return undefined;
    let first = true;
    let unsubscribe = null;
    window.traceFirebase.authReady.then(() => {
      unsubscribe = window.traceFirebase.mainRef.onSnapshot((snap) => {
        if (!snap.exists) {
          window.traceFirebase.mainRef.set(cleanForFirestore(normalizeState(DEFAULT_STATE)), { merge: false });
          return;
        }
        const next = normalizeState(snap.data());
        stateRef.current = next;
        setState(next);
        first = false;
      }, (error) => {
        console.error('Trace state listener failed:', error);
      });
    }).catch((error) => {
      console.error('Trace auth setup failed:', error);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Listen for changes from other tabs (admin -> live).
  React.useEffect(() => {
    if (FIREBASE_ENABLED) return undefined;
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setState(normalizeState(JSON.parse(e.newValue))); } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setSyncedState = React.useCallback((updater) => {
    setState((prev) => {
      const next = normalizeState(typeof updater === 'function' ? updater(prev) : updater);
      stateRef.current = next;
      if (FIREBASE_ENABLED) saveRemoteState(updater, next);
      return next;
    });
  }, []);

  return [state, setSyncedState];
}

Object.assign(window, {
  STORAGE_KEY, FIREBASE_ENABLED, DEMO_MODE, ADMIN_PASSWORD, TOPICS, SEED_LESSONS, DEFAULT_STATE,
  loadState, saveState, normalizeState, useAppState,
});
