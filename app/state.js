// Shared state + storage for Trace of EKG.
// Firebase mode syncs across devices. Demo mode persists to localStorage.

const STORAGE_KEY = 'trace-of-ekg-v1';
const FIREBASE_ENABLED = Boolean(window.traceFirebase?.enabled);
const DEMO_MODE = !FIREBASE_ENABLED;
const ADMIN_PASSWORD = 'sinus'; // local demo password, not production auth

const TOPICS = [{
  id: 'ischemia',
  name: 'Ischemia & Infarction',
  color: '#c8354d'
}, {
  id: 'blocks',
  name: 'Conduction Blocks',
  color: '#3a5fcd'
}, {
  id: 'arrhythmias',
  name: 'Arrhythmias',
  color: '#d88a2b'
}, {
  id: 'hypertrophy',
  name: 'Hypertrophy & Chamber',
  color: '#5b8f3e'
}, {
  id: 'electrolytes',
  name: 'Electrolytes & Toxic',
  color: '#8b4ab8'
}, {
  id: 'peds',
  name: 'Pediatric & Congenital',
  color: '#2d8f8f'
}, {
  id: 'pacing',
  name: 'Pacing & Devices',
  color: '#6b6b6b'
}, {
  id: 'mimics',
  name: 'STEMI Mimics',
  color: '#b8512a'
}];

