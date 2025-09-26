# Crisp — AI-Powered Interview Assistant

Crisp is a React + Vite + TypeScript web app that simulates a timed, AI-powered interview for a Full-Stack (React/Node) role. It includes two synchronized views:

- Interviewee: Resume upload, missing fields collection, timed interview chat with auto-submit, and progress.
- Interviewer: Dashboard to view all candidates, scores, summaries, detailed Q&A, and chat transcripts.

All data (candidates, progress, timers) is persisted locally so closing or refreshing the page restores the session. A Welcome Back modal allows resume for unfinished sessions.

---

## Features

- Resume Upload
  - Accepts PDF (required) and DOCX (optional).
  - Extracts Name, Email, Phone from content; if missing, a form prompts before starting.
  - Robust PDF parsing using a locally-bundled PDF.js worker to avoid CORS/import issues.
  
- Interview Flow (AI-like)
  - 6 questions total: 2 Easy → 2 Medium → 2 Hard.
  - Timers per difficulty: Easy 20s, Medium 60s, Hard 120s.
  - One-at-a-time questions with countdown and auto-submit when time expires.
  - Content-aware scoring with keyword matches, structure/length components, and time penalties.
  - Final score and short AI summary at the end.
  - Full chat history stored (assistant questions + candidate answers).

- Interviewer Dashboard
  - Candidate list (pre-sorted by score desc), search, and sortable columns.
  - Detail drawer: profile, final summary, all Q&A (score, time), and chat transcript.

- Persistence & Resume
  - Redux Toolkit + redux-persist (localStorage) for candidates, session, and UI state.
  - Absolute expiry timestamps are used to restore timers accurately after refresh.
  - Welcome Back modal to resume unfinished interviews.

- UI/UX
  - Ant Design v5 (clean, responsive UI).
  - Chat transcript bubbles with avatars.
  - Dark mode toggle (persisted).
  - Friendly error handling for invalid files and missing fields.

---

## Tech Stack

- React 18 + Vite + TypeScript
- Ant Design v5
- Redux Toolkit + redux-persist
- pdfjs-dist (PDF) + mammoth (DOCX)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+ (or your preferred package manager)

### Install
```bash
npm install
```

### Run Dev Server
```bash
npm run dev
```
Open http://localhost:5173

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## Project Structure
```
.
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ ai/
│  │  └─ engine.ts                # Question banks, timers, scoring, summary
│  ├─ components/
│  │  ├─ CandidateDetailDrawer.tsx # Interviewer detail view
│  │  ├─ ChatTranscript.tsx        # Chat bubbles transcript
│  │  ├─ ErrorBoundary.tsx         # Friendly crash screen
│  │  ├─ InterviewChat.tsx         # Timed question & answer UI
│  │  ├─ MissingFieldsForm.tsx     # Collect missing Name/Email/Phone
│  │  ├─ ResumeUpload.tsx          # Upload & parse resume
│  │  └─ WelcomeBackModal.tsx      # Resume unfinished session
│  ├─ pages/
│  │  ├─ Interviewee.tsx           # Upload → Missing Fields → Interview → Result
│  │  └─ Interviewer.tsx           # Dashboard (table, search/sort, details)
│  ├─ store/
│  │  ├─ hooks.ts                  # Typed hooks
│  │  └─ index.ts                  # Root reducer, redux-persist store
│  ├─ utils/
│  │  └─ resume.ts                 # PDF/DOCX text extraction, profile parsing
│  ├─ main.tsx
│  ├─ App.tsx
│  └─ styles.css
├─ index.html
├─ package.json
├─ tsconfig.json
└─ vite.config.ts
```

---

## Key Implementation Notes

- PDF.js worker is imported locally in `src/utils/resume.ts`:
  ```ts
  import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
  import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
  GlobalWorkerOptions.workerSrc = pdfWorker as unknown as string;
  ```
- Name extraction combines:
  - Text heuristics (skip headings like RESUME/CV, detect `Name:` label, ALL-CAPS or Title Case lines near top).
  - Email-local-part fallback (e.g., `john.doe@` → `John Doe`).
  - Filename fallback (e.g., `LOMADA_VITESH_REDDY_Resume.pdf` → `Lomada Vitesh Reddy`).
- Timers persist the absolute `currentQuestionExpiresAt` (epoch ms), so time remaining survives refresh/close.

---

## Common Issues

- PDF worker error (dynamic import):
  - Fixed by bundling local worker (no CDN). If you still see errors, hard refresh (Ctrl+F5).

- DevTools warning for AntD Modal `destroyOnClose`:
  - Replaced with `destroyOnHidden` per AntD v5.

- First question skipped:
  - Fixed by initializing Q1 timer immediately on start and guarding auto-submit.

---

## Roadmap / Nice-to-Haves

- Export candidates to CSV from the Interviewer dashboard.
- Per-question score breakdown UI (content/structure/length/time) after each submission.
- Sticky progress header and richer chat bubble UI.
- Visibility-based auto-pause/resume for timers.
- Deploy to Netlify/GitHub Pages.

---

## License
This project is provided for the Swipe assignment. Adapt or reuse as needed.
