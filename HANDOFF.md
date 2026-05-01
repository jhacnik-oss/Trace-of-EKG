# Trace of EKG — Project Handoff

## What this is
A weekly microteaching lecture series website for emergency medicine residents focused on EKG interpretation. Built as a fully self-contained single-page app (React + Babel, no build step). Hosted on GitHub Pages.

## Live site
**https://jhacnik-oss.github.io/Trace-of-EKG/**

## GitHub repo
**https://github.com/jhacnik-oss/Trace-of-EKG.git**

Local project folder: `/Users/justin/Desktop/Trace of EKG Website/`

---

## File structure

```
index.html              — Entry point, loads all scripts
app/
  state.jsx             — localStorage persistence, seed data, useAppState hook
  ekg.jsx               — Deterministic SVG placeholder EKG traces per topic
  media.jsx             — LessonMedia: shows uploaded image/PDF or falls back to EKG trace
  idle-strip.jsx        — Animated Normal Sinus Rhythm strip for idle landing page
  live.jsx              — Live hero, countdown timer, word cloud reveal, teaching phase
  archive.jsx           — Archive grid/list/by-topic layouts + lesson modal
  submit.jsx            — Resident EKG submission form (image/PDF upload)
  admin.jsx             — Password-protected admin panel
  guest.jsx             — Guest/Lecture page (no password, limited controls)
  app.jsx               — Routing, nav, tweaks panel, dark/light mode toggle
  styles.css            — Main theme (Björk-inspired: moody, saturated, experimental)
  idle-hero.css         — Idle landing page layout and NSR strip styles
```

---

## How the app works

### Pages / routes (hash-based)
| URL | Page | Notes |
|-----|------|-------|
| `#home` | Live hero + archive | Default landing |
| `#archive` | Full archive | Searchable by topic |
| `#submit` | EKG submission form | Residents submit tracings |
| `#lecture` | Guest lecturer panel | No password, limited to live controls |
| `#admin` | Admin panel | Password: `sinus` |

### Live session flow
1. Admin (or guest) uploads EKG image, sets question + teaching points
2. Clicks **▶ Go live** — residents on `#home` see the EKG and can submit free-text reads
3. Timer counts down (configurable: 15/30/45/60/90/120s or open/no timer)
4. **Reveal now** — shows word cloud of all responses + "the read" answer
5. Teaching tab — bullet points + annotated trace
6. If run by a guest: "Submit for admin review" button sends session to admin approval queue

### Admin panel tabs
- **This week** — edit lesson content, go live, reveal, reset
- **Live stream** — watch responses come in real-time
- **Approvals** — review sessions run by guest lecturers (approve → goes to archive, or reject)
- **Submissions** — resident-submitted EKGs (view, promote to "this week", mark reviewed)
- **Schedule** — queue future weeks
- **Archive** — edit/delete past lessons
- **Topics** — manage topic categories + colors

### Guest/Lecture page (`#lecture`)
- No password required
- Can: edit this week's content, go live, reveal, reset, see live responses with names
- After reveal: "Submit for admin review" → goes to admin Approvals tab
- Cannot: touch archive, submissions, schedule, topics

### Persistence
**Everything saves to localStorage** — this means data only exists in the browser it was entered on. It does NOT sync across devices.

---

## NEXT TASK: Firebase integration (in progress)

The user wants to replace localStorage with Firebase Firestore so data syncs across devices. They have a Google account. This was the next task when the session ended.

### What needs to sync (everything except tweaks/preferences):
- `liveLesson` — current week's lesson + live state + responses
- `lessons` — archive of past lessons
- `submissions` — resident-submitted EKGs
- `pendingLessons` — guest sessions awaiting admin approval
- `schedule` — queued future weeks
- `topics` — topic categories

### What stays in localStorage (per-device preferences):
- `tweaks` (dark/light mode, palette, typography, timer style, archive layout) — stored under key `ekg-tweaks-v2`

### Firebase setup status
The user was instructed to:
1. Create a Firebase project at console.firebase.google.com
2. Enable Firestore in test mode
3. Register a web app and copy the `firebaseConfig` object

**They have NOT yet provided the firebaseConfig** — this is the first thing to ask for in the new session.

### Implementation plan for Firebase
Once the config is provided:
1. Add Firebase SDK to `index.html` (use CDN, compat version)
2. Create `app/firebase.jsx` — initialize app, export `db`
3. Rewrite `state.jsx`:
   - Replace `loadState`/`saveState`/`useAppState` with Firestore real-time listeners (`onSnapshot`)
   - Use a single Firestore document `settings/main` for liveLesson + topics + schedule
   - Use collections for `lessons`, `submissions`, `pendingLessons`
4. Keep tweaks in localStorage (unchanged)
5. Add `<script type="text/babel" src="app/firebase.jsx"></script>` before state.jsx in index.html

### Firestore data structure (recommended)
```
/settings/main         — { liveLesson, topics, schedule, currentWeek }
/lessons/{id}          — archived lesson documents
/submissions/{id}      — resident submission documents
/pendingLessons/{id}   — guest sessions awaiting approval
```

---

## Design notes
- **Palette**: default is "paper" (light, cream background, red accent). Dark mode available via toggle in nav.
- **Dark mode toggle**: pill button in navbar ("☾ Dark" / "☀ Light"), stored in localStorage as `ekg-tweaks-v2`
- **Default mode**: light (dark: false, palette: "paper")
- **Typography**: Fraunces (display/headings), Inter Tight (body), JetBrains Mono (labels)
- **Admin password**: `sinus` (demo — user should change this in state.jsx `ADMIN_PASSWORD` constant)

---

## Git workflow
The project uses a simple main branch. To push changes:
```bash
cd "/Users/justin/Desktop/Trace of EKG Website"
git add <files>
git commit -m "description"
git push
```
GitHub Pages auto-deploys from main. Changes go live within ~1 minute. Always hard-refresh with Cmd+Shift+R after deploying.

The remote is already authenticated with a personal access token embedded in the remote URL. No need to re-authenticate.

---

## Key decisions made so far
- No build step — pure HTML/JSX loaded via Babel standalone CDN. Easy to edit, works as static files.
- Hash-based routing (no server config needed for GitHub Pages)
- localStorage for now, Firebase next
- Guest lecturer page has no auth — security comes from the admin approval queue, not access control
- Week numbers removed from the Lecture (guest) page
- The NSR rhythm strip on idle page changes to red-on-black in dark mode