// Seed lessons — the archive ships with a handful of past weeks.
const SEED_LESSONS = [{
  id: 'w28',
  week: 28,
  date: '2026-04-16',
  title: 'Wellens\u2019 Syndrome',
  topic: 'ischemia',
  question: 'Interpret this EKG',
  answer: 'Wellens\u2019 Type A — biphasic T waves in V2\u2013V3. Critical LAD stenosis. Do not stress test.',
  bullets: ['Biphasic or deeply inverted T waves in V2\u2013V3 during a pain-free interval', 'Implies critical proximal LAD stenosis \u2014 a "widow-maker" in waiting', 'Troponin often normal or minimally elevated', 'Stress testing is contraindicated. Cath lab, not treadmill.', 'Type A: biphasic (25%). Type B: deeply inverted (75%).'],
  responses: ['Wellens', 'biphasic T V2-V3', 'LAD lesion', 'Wellens syndrome', 'T wave inversion', 'Wellens A', 'proximal LAD', 'widow maker', 'Wellens pattern', 'critical LAD', 'pain free interval', 'NSTEMI', 'biphasic T waves', 'Wellens', 'LAD stenosis', 'pseudonormalization', 'Wellens type A', 'anterior ischemia', 'LAD', 'T wave']
}, {
  id: 'w27',
  week: 27,
  date: '2026-04-09',
  title: 'De Winter T Waves',
  topic: 'ischemia',
  question: 'Interpret this EKG',
  answer: 'De Winter pattern — upsloping ST depression with tall symmetric T waves in precordials. LAD occlusion equivalent.',
  bullets: ['Upsloping ST depression at the J point, >1mm in V1\u2013V6', 'Tall, symmetric, prominent T waves following the ST depression', '~2% of LAD occlusions \u2014 STEMI equivalent, treat as such', 'No ST elevation required \u2014 classic "non-STEMI STEMI"', 'Often static throughout the infarction; doesn\u2019t evolve like classic STEMI'],
  responses: ['de Winter', 'LAD occlusion', 'De Winter T', 'STEMI equivalent', 'LAD', 'upsloping ST depression', 'tall T waves', 'hyperacute T', 'De Winter pattern', 'proximal LAD', 'anterior MI', 'occlusion MI', 'OMI', 'De Winter', 'LAD OMI']
}, {
  id: 'w26',
  week: 26,
  date: '2026-04-02',
  title: 'Posterior STEMI',
  topic: 'ischemia',
  question: 'Interpret this EKG',
  answer: 'Posterior STEMI — horizontal ST depression V1\u2013V3 with tall R waves. Get posterior leads V7\u2013V9.',
  bullets: ['Horizontal ST depression in V1\u2013V3 (mirror image of posterior ST elevation)', 'Tall R waves in V1\u2013V2 (R > S by mid-MI)', 'Upright T waves in V1\u2013V3', 'Confirm with posterior leads V7\u2013V9: \u22651mm ST elevation is diagnostic', 'Often accompanies inferior STEMI \u2014 check II/III/aVF'],
  responses: ['posterior STEMI', 'posterior MI', 'V7-V9', 'posterior infarct', 'STEMI', 'ST depression V1-V3', 'tall R V1', 'posterior wall', 'circumflex', 'RCA']
}, {
  id: 'w25',
  week: 25,
  date: '2026-03-26',
  title: 'Mobitz II',
  topic: 'blocks',
  question: 'Interpret this EKG',
  answer: 'Mobitz Type II \u2014 intermittent non-conducted P waves without PR prolongation. Pacing likely needed.',
  bullets: ['Fixed PR interval with sudden non-conducted P waves', 'Infranodal block (His-Purkinje) \u2014 unstable, can progress to complete heart block', 'Often associated with bundle branch block', 'Atropine unlikely to help; prepare for transcutaneous/transvenous pacing', 'Admission + cardiology consult; permanent pacemaker usually indicated'],
  responses: ['Mobitz II', 'second degree AV block', 'Mobitz 2', 'type II block', 'high grade AV block', 'infranodal', 'needs pacemaker', 'Mobitz', '2nd degree type II', 'AV block']
}, {
  id: 'w24',
  week: 24,
  date: '2026-03-19',
  title: 'Hyperkalemia',
  topic: 'electrolytes',
  question: 'Interpret this EKG',
  answer: 'Hyperkalemia \u2014 peaked T waves, widened QRS. Calcium gluconate now.',
  bullets: ['Peaked, narrow-based T waves (earliest sign, K ~5.5\u20136.5)', 'PR prolongation, P-wave flattening (K ~6.5\u20137.5)', 'QRS widening, "sine wave" pattern (K >8)', 'Calcium stabilizes myocyte membrane \u2014 give before shifting agents', 'Insulin/D50, albuterol shift; dialysis removes'],
  responses: ['hyperkalemia', 'peaked T waves', 'high potassium', 'K+', 'sine wave', 'hyperK', 'peaked T', 'wide QRS', 'hyperkalemia', 'calcium gluconate']
}, {
  id: 'w23',
  week: 23,
  date: '2026-03-12',
  title: 'Brugada Pattern',
  topic: 'arrhythmias',
  question: 'Interpret this EKG',
  answer: 'Brugada Type 1 \u2014 coved ST elevation V1\u2013V2 with T-wave inversion. Risk of sudden death.',
  bullets: ['Type 1 ("coved"): \u22652mm ST elevation, downsloping, with inverted T in V1\u2013V2', 'Type 2/3 ("saddleback"): less specific, often needs provocation', 'Associated with SCN5A sodium channelopathy', 'Risk: polymorphic VT/VF \u2192 sudden cardiac death, often during sleep or fever', 'Avoid sodium channel blockers; ICD for symptomatic or high-risk patients'],
  responses: ['Brugada', 'Brugada type 1', 'coved ST V1', 'sodium channelopathy', 'SCN5A', 'sudden death', 'ICD', 'Brugada pattern', 'channelopathy']
}, {
  id: 'w22',
  week: 22,
  date: '2026-03-05',
  title: 'LBBB + Sgarbossa',
  topic: 'mimics',
  question: 'Interpret this EKG',
  answer: 'LBBB with concordant ST elevation in V5\u2013V6 \u2014 Sgarbossa-positive. Acute MI.',
  bullets: ['Concordant ST elevation \u22651mm in leads with positive QRS \u2014 5 points', 'Concordant ST depression \u22651mm in V1\u2013V3 \u2014 3 points', 'Discordant ST elevation >5mm \u2014 2 points (modified: ratio >0.25)', '\u22653 points = specific for AMI in the setting of LBBB', 'Smith-modified criteria more sensitive than original'],
  responses: ['Sgarbossa', 'LBBB with MI', 'modified Sgarbossa', 'concordant ST', 'LBBB MI', 'Smith-modified', 'Sgarbossa criteria', 'acute MI LBBB']
}, {
  id: 'w21',
  week: 21,
  date: '2026-02-26',
  title: 'WPW',
  topic: 'arrhythmias',
  question: 'Interpret this EKG',
  answer: 'Wolff-Parkinson-White \u2014 short PR, delta wave, wide QRS. Accessory pathway.',
  bullets: ['Short PR (<120ms), delta wave (slurred QRS upstroke), wide QRS', 'Bundle of Kent \u2014 accessory AV pathway bypassing the AV node', 'Orthodromic AVRT (narrow) most common; antidromic rare', 'AFib with WPW is dangerous: avoid AV-nodal blockers (adenosine, Ca-blockers, digoxin, beta-blockers)', 'Procainamide or cardioversion for AFib+WPW'],
  responses: ['WPW', 'Wolff-Parkinson-White', 'delta wave', 'pre-excitation', 'short PR', 'accessory pathway', 'bundle of Kent', 'WPW pattern', 'AVRT']
}];
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
    bullets: ['Broad-based, tall, symmetric T waves \u2014 "fat and friendly" but deadly', 'Often precede ST elevation by minutes to hours', 'Easily missed or mistaken for hyperkalemia (narrow, peaked T)', 'High clinical suspicion + serial EKGs \u2014 repeat in 10 minutes', 'OMI equivalent \u2014 treat as STEMI even without ST elevation'],
    responses: [],
    revealed: false,
    liveStartedAt: null // timestamp when admin starts the 30s window
  },
  lessons: SEED_LESSONS,
  schedule: [],
  // future weeks: [{ date, title, topic, question, answer, bullets }]
  submissions: [],
  // user-submitted EKGs: { id, submittedAt, name, email, title, notes, topic, imageData, pdfData, status }
  pendingLessons: [],
  // guest-run sessions awaiting admin approval before archive
  topics: TOPICS,
  drafts: [],
  // admin-saved lecture drafts: [{ id, title, topic, date, question, answer, bullets, imageData, pdfData, imageUrl, duration, savedAt }]
  invites: [],
  // guest invite links: [{ id, presenterName, presenterEmail, topic, date, url, createdAt }]
  guestDrafts: {} // inviteId -> guest lecturer draft saved from invite link
};
function localTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function createEmptyLiveLesson(state = {}) {
  const topics = state.topics || TOPICS;
  const week = state.currentWeek || DEFAULT_STATE.currentWeek;
  return {
    id: 'live-' + Date.now().toString(36),
    week,
    date: localTodayISO(),
    title: '',
    topic: topics[0]?.id || 'ischemia',
    question: 'Interpret this EKG',
    answer: '',
    bullets: [],
    imageData: null,
    pdfData: null,
    imageUrl: '',
    pdfUrl: '',
    responses: [],
    revealed: false,
    liveStartedAt: null,
    duration: 60
  };
}
function isLessonReadyForArchive(lesson) {
  return Boolean(lesson && String(lesson.title || '').trim());
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // Merge in any new default keys without clobbering saved data.
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed
    };
  } catch (e) {
    return structuredClone(DEFAULT_STATE);
  }
}
function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch (e) {
    // QuotaExceededError — most likely from large base64 images. Warn once.
    if (!saveState._warned) {
      saveState._warned = true;
      alert('Storage full — your changes could not be saved. Try removing the EKG image or clearing old data, then save again.');
    }
    return false;
  }
}
function normalizeState(value) {
  return {
    ...structuredClone(DEFAULT_STATE),
    ...(value || {})
  };
}
function cleanForFirestore(value) {
  return JSON.parse(JSON.stringify(value));
}
function withoutKey(obj, key) {
  const copy = {
    ...(obj || {})
  };
  delete copy[key];
  return copy;
}
function bySavedOrDateDesc(a, b) {
  const av = a.savedAt || a.createdAt || a.submittedAt || a.pendingAt || a.date || '';
  const bv = b.savedAt || b.createdAt || b.submittedAt || b.pendingAt || b.date || '';
  return String(bv).localeCompare(String(av));
}
function docToData(doc) {
  return {
    id: doc.id,
    ...doc.data()
  };
}
function snapshotToArray(snapshot) {
  return snapshot.docs.map(docToData).sort(bySavedOrDateDesc);
}
function snapshotToMap(snapshot) {
  const map = {};
  snapshot.docs.forEach(doc => {
    map[doc.id] = docToData(doc);
  });
  return map;
}
function splitLessonDocs(docs) {
  const lessons = [];
  const pendingLessons = [];
  docs.forEach(lesson => {
    const clean = withoutKey(lesson, 'status');
    if (lesson.status === 'pending') pendingLessons.push(clean);else lessons.push(clean);
  });
  return {
    lessons: lessons.sort(bySavedOrDateDesc),
    pendingLessons: pendingLessons.sort(bySavedOrDateDesc)
  };
}
function responseDocsToArray(snapshot) {
  return snapshot.docs.map(doc => doc.data()).sort((a, b) => (a.order || 0) - (b.order || 0) || (a.updatedAt || 0) - (b.updatedAt || 0)).map(x => x.text).filter(Boolean);
}
function toDocMap(items) {
  const out = new Map();
  (items || []).forEach(item => {
    if (!item?.id) return;
    out.set(item.id, cleanForFirestore(item));
  });
  return out;
}
async function syncCollection(collectionName, nextItems = [], prevItems = []) {
  const db = window.traceFirebase.db;
  const batch = db.batch();
  const ref = db.collection(collectionName);
  const next = toDocMap(nextItems);
  const prev = toDocMap(prevItems);
  next.forEach((value, id) => batch.set(ref.doc(id), value, {
    merge: false
  }));
  prev.forEach((_, id) => {
    if (!next.has(id)) batch.delete(ref.doc(id));
  });
  if (next.size || prev.size) await batch.commit();
}
async function syncLessons(nextLessons = [], nextPending = [], prevLessons = [], prevPending = []) {
  const withStatus = [...nextLessons.map(lesson => ({
    ...lesson,
    status: lesson.status || 'archived'
  })), ...nextPending.map(lesson => ({
    ...lesson,
    status: 'pending'
  }))];
  const previous = [...prevLessons.map(lesson => ({
    ...lesson,
    status: lesson.status || 'archived'
  })), ...prevPending.map(lesson => ({
    ...lesson,
    status: 'pending'
  }))];
  await syncCollection('lessons', withStatus, previous);
}
async function syncGuestDrafts(nextDrafts = {}, prevDrafts = {}) {
  const db = window.traceFirebase.db;
  const batch = db.batch();
  const ref = db.collection('guestDrafts');
  Object.entries(nextDrafts || {}).forEach(([id, draft]) => {
    batch.set(ref.doc(id), cleanForFirestore({
      ...draft,
      id
    }), {
      merge: false
    });
  });
  Object.keys(prevDrafts || {}).forEach(id => {
    if (!(id in (nextDrafts || {}))) batch.delete(ref.doc(id));
  });
  if (Object.keys(nextDrafts || {}).length || Object.keys(prevDrafts || {}).length) await batch.commit();
}
async function syncResponses(nextResponses = [], prevResponses = []) {
  const db = window.traceFirebase.db;
  const batch = db.batch();
  const ref = db.collection('liveSessions').doc('current').collection('responses');
  const isAppendOnly = nextResponses.length >= prevResponses.length && prevResponses.every((text, i) => text === nextResponses[i]);
  if (isAppendOnly) {
    for (let order = prevResponses.length; order < nextResponses.length; order += 1) {
      batch.set(ref.doc(), {
        text: nextResponses[order],
        order,
        updatedAt: Date.now()
      }, {
        merge: false
      });
    }
    if (nextResponses.length > prevResponses.length) await batch.commit();
    return;
  }
  const current = await ref.get();
  current.docs.forEach(doc => batch.delete(doc.ref));
  nextResponses.forEach((text, order) => {
    batch.set(ref.doc(`r-${order}`), {
      text,
      order,
      updatedAt: Date.now()
    }, {
      merge: false
    });
  });
  if (current.size || nextResponses.length) {
    await batch.commit();
  }
}
async function persistStateChanges(prevState, nextState) {
  if (!FIREBASE_ENABLED) return;
  const db = window.traceFirebase.db;
  const prev = normalizeState(prevState);
  const next = normalizeState(nextState);
  try {
    const nextSettings = {
      currentWeek: next.currentWeek,
      topics: next.topics,
      schedule: next.schedule,
      activeSessionId: 'current',
      schemaVersion: 2,
      updatedAt: Date.now()
    };
    const prevSettings = {
      currentWeek: prev.currentWeek,
      topics: prev.topics,
      schedule: prev.schedule,
      activeSessionId: 'current',
      schemaVersion: 2
    };
    if (JSON.stringify(withoutKey(nextSettings, 'updatedAt')) !== JSON.stringify(prevSettings)) {
      await db.collection('settings').doc('main').set(cleanForFirestore(nextSettings), {
        merge: false
      });
    }
    if (JSON.stringify(withoutKey(next.liveLesson, 'responses')) !== JSON.stringify(withoutKey(prev.liveLesson, 'responses'))) {
      await db.collection('liveSessions').doc('current').set(cleanForFirestore(withoutKey(next.liveLesson, 'responses')), {
        merge: false
      });
    }
    if (JSON.stringify(next.liveLesson.responses || []) !== JSON.stringify(prev.liveLesson.responses || [])) {
      await syncResponses(next.liveLesson.responses || [], prev.liveLesson.responses || []);
    }
    if (JSON.stringify(next.lessons) !== JSON.stringify(prev.lessons) || JSON.stringify(next.pendingLessons) !== JSON.stringify(prev.pendingLessons)) {
      await syncLessons(next.lessons, next.pendingLessons, prev.lessons, prev.pendingLessons);
    }
    if (JSON.stringify(next.submissions) !== JSON.stringify(prev.submissions)) {
      await syncCollection('submissions', next.submissions, prev.submissions);
    }
    if (JSON.stringify(next.invites) !== JSON.stringify(prev.invites)) {
      await syncCollection('invites', next.invites, prev.invites);
    }
    if (JSON.stringify(next.drafts) !== JSON.stringify(prev.drafts)) {
      await syncCollection('adminDrafts', next.drafts, prev.drafts);
    }
    if (JSON.stringify(next.guestDrafts) !== JSON.stringify(prev.guestDrafts)) {
      await syncGuestDrafts(next.guestDrafts, prev.guestDrafts);
    }
  } catch (error) {
    console.error('Trace state sync failed:', error);
  }
}
function useAppState() {
  const [state, setState] = React.useState(loadState);
  const stateRef = React.useRef(state);
  const remotePartsRef = React.useRef({});
  const migrationStartedRef = React.useRef(false);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);
  React.useEffect(() => {
    if (FIREBASE_ENABLED) return undefined;
    saveState(state);
  }, [state]);
  React.useEffect(() => {
    if (!FIREBASE_ENABLED) return undefined;
    const unsubs = [];
    let privateUnsubs = [];
    const applyRemoteParts = () => {
      const parts = remotePartsRef.current;
      const split = splitLessonDocs(parts.lessonDocs || []);
      const legacy = parts.settings || {};
      const liveLesson = {
        ...(legacy.liveLesson || DEFAULT_STATE.liveLesson),
        ...(parts.liveLesson || {}),
        responses: parts.responses || legacy.liveLesson?.responses || []
      };
      const next = normalizeState({
        currentWeek: legacy.currentWeek ?? DEFAULT_STATE.currentWeek,
        topics: legacy.topics || DEFAULT_STATE.topics,
        schedule: legacy.schedule || DEFAULT_STATE.schedule,
        liveLesson,
        lessons: split.lessons.length ? split.lessons : legacy.lessons || DEFAULT_STATE.lessons,
        pendingLessons: split.pendingLessons.length ? split.pendingLessons : legacy.pendingLessons || DEFAULT_STATE.pendingLessons,
        guestDrafts: Object.keys(parts.guestDrafts || {}).length ? parts.guestDrafts : legacy.guestDrafts || DEFAULT_STATE.guestDrafts,
        submissions: parts.submissions || legacy.submissions || DEFAULT_STATE.submissions,
        invites: parts.invites || legacy.invites || DEFAULT_STATE.invites,
        drafts: parts.drafts || legacy.drafts || DEFAULT_STATE.drafts
      });
      stateRef.current = next;
      setState(next);
    };
    window.traceFirebase.authReady.then(() => {
      const db = window.traceFirebase.db;
      unsubs.push(db.collection('settings').doc('main').onSnapshot(snap => {
        if (!snap.exists) {
          if (window.traceFirebase.isAllowedAdmin()) {
            db.collection('settings').doc('main').set(cleanForFirestore({
              currentWeek: DEFAULT_STATE.currentWeek,
              topics: DEFAULT_STATE.topics,
              schedule: DEFAULT_STATE.schedule,
              activeSessionId: 'current',
              schemaVersion: 2
            }), {
              merge: true
            });
          }
          return;
        }
        remotePartsRef.current.settings = snap.data();
        if (!migrationStartedRef.current && window.traceFirebase.isAllowedAdmin() && snap.data().schemaVersion !== 2) {
          migrationStartedRef.current = true;
          persistStateChanges(DEFAULT_STATE, normalizeState(snap.data()));
        }
        applyRemoteParts();
      }, error => {
        console.error('Trace settings listener failed:', error);
      }));
      unsubs.push(db.collection('liveSessions').doc('current').onSnapshot(snap => {
        remotePartsRef.current.liveLesson = snap.exists ? {
          id: snap.id,
          ...snap.data()
        } : null;
        applyRemoteParts();
      }, error => console.error('Trace live session listener failed:', error)));
      unsubs.push(db.collection('liveSessions').doc('current').collection('responses').onSnapshot(snap => {
        remotePartsRef.current.responses = responseDocsToArray(snap);
        applyRemoteParts();
      }, error => console.error('Trace responses listener failed:', error)));
      unsubs.push(db.collection('lessons').onSnapshot(snap => {
        remotePartsRef.current.lessonDocs = snapshotToArray(snap);
        applyRemoteParts();
      }, error => console.error('Trace lessons listener failed:', error)));
      unsubs.push(db.collection('guestDrafts').onSnapshot(snap => {
        remotePartsRef.current.guestDrafts = snapshotToMap(snap);
        applyRemoteParts();
      }, error => console.error('Trace guest drafts listener failed:', error)));
      const setupPrivateListeners = user => {
        privateUnsubs.forEach(fn => fn());
        privateUnsubs = [];
        if (!window.traceFirebase.isAllowedAdmin(user)) {
          remotePartsRef.current.submissions = [];
          remotePartsRef.current.invites = [];
          remotePartsRef.current.drafts = [];
          applyRemoteParts();
          return;
        }
        privateUnsubs.push(db.collection('submissions').onSnapshot(snap => {
          remotePartsRef.current.submissions = snapshotToArray(snap);
          applyRemoteParts();
        }, error => console.error('Trace submissions listener failed:', error)));
        privateUnsubs.push(db.collection('invites').onSnapshot(snap => {
          remotePartsRef.current.invites = snapshotToArray(snap);
          applyRemoteParts();
        }, error => console.error('Trace invites listener failed:', error)));
        privateUnsubs.push(db.collection('adminDrafts').onSnapshot(snap => {
          remotePartsRef.current.drafts = snapshotToArray(snap);
          applyRemoteParts();
        }, error => console.error('Trace admin drafts listener failed:', error)));
      };
      setupPrivateListeners(window.traceFirebase.auth.currentUser);
      unsubs.push(window.traceFirebase.auth.onAuthStateChanged(setupPrivateListeners));
    }).catch(error => {
      console.error('Trace auth setup failed:', error);
    });
    return () => {
      unsubs.forEach(fn => fn());
      privateUnsubs.forEach(fn => fn());
    };
  }, []);

  // Listen for changes from other tabs (admin -> live).
  React.useEffect(() => {
    if (FIREBASE_ENABLED) return undefined;
    const onStorage = e => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(normalizeState(JSON.parse(e.newValue)));
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  const setSyncedState = React.useCallback(updater => {
    setState(prev => {
      const next = normalizeState(typeof updater === 'function' ? updater(prev) : updater);
      stateRef.current = next;
      if (FIREBASE_ENABLED) persistStateChanges(prev, next);
      return next;
    });
  }, []);
  return [state, setSyncedState];
}
Object.assign(window, {
  STORAGE_KEY,
  FIREBASE_ENABLED,
  DEMO_MODE,
  ADMIN_PASSWORD,
  TOPICS,
  SEED_LESSONS,
  DEFAULT_STATE,
  localTodayISO,
  createEmptyLiveLesson,
  isLessonReadyForArchive,
  loadState,
  saveState,
  normalizeState,
  useAppState
});
