// Firebase bridge for Trace of EKG.
// If app/firebase-config.js is not filled in, the app falls back to local demo mode.

function hasFirebaseConfig(config) {
  return Boolean(config && config.apiKey && config.projectId && config.appId);
}

function dataUrlToBlob(dataUrl) {
  const [meta, encoded] = dataUrl.split(',');
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function makeSafeFileName(name) {
  return (name || 'ekg-upload')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'ekg-upload';
}

function initTraceFirebase() {
  const config = window.TRACE_FIREBASE_CONFIG;
  const enabled = hasFirebaseConfig(config) && window.firebase;

  if (!enabled) {
    return {
      enabled: false,
      reason: hasFirebaseConfig(config) ? 'Firebase SDK did not load.' : 'Firebase config is not set.',
    };
  }

  try {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    const auth = firebase.auth(app);
    const db = firebase.firestore(app);
    const storage = firebase.storage(app);
    const mainRef = db.collection('settings').doc('main');
    const adminEmail = 'jhacnik@gmail.com';
    const authReady = new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve(user);
          return;
        }
        auth.signInAnonymously().then((cred) => resolve(cred.user)).catch((error) => {
          console.error('Trace anonymous auth failed:', error);
          reject(error);
        });
      }, reject);
    });

    function isAllowedAdmin(user = auth.currentUser) {
      return Boolean(user?.email && user.email.toLowerCase() === adminEmail);
    }

    async function signInAdmin() {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: adminEmail });
      const result = await auth.signInWithPopup(provider);
      if (!isAllowedAdmin(result.user)) {
        const email = result.user?.email || 'that account';
        await auth.signOut();
        await auth.signInAnonymously();
        throw new Error(`${email} is not authorized for admin access.`);
      }
      return result.user;
    }

    async function signOutAdmin() {
      await auth.signOut();
      return auth.signInAnonymously();
    }

    async function uploadDataUrl(dataUrl, fileName, folder = 'submissions') {
      await authReady;
      const blob = dataUrlToBlob(dataUrl);
      const safeName = makeSafeFileName(fileName);
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      const path = `${folder}/${id}-${safeName}`;
      const ref = storage.ref().child(path);
      await ref.put(blob, {
        contentType: blob.type,
        customMetadata: { deidentified: 'confirmed-by-submitter' },
      });
      return {
        url: await ref.getDownloadURL(),
        path,
        contentType: blob.type,
        size: blob.size,
      };
    }

    return {
      enabled: true,
      app,
      auth,
      db,
      storage,
      mainRef,
      authReady,
      adminEmail,
      isAllowedAdmin,
      signInAdmin,
      signOutAdmin,
      uploadDataUrl,
    };
  } catch (error) {
    console.error('Trace Firebase init failed:', error);
    return { enabled: false, reason: error.message || 'Firebase initialization failed.' };
  }
}

const traceFirebase = initTraceFirebase();

Object.assign(window, {
  traceFirebase,
  dataUrlToBlob,
});
