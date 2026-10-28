# Raayan Quizz — UI refresh + Flipbook reader plan

Status: **implemented (v1.2.0)**. Decisions taken: StPageFlip (vendored), 1000 px WebP pages,
NCERT books public in `books/`, Lighthouse books local-only in `books-private/` (gitignored).
Modules: `js/reader.js` (Phase 1), `js/game.js` (Phase 2), `js/practice.js` (Phase 3),
`sw.js` + `manifest.webmanifest` + image questions + hi/kn strings (Phase 4).
Not done: recorded sound pack (still synthesized beeps). Remaining NCERT quizzes: English (5), SST-1/2 (15).

---

## Why
- The quiz flow works, but the Library/Setup screens are "forms", not a game. Kids need
  something to *look forward to* between quizzes.
- Kids currently study from the Lighthouse flipbooks in the browser (slow, login, no offline).
  We already have every `book.pdf` crawled — a built-in reader lets them **read, then play**
  without leaving the app.

## Phase 1 — Flipbook reader ("📖 Read the book")
**What the kid sees**
- Every quiz tile (and the Setup page) gets a **Read book** button when a book exists.
- A full-screen reader with a **real page-turn animation** (two-page spread on
  tablet/desktop, single page on phone), swipe/arrow keys, pinch-zoom, a page slider,
  a thumbnail strip, and **"Quiz me on this page"** → starts a 10-question mini-quiz
  filtered to that page's topic (we already tag questions by sub-topic; we'll add an
  optional `page` field to questions).
- Reading progress is remembered per book (resume where you left off) and awards a new
  stamp: **Bookworm** (read a whole book), **Page Turner** (100 pages read).

**How (offline, no backend)**
1. A build step in `lighthouse/` (`export_books.py`) renders each chapter's `book.pdf`
   (or page JPEGs) to **WebP page images** at 2 sizes (thumb ~200px, page ~1400px) into
   `raayan-quizz/books/<Subject>/chNN/` + a `book.json` (title, page count, page→topic
   map, physical page offset). WebP is ~5–10× smaller than the PDF and renders instantly
   on phones; no PDF.js needed. (~1–3 MB per chapter.)
2. Reader UI: vendored **StPageFlip** (~40 KB, MIT, no deps) for the 3D page-curl, or a
   lighter CSS-only 3D flip if we want zero deps. Lazy-loads ±2 pages.
3. `quizzes/index.json` entries get `book: "books/Science/ch05/book.json"` (written by
   `validate_quiz.py --register` when the export exists).
4. Optional **Read aloud** button (browser `speechSynthesis`) for English/Hindi text we
   already have in `facts.txt` — great for Grade 4.

**Content note**: the Lighthouse books are school-licensed and the app is now **public on
GitHub Pages** (raayancoding.github.io). Options: (a) ship only NCERT books in the public
reader (NCERT PDFs are freely distributed), and load Lighthouse books from a *local folder*
the kid picks once (File System Access API, stays on-device); (b) keep a private branch/
deploy for the Lighthouse books. I recommend (a).

## Phase 2 — "Game-feel" library refresh
- **Avatar + name**: pick a buddy (owl/robot/dragon/cat) and a theme colour on first run;
  the buddy is the mascot in quizzes and on the home header ("Hi Raayan!").
- **Subject islands map** instead of plain cards: each subject is an island on a
  scrolling map; chapters are a path of nodes (locked → unlocked → ✓ → ⭐), like a board
  game. Grade shelves become "worlds" (Grade 4 world, NCERT·Grade 8 world).
- **Daily streak + XP**: XP per correct answer, levels (Seedling → Explorer → Scholar →
  Legend), a streak flame on the header, and a "today's goal: 20 questions" ring.
- **Mystery box** after each quiz: random sticker (collectible set per subject) — pure
  localStorage, no network.
- **Themes**: light / dark / "space" / "jungle" (CSS variables only).
- **Sound pack**: replace synthesized beeps with short recorded SFX (vendored, <200 KB).

## Phase 3 — Smarter practice
- **Mistake bank**: questions answered wrong get collected per subject; "Fix my mistakes"
  quiz replays them (spaced: 1 day → 3 days → 7 days). Removes guessing incentive.
- **Challenge mode**: 60-second blitz, lives (3 ❤️), combo multiplier — optional, fun.
- **Parent view** (behind a long-press on the logo): per-subject accuracy, time spent,
  weakest topics, export progress JSON / import on another device.
- **Export/Import progress** so moving phone → tablet keeps trophies.

## Phase 4 — Polish / ops
- PWA manifest + service worker → installable, fully offline, home-screen icon.
- Image-based questions (`image` field) — needed for Maths/Science diagrams.
- Hindi/Kannada UI strings for those subjects (RTL not needed).

## Effort & order I recommend
1. Phase 1 (reader) — biggest "wow", reuses crawled data, ~2 sessions.
2. Phase 2 map + avatar + streak — ~2 sessions.
3. Phase 3 mistake bank — 1 session; challenge/parent view — 1 session.
4. Phase 4 PWA — ½ session.

## Decisions I need from you
- [ ] Reader: page-curl library (StPageFlip, vendored) **or** zero-dependency CSS flip?
- [ ] Export image size: 1400 px (sharp on tablets, ~2 MB/chapter) or 1000 px (~1 MB)?
- [ ] Which phases/items to drop or reorder?
- [ ] Public site: NCERT books only in the reader + local-folder pick for Lighthouse books (option a)?
