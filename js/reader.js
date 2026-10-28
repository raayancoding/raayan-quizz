/* Raayan Quizz — Bookshelf + flipbook reader (StPageFlip).
 * Reads books/index.json (public) and books-private/index.json (local only) written by
 * lighthouse/export_books.py. Links quizzes <-> books via sourceDir (fallback: subject + chapter). */
(() => {
  "use strict";
  const RQ = window.RQ;
  const { $, el } = RQ;

  const RKEY = (id) => `raayan-quizz:read:${id}`;
  let books = [];                 // merged index entries
  let bookMeta = {};              // id -> book.json (lazy)
  let cur = null;                 // { book, meta, flip, root, page }
  let speaking = false;

  // ---------------- index ----------------
  async function loadIndex() {
    const srcs = [["books", false], ["books-private", true]];
    const all = [];
    for (const [root, priv] of srcs) {
      try {
        const r = await fetch(`${root}/index.json`, { cache: "no-store" });
        if (!r.ok) continue;
        const j = await r.json();
        (j.books || []).forEach((b) => all.push({ ...b, root, private: priv }));
      } catch { /* not served / offline */ }
    }
    books = all;
    return books;
  }
  const bookRoot = (b) => `${b.root}/${b.dir}`;
  const pageUrl = (b, n) => `${bookRoot(b)}/p/${String(n).padStart(3, "0")}.webp`;
  const thumbUrl = (b, n) => `${bookRoot(b)}/t/${String(n).padStart(3, "0")}.webp`;

  async function getMeta(b) {
    if (!bookMeta[b.id]) {
      const r = await fetch(`${bookRoot(b)}/book.json`, { cache: "no-store" });
      bookMeta[b.id] = r.ok ? await r.json() : { pages: b.pages, text: {} };
    }
    return bookMeta[b.id];
  }

  // quiz meta/object -> book; book -> quiz meta
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const qChapter = (q) => {
    const m = /ch(\d+)/.exec(q.file || q.id || "");
    return m ? Number(m[1]) : RQ.chapterNum(q);
  };
  function bookFor(q) {
    if (!q || !books.length) return null;
    if (q.sourceDir) {
      const b = books.find((x) => x.sourceDir === q.sourceDir);
      if (b) return b;
    }
    const n = qChapter(q);
    const board = q.board || null;
    return books.find((b) => norm(b.subject) === norm(q.subject) && b.chapter === n &&
      String(b.grade) === String(q.grade ?? b.grade) && (b.board || null) === board) || null;
  }
  function quizFor(b) {
    const list = (RQ.quizIndex && RQ.quizIndex.quizzes) || [];
    return list.find((q) => q.sourceDir && q.sourceDir === b.sourceDir) ||
      list.find((q) => norm(q.subject) === norm(b.subject) && qChapter(q) === b.chapter &&
        String(q.grade ?? "") === String(b.grade) && (q.board || null) === (b.board || null)) || null;
  }

  // ---------------- reading progress ----------------
  function loadRead(id) { try { return JSON.parse(localStorage.getItem(RKEY(id))) || null; } catch { return null; } }
  function saveRead(id, st) { try { localStorage.setItem(RKEY(id), JSON.stringify(st)); } catch {} }
  function markPage(b, n) {
    const st = loadRead(b.id) || { page: 1, seen: [], done: false, at: 0 };
    st.page = n; st.at = Date.now();
    if (!st.seen.includes(n)) {
      st.seen.push(n);
      RQ.progress.pagesRead += 1;
    }
    let newly = [];
    if (!st.done && st.seen.length >= Math.max(1, b.pages - 1)) {
      st.done = true;
      RQ.progress.booksRead += 1;
      newly = RQ.syncAwards();
      setTimeout(() => showDone(), 600);
    }
    RQ.saveProgress();
    saveRead(b.id, st);
    if (newly.length) RQ.celebrateAwards(newly);
    return st;
  }
  const readPct = (b) => { const st = loadRead(b.id); return st ? Math.min(100, Math.round((st.seen.length / b.pages) * 100)) : 0; };

  // ---------------- bookshelf view ----------------
  function renderBooks() {
    const shelves = $("#books-shelves");
    const empty = $("#books-empty");
    shelves.innerHTML = "";
    if (!books.length) { empty.classList.remove("hidden"); $("#books-continue").classList.add("hidden"); RQ.show("#view-books"); return; }
    empty.classList.add("hidden");

    // continue reading strip
    const recent = books.map((b) => ({ b, st: loadRead(b.id) })).filter((x) => x.st && !x.st.done)
      .sort((a, c) => (c.st.at || 0) - (a.st.at || 0)).slice(0, 4);
    const cont = $("#books-continue");
    cont.innerHTML = "";
    if (recent.length) {
      cont.classList.remove("hidden");
      cont.appendChild(el("h3", "section-h", "⏳ Continue reading"));
      const row = el("div", "book-row");
      recent.forEach(({ b, st }) => row.appendChild(bookTile(b, `Page ${st.page} of ${b.pages}`)));
      cont.appendChild(row);
    } else cont.classList.add("hidden");

    // shelves: category -> subject -> books
    const cats = {};
    books.forEach((b) => { const c = RQ.categoryOf(b); (cats[c] = cats[c] || []).push(b); });
    const order = (c) => (c === "General" ? 9999 : (c.includes(" · ") ? 1000 : 0) + (parseInt(c.replace(/\D/g, ""), 10) || 500));
    Object.keys(cats).sort((a, c) => order(a) - order(c)).forEach((cat) => {
      const sec = el("section", "shelf");
      const h = el("h2", "shelf-h");
      h.appendChild(el("span", null, `${cat.includes("NCERT") ? "📗" : "🎓"} ${cat}`));
      const n = cats[cat].length, done = cats[cat].filter((b) => (loadRead(b.id) || {}).done).length;
      h.appendChild(el("span", "muted shelf-meta", `${done}/${n} books read`));
      sec.appendChild(h);
      const bySub = {};
      cats[cat].forEach((b) => (bySub[b.subject] = bySub[b.subject] || []).push(b));
      Object.keys(bySub).sort().forEach((sub) => {
        const sh = el("h3", "shelf-sub");
        sh.appendChild(el("span", null, `${RQ.subjectIcon(sub)} ${sub.replace(/-/g, " ")}`));
        const priv = bySub[sub].every((b) => b.private);
        if (priv) sh.appendChild(el("span", "tag ghost", "local only"));
        sec.appendChild(sh);
        const row = el("div", "book-row");
        bySub[sub].sort((a, c) => a.chapter - c.chapter).forEach((b) => row.appendChild(bookTile(b)));
        sec.appendChild(row);
      });
      shelves.appendChild(sec);
    });
    RQ.show("#view-books");
  }

  function bookTile(b, subtitle) {
    const t = el("button", "book-tile");
    const cover = el("div", "book-cover");
    const img = document.createElement("img");
    img.loading = "lazy"; img.alt = ""; img.src = thumbUrl(b, 1);
    cover.appendChild(img);
    const pct = readPct(b);
    const st = loadRead(b.id);
    if (st && st.done) cover.appendChild(el("span", "book-done", "✓"));
    else if (pct) { const bar = el("div", "book-bar"); const f = el("div", "book-bar-fill"); f.style.width = `${pct}%`; bar.appendChild(f); cover.appendChild(bar); }
    t.appendChild(cover);
    t.appendChild(el("div", "book-title", `${b.chapter}. ${b.title}`));
    t.appendChild(el("div", "book-meta muted", subtitle || `${b.pages} pages`));
    t.addEventListener("click", () => openReader(b));
    return t;
  }

  // ---------------- reader ----------------
  async function openReader(b, startPage) {
    const meta = await getMeta(b);
    closeReader(true);
    const root = $("#reader");
    root.classList.remove("hidden");
    document.body.classList.add("reading");
    $("#rd-title").textContent = `${b.chapter}. ${b.title}`;
    $("#rd-sub").textContent = `${b.board ? b.board + " · " : ""}Grade ${b.grade} · ${b.subject.replace(/-/g, " ")}`;
    $("#rd-done").classList.add("hidden");
    $("#rd-zoomed").classList.add("hidden");
    $("#rd-thumbstrip").classList.add("hidden");
    $("#rd-quiz").classList.toggle("hidden", !quizFor(b));

    const st = loadRead(b.id);
    const page = Math.min(b.pages, Math.max(1, startPage || (st && !st.done ? st.page : 1)));
    const w = meta.width || 1000, h = meta.height || 1400;
    const host = $("#rd-host");
    host.innerHTML = "";                       // destroy() removes the flip element itself
    const flipEl = el("div", "rd-flip");
    host.appendChild(flipEl);
    const flip = new St.PageFlip(flipEl, {
      width: w, height: h, size: "stretch",
      minWidth: 240, maxWidth: 1000, minHeight: 320, maxHeight: 1400,
      showCover: true, maxShadowOpacity: 0.35, usePortrait: true,
      mobileScrollSupport: false, flippingTime: 650, startPage: page - 1,
    });
    // HTML pages (not canvas) stay sharp on retina screens and lazy-load
    const pagesEls = Array.from({ length: b.pages }, (_, i) => {
      const d = el("div", "rd-page");
      if (i === 0 || i === b.pages - 1) d.dataset.density = "hard";
      const img = document.createElement("img");
      img.src = pageUrl(b, i + 1); img.alt = `Page ${i + 1}`; img.loading = "lazy"; img.draggable = false;
      d.appendChild(img);
      flipEl.appendChild(d);
      return d;
    });
    flip.loadFromHTML(pagesEls);
    cur = { book: b, meta, flip, page };
    const slider = $("#rd-slider");
    slider.max = b.pages; slider.value = page;
    flip.on("flip", (e) => onPage(e.data + 1));
    onPage(page);
    buildThumbs(b);
  }

  function onPage(n) {
    if (!cur) return;
    cur.page = n;
    $("#rd-page").textContent = `${n} / ${cur.book.pages}`;
    $("#rd-slider").value = n;
    stopSpeak();
    markPage(cur.book, n);
    const strip = $("#rd-thumbstrip");
    strip.querySelectorAll(".rd-thumb").forEach((t) => t.classList.toggle("on", Number(t.dataset.n) === n));
    const on = strip.querySelector(".rd-thumb.on");
    if (on && !strip.classList.contains("hidden")) on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  function buildThumbs(b) {
    const strip = $("#rd-thumbstrip");
    strip.innerHTML = "";
    for (let i = 1; i <= b.pages; i++) {
      const t = el("button", "rd-thumb");
      t.dataset.n = i;
      const img = document.createElement("img"); img.loading = "lazy"; img.src = thumbUrl(b, i); img.alt = `Page ${i}`;
      t.appendChild(img); t.appendChild(el("span", null, String(i)));
      t.addEventListener("click", () => goTo(i));
      strip.appendChild(t);
    }
  }
  function goTo(n) {
    if (!cur) return;
    n = Math.min(cur.book.pages, Math.max(1, n));
    cur.flip.flip(n - 1);
  }
  function closeReader(silent) {
    stopSpeak();
    if (cur && cur.flip) { try { cur.flip.destroy(); } catch {} }
    cur = null;
    $("#rd-host").innerHTML = "";
    $("#reader").classList.add("hidden");
    document.body.classList.remove("reading");
    if (!silent && !$("#view-books").classList.contains("hidden")) renderBooks();
  }
  function showDone() {
    if (!cur) return;
    $("#rd-done").classList.remove("hidden");
    RQ.burstConfetti(140, 0.5); RQ.sndWin();
  }

  // ---------------- read aloud ----------------
  function langFor(b) {
    const s = norm(b.subject);
    if (s.includes("hindi")) return "hi-IN";
    if (s.includes("kannada")) return "kn-IN";
    return "en-IN";
  }
  function speakPage() {
    if (!cur || !("speechSynthesis" in window)) { alert("Read-aloud isn't supported in this browser."); return; }
    if (speaking) { stopSpeak(); return; }
    const txt = (cur.meta.text || {})[String(cur.page)];
    if (!txt) { RQ.sndClick(); $("#rd-speak").classList.add("shake"); setTimeout(() => $("#rd-speak").classList.remove("shake"), 500); return; }
    const u = new SpeechSynthesisUtterance(txt.replace(/\s+/g, " ").slice(0, 4000));
    u.lang = langFor(cur.book); u.rate = 0.95;
    const voices = speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang === u.lang) || voices.find((x) => x.lang.startsWith(u.lang.slice(0, 2)));
    if (v) u.voice = v;
    u.onend = u.onerror = () => { speaking = false; $("#rd-speak").classList.remove("on"); };
    speaking = true; $("#rd-speak").classList.add("on");
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  function stopSpeak() { if ("speechSynthesis" in window) speechSynthesis.cancel(); speaking = false; $("#rd-speak").classList.remove("on"); }

  // ---------------- quiz me on this page ----------------
  const pageRefs = (src) => [...String(src || "").matchAll(/(?:page|p)\s*[:-]?\s*(\d+)/gi)].map((m) => Number(m[1]));
  async function quizOnPage() {
    if (!cur) return;
    const meta = quizFor(cur.book);
    if (!meta) return;
    const quiz = await RQ.fetchQuiz(meta);
    const p = cur.page;
    let ids = new Set();
    for (const spread of [1, 2, 3]) {
      ids = new Set(quiz.questions.filter((q) => pageRefs(q.source).some((n) => Math.abs(n - p) <= spread)).map((q) => q.id));
      if (ids.size >= 6) break;
    }
    const count = ids.size >= 4 ? Math.min(10, ids.size) : 10;
    RQ.activeQuiz = quiz;
    closeReader(true);
    RQ.startSession({ count, difficulty: "all", topic: "all", shuffle: true, instant: true, timer: false, timerMin: 10,
      onlyIds: ids.size >= 4 ? ids : null, label: ids.size >= 4 ? `Page ${p}` : "" });
  }
  async function quizWholeBook() {
    if (!cur) return;
    const meta = quizFor(cur.book);
    if (!meta) { closeReader(); return; }
    RQ.activeQuiz = await RQ.fetchQuiz(meta);
    closeReader(true);
    RQ.openSetup();
  }

  // ---------------- wiring ----------------
  function bind() {
    $("#rd-close").addEventListener("click", () => closeReader());
    $("#rd-prev").addEventListener("click", () => cur && cur.flip.flipPrev());
    $("#rd-next").addEventListener("click", () => cur && cur.flip.flipNext());
    $("#rd-slider").addEventListener("change", (e) => goTo(Number(e.target.value)));
    $("#rd-thumbs").addEventListener("click", () => {
      const s = $("#rd-thumbstrip"); s.classList.toggle("hidden");
      if (!s.classList.contains("hidden")) onPage(cur.page);
    });
    $("#rd-zoom").addEventListener("click", () => {
      if (!cur) return;
      $("#rd-zoomed-img").src = pageUrl(cur.book, cur.page);
      $("#rd-zoomed").classList.remove("hidden");
    });
    $("#rd-zoomed").addEventListener("click", () => $("#rd-zoomed").classList.add("hidden"));
    $("#rd-speak").addEventListener("click", speakPage);
    $("#rd-quiz").addEventListener("click", quizOnPage);
    $("#rd-done-quiz").addEventListener("click", quizWholeBook);
    $("#rd-done-close").addEventListener("click", () => closeReader());
    document.addEventListener("keydown", (e) => {
      if (!cur) return;
      if (e.key === "ArrowRight") cur.flip.flipNext();
      else if (e.key === "ArrowLeft") cur.flip.flipPrev();
      else if (e.key === "Escape") { if (!$("#rd-zoomed").classList.contains("hidden")) $("#rd-zoomed").classList.add("hidden"); else closeReader(); }
    });
    window.addEventListener("pagehide", () => { if (cur) markPage(cur.book, cur.page); });
  }

  RQ.books = { bookFor, quizFor, openReader, renderBooks, loadRead, get list() { return books; } };
  RQ.views.books = renderBooks;
  bind();
  RQ.ready.then(loadIndex).then(() => RQ.renderHome());
})();
