/* Raayan Quizz — Bookshelf + flipbook reader (StPageFlip).
 * Reads books/index.json (public) and books-private/index.json (local only) written by
 * lighthouse/export_books.py. Links quizzes <-> books via sourceDir (fallback: subject + chapter). */
(() => {
  "use strict";
  const RQ = window.RQ;
  const { $, el } = RQ;

  const RKEY = (id) => `raayan-quizz:read:${id}`;
  const MKEY = "raayan-quizz:reader-mode";   // "auto" | "page" | "flip"
  let books = [];                 // merged index entries (static + local PDFs)
  let bookMeta = {};              // id -> book.json (lazy)
  let cur = null;                 // { book, meta, mode, flip, page, urls: Map }
  let speaking = false;
  let chromeHidden = false;

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
    if (window.RQStore) {
      try {
        (await RQStore.all("books")).forEach((b) => all.push({
          id: b.id, title: b.title, subject: b.subject || "My Books", grade: b.grade || null, board: null,
          source: "local", chapter: 0, pages: b.pages || 0, private: true, local: true, addedAt: b.addedAt,
        }));
      } catch { /* no IndexedDB */ }
    }
    books = all;
    return books;
  }
  async function reload() { await loadIndex(); if (!$("#view-books").classList.contains("hidden")) renderBooks(); }
  const bookRoot = (b) => `${b.root}/${b.dir}`;
  const staticPage = (b, n) => `${bookRoot(b)}/p/${String(n).padStart(3, "0")}.webp`;
  const staticThumb = (b, n) => `${bookRoot(b)}/t/${String(n).padStart(3, "0")}.webp`;
  const bookCat = (b) => (b.local ? (b.grade ? `Grade ${b.grade}` : "My Books") : RQ.categoryOf(b));
  const visibleBooks = () => books.filter((b) => b.local || RQ.shelfOk(bookCat(b)));

  // ---- page provider: static WebP, or pdf.js render for uploaded PDFs ----
  const pdfDocs = {};             // id -> pdf.js document
  async function pdfDoc(b) {
    if (pdfDocs[b.id]) return pdfDocs[b.id];
    if (!window.pdfjsLib) throw new Error("PDF engine not loaded");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
    const row = await RQStore.get("books", b.id);
    if (!row) throw new Error("This book is no longer on the device");
    const doc = await pdfjsLib.getDocument({ data: await row.blob.arrayBuffer() }).promise;
    pdfDocs[b.id] = doc;
    if (!b.pages) { b.pages = doc.numPages; }
    return doc;
  }
  async function renderPdfPage(b, n, width) {
    const doc = await pdfDoc(b);
    const page = await doc.getPage(n);
    const vp0 = page.getViewport({ scale: 1 });
    const scale = width / vp0.width;
    const vp = page.getViewport({ scale });
    const c = document.createElement("canvas");
    c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
    return new Promise((res) => c.toBlob((blob) => res(URL.createObjectURL(blob)), "image/webp", 0.8));
  }
  const urlCache = new Map();      // `${id}:${kind}:${n}` -> url (blob urls for local)
  async function pageSrc(b, n, kind = "page") {
    if (!b.local) return kind === "thumb" ? staticThumb(b, n) : staticPage(b, n);
    const k = `${b.id}:${kind}:${n}`;
    if (urlCache.has(k)) return urlCache.get(k);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const url = await renderPdfPage(b, n, kind === "thumb" ? 180 : Math.min(1600, Math.max(700, Math.ceil(window.innerWidth * dpr))));
    urlCache.set(k, url);
    if (urlCache.size > 40) { const first = urlCache.keys().next().value; URL.revokeObjectURL(urlCache.get(first)); urlCache.delete(first); }
    return url;
  }
  async function getMeta(b) {
    if (!bookMeta[b.id]) {
      if (b.local) {
        try { await pdfDoc(b); } catch (e) { alert(e.message); }
        bookMeta[b.id] = { pages: b.pages, text: {}, width: 1000, height: 1400 };
      } else {
        const r = await fetch(`${bookRoot(b)}/book.json`, { cache: "no-store" });
        bookMeta[b.id] = r.ok ? await r.json() : { pages: b.pages, text: {} };
      }
    }
    return bookMeta[b.id];
  }
  async function pageText(b, meta, n) {
    const t = (meta.text || {})[String(n)];
    if (t || !b.local) return t || "";
    try {
      const page = await (await pdfDoc(b)).getPage(n);
      const tc = await page.getTextContent();
      const s = tc.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
      meta.text[String(n)] = s;
      return s;
    } catch { return ""; }
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
    return books.find((b) => !b.local && norm(b.subject) === norm(q.subject) && b.chapter === n &&
      String(b.grade) === String(q.grade ?? b.grade) && (b.board || null) === board) || null;
  }
  function quizFor(b) {
    if (b.local) return null;
    const list = (RQ.quizIndex && RQ.quizIndex.quizzes) || [];
    return list.find((q) => q.sourceDir && q.sourceDir === b.sourceDir) ||
      list.find((q) => !q.local && norm(q.subject) === norm(b.subject) && qChapter(q) === b.chapter &&
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
    if (!st.done && b.pages && st.seen.length >= Math.max(1, b.pages - 1)) {
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
  const readPct = (b) => { const st = loadRead(b.id); return st && b.pages ? Math.min(100, Math.round((st.seen.length / b.pages) * 100)) : 0; };

  // ---------------- bookshelf view ----------------
  function renderBooks() {
    const shelves = $("#books-shelves");
    const empty = $("#books-empty");
    shelves.innerHTML = "";
    const list = visibleBooks();
    if (!list.length) { empty.classList.remove("hidden"); $("#books-continue").classList.add("hidden"); RQ.show("#view-books"); return; }
    empty.classList.add("hidden");

    // continue reading strip
    const recent = list.map((b) => ({ b, st: loadRead(b.id) })).filter((x) => x.st && !x.st.done)
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
    list.forEach((b) => { const c = bookCat(b); (cats[c] = cats[c] || []).push(b); });
    const order = (c) => (c === "My Books" ? 99998 : c === "General" ? 9999 : (c.includes(" · ") ? 1000 : 0) + (parseInt(c.replace(/\D/g, ""), 10) || 500));
    Object.keys(cats).sort((a, c) => order(a) - order(c)).forEach((cat) => {
      const sec = el("section", "shelf");
      const h = el("h2", "shelf-h");
      h.appendChild(el("span", null, `${cat === "My Books" ? "📂" : cat.includes("NCERT") ? "📗" : "🎓"} ${cat}`));
      const n = cats[cat].length, done = cats[cat].filter((b) => (loadRead(b.id) || {}).done).length;
      h.appendChild(el("span", "muted shelf-meta", `${done}/${n} books read`));
      sec.appendChild(h);
      const bySub = {};
      cats[cat].forEach((b) => (bySub[b.subject] = bySub[b.subject] || []).push(b));
      Object.keys(bySub).sort().forEach((sub) => {
        const sh = el("h3", "shelf-sub");
        sh.appendChild(el("span", null, `${RQ.subjectIcon(sub)} ${sub.replace(/-/g, " ")}`));
        if (bySub[sub].every((b) => b.local)) sh.appendChild(el("span", "tag ghost", "on this device"));
        else if (bySub[sub].every((b) => b.private)) sh.appendChild(el("span", "tag ghost", "local only"));
        sec.appendChild(sh);
        const row = el("div", "book-row");
        bySub[sub].sort((a, c) => (a.chapter - c.chapter) || ((a.addedAt || 0) - (c.addedAt || 0))).forEach((b) => row.appendChild(bookTile(b)));
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
    img.loading = "lazy"; img.alt = "";
    if (b.local) { cover.classList.add("local"); pageSrc(b, 1, "thumb").then((u) => { img.src = u; }).catch(() => {}); }
    else img.src = staticThumb(b, 1);
    cover.appendChild(img);
    const pct = readPct(b);
    const st = loadRead(b.id);
    if (st && st.done) cover.appendChild(el("span", "book-done", "✓"));
    else if (pct) { const bar = el("div", "book-bar"); const f = el("div", "book-bar-fill"); f.style.width = `${pct}%`; bar.appendChild(f); cover.appendChild(bar); }
    t.appendChild(cover);
    t.appendChild(el("div", "book-title", b.chapter ? `${b.chapter}. ${b.title}` : b.title));
    t.appendChild(el("div", "book-meta muted", subtitle || (b.pages ? `${b.pages} pages` : "PDF")));
    t.addEventListener("click", () => openReader(b));
    return t;
  }

  // ---------------- reader ----------------
  const prefMode = () => { try { return localStorage.getItem(MKEY) || "auto"; } catch { return "auto"; } };
  const autoMode = () => (window.innerWidth < 900 || window.innerHeight > window.innerWidth ? "page" : "flip");
  function pickMode(b) {
    if (b.local) return "page";
    const p = prefMode();
    return p === "auto" ? autoMode() : p;
  }

  async function openReader(b, startPage) {
    const meta = await getMeta(b);
    if (!b.pages) { alert("Couldn't open this book."); return; }
    closeReader(true);
    const root = $("#reader");
    root.classList.remove("hidden");
    document.body.classList.add("reading");
    setChrome(true);
    $("#rd-title").textContent = b.chapter ? `${b.chapter}. ${b.title}` : b.title;
    $("#rd-sub").textContent = b.local ? `${b.subject}${b.grade ? " · Grade " + b.grade : ""} · on this device`
      : `${b.board ? b.board + " · " : ""}Grade ${b.grade} · ${b.subject.replace(/-/g, " ")}`;
    $("#rd-done").classList.add("hidden");
    $("#rd-zoomed").classList.add("hidden");
    $("#rd-thumbstrip").classList.add("hidden");
    $("#rd-quiz").classList.toggle("hidden", !quizFor(b));
    $("#rd-mode").classList.toggle("hidden", !!b.local);
    $("#rd-full").classList.toggle("hidden", !document.documentElement.requestFullscreen);

    const st = loadRead(b.id);
    const page = Math.min(b.pages, Math.max(1, startPage || (st && !st.done ? st.page : 1)));
    cur = { book: b, meta, page, mode: pickMode(b), flip: null };
    $("#rd-slider").max = b.pages; $("#rd-slider").value = page;
    mountMode(page);
    buildThumbs(b);
    if (cur.mode === "page" && !sessionStorage.getItem("rq-hint")) {
      $("#rd-hint").classList.remove("hidden");
      setTimeout(() => $("#rd-hint").classList.add("hidden"), 3500);
      sessionStorage.setItem("rq-hint", "1");
    }
  }

  function mountMode(page) {
    const b = cur.book, meta = cur.meta;
    $("#rd-mode").textContent = cur.mode === "page" ? "📖" : "📄";
    $("#rd-mode").title = cur.mode === "page" ? "Switch to book (two-page) view" : "Switch to single-page view";
    const host = $("#rd-host"), pages = $("#rd-pages");
    host.innerHTML = ""; pages.innerHTML = "";
    if (cur.flip) { try { cur.flip.destroy(); } catch {} cur.flip = null; }
    host.classList.toggle("hidden", cur.mode !== "flip");
    pages.classList.toggle("hidden", cur.mode !== "page");

    if (cur.mode === "flip") {
      const w = meta.width || 1000, h = meta.height || 1400;
      const flipEl = el("div", "rd-flip");         // destroy() removes the flip element itself
      host.appendChild(flipEl);
      const flip = new St.PageFlip(flipEl, {
        width: w, height: h, size: "stretch",
        minWidth: 240, maxWidth: 1000, minHeight: 320, maxHeight: 1400,
        showCover: true, maxShadowOpacity: 0.35, usePortrait: true,
        mobileScrollSupport: false, flippingTime: 650, startPage: page - 1,
      });
      const pagesEls = Array.from({ length: b.pages }, (_, i) => {
        const d = el("div", "rd-page");
        if (i === 0 || i === b.pages - 1) d.dataset.density = "hard";
        const img = document.createElement("img");
        img.src = staticPage(b, i + 1); img.alt = `Page ${i + 1}`; img.loading = "lazy"; img.draggable = false;
        d.appendChild(img);
        flipEl.appendChild(d);
        return d;
      });
      flip.loadFromHTML(pagesEls);
      flip.on("flip", (e) => onPage(e.data + 1));
      cur.flip = flip;
      onPage(page);
    } else {
      // single page, full height, horizontal scroll-snap (native swipe)
      for (let i = 1; i <= b.pages; i++) {
        const pg = el("div", "rd-pg"); pg.dataset.n = i;
        const img = document.createElement("img"); img.alt = `Page ${i}`; img.draggable = false;
        pg.appendChild(img);
        pg.appendChild(el("span", "rd-pg-num", String(i)));
        pages.appendChild(pg);
      }
      pages.scrollLeft = (page - 1) * pages.clientWidth;
      requestAnimationFrame(() => { pages.scrollLeft = (page - 1) * pages.clientWidth; });
      cur.page = page;
      onPage(page);
      loadNear(page);
    }
  }

  function loadNear(n) {
    if (!cur || cur.mode !== "page") return;
    const pages = $("#rd-pages");
    for (let i = n - 2; i <= n + 2; i++) {
      const pg = pages.querySelector(`.rd-pg[data-n="${i}"]`);
      if (!pg) continue;
      const img = pg.querySelector("img");
      if (img.dataset.loaded) continue;
      img.dataset.loaded = "1";
      pageSrc(cur.book, i).then((u) => { img.src = u; }).catch(() => { img.dataset.loaded = ""; });
    }
  }

  function onPage(n) {
    if (!cur) return;
    cur.page = n;
    $("#rd-page").textContent = `${n} / ${cur.book.pages}`;
    $("#rd-slider").value = n;
    stopSpeak();
    markPage(cur.book, n);
    loadNear(n);
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
      const img = document.createElement("img"); img.loading = "lazy"; img.alt = `Page ${i}`;
      if (!b.local) img.src = staticThumb(b, i);
      t.appendChild(img); t.appendChild(el("span", null, String(i)));
      t.addEventListener("click", () => goTo(i));
      strip.appendChild(t);
    }
  }
  function loadThumbsLocal() {
    if (!cur || !cur.book.local) return;
    const imgs = [...$("#rd-thumbstrip").querySelectorAll("img")].filter((i) => !i.src);
    (async () => { for (const img of imgs) { if (!cur) return; try { img.src = await pageSrc(cur.book, Number(img.parentElement.dataset.n), "thumb"); } catch {} } })();
  }
  function goTo(n, instant) {
    if (!cur) return;
    n = Math.min(cur.book.pages, Math.max(1, n));
    if (cur.mode === "flip") { cur.flip.flip(n - 1); return; }
    const pages = $("#rd-pages");
    pages.scrollTo({ left: (n - 1) * pages.clientWidth, behavior: instant ? "auto" : "smooth" });
  }
  const next = () => goTo((cur && cur.page || 1) + 1);
  const prev = () => goTo((cur && cur.page || 1) - 1);

  function setChrome(show) {
    chromeHidden = !show;
    $("#reader").classList.toggle("immersive", !show);
  }
  function closeReader(silent) {
    stopSpeak();
    if (cur && cur.flip) { try { cur.flip.destroy(); } catch {} }
    cur = null;
    $("#rd-host").innerHTML = ""; $("#rd-pages").innerHTML = "";
    $("#reader").classList.add("hidden");
    document.body.classList.remove("reading");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (!silent && !$("#view-books").classList.contains("hidden")) renderBooks();
  }
  function showDone() {
    if (!cur) return;
    $("#rd-done").classList.remove("hidden");
    RQ.burstConfetti(140, 0.5); RQ.sndWin();
  }

  // ---------------- zoom overlay (pinch / drag / double-tap) ----------------
  const Z = { s: 1, x: 0, y: 0, min: 1, max: 5, ptrs: new Map(), lastTap: 0, start: null };
  function zoomApply() {
    const img = $("#rd-zoomed-img");
    img.style.transform = `translate(${Z.x}px, ${Z.y}px) scale(${Z.s})`;
  }
  function zoomClamp() {
    const v = $("#rz-view"), img = $("#rd-zoomed-img");
    const w = img.clientWidth * Z.s, h = img.clientHeight * Z.s;
    const maxX = Math.max(0, (w - v.clientWidth) / 2), maxY = Math.max(0, (h - v.clientHeight) / 2);
    Z.x = Math.min(maxX, Math.max(-maxX, Z.x)); Z.y = Math.min(maxY, Math.max(-maxY, Z.y));
  }
  function zoomTo(s, cx, cy) {
    const v = $("#rz-view");
    const r = v.getBoundingClientRect();
    const px = (cx ?? r.left + r.width / 2) - r.left - r.width / 2, py = (cy ?? r.top + r.height / 2) - r.top - r.height / 2;
    const ns = Math.min(Z.max, Math.max(Z.min, s));
    // keep the point under the finger fixed
    Z.x = px - (px - Z.x) * (ns / Z.s); Z.y = py - (py - Z.y) * (ns / Z.s); Z.s = ns;
    zoomClamp(); zoomApply();
  }
  async function openZoom(n) {
    if (!cur) return;
    n = n || cur.page;
    $("#rz-page").textContent = `${n} / ${cur.book.pages}`;
    Z.s = 1; Z.x = 0; Z.y = 0; zoomApply();
    const img = $("#rd-zoomed-img");
    img.src = ""; img.src = await pageSrc(cur.book, n);
    $("#rd-zoomed").dataset.n = n;
    $("#rd-zoomed").classList.remove("hidden");
    $("#rz-prev").classList.toggle("hidden", n <= 1);
    $("#rz-next").classList.toggle("hidden", n >= cur.book.pages);
  }
  function closeZoom() { $("#rd-zoomed").classList.add("hidden"); }
  function bindZoom() {
    const v = $("#rz-view");
    v.addEventListener("pointerdown", (e) => {
      try { v.setPointerCapture(e.pointerId); } catch {}
      Z.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (Z.ptrs.size === 1) {
        Z.start = { x: e.clientX, y: e.clientY, ox: Z.x, oy: Z.y, moved: false };
      } else if (Z.ptrs.size === 2) {
        const [a, b] = [...Z.ptrs.values()];
        Z.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: Z.s };
      }
    });
    v.addEventListener("pointermove", (e) => {
      if (!Z.ptrs.has(e.pointerId)) return;
      Z.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (Z.ptrs.size === 2 && Z.pinch) {
        const [a, b] = [...Z.ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        zoomTo(Z.pinch.s * (d / Z.pinch.d), (a.x + b.x) / 2, (a.y + b.y) / 2);
      } else if (Z.ptrs.size === 1 && Z.start) {
        const dx = e.clientX - Z.start.x, dy = e.clientY - Z.start.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) Z.start.moved = true;
        Z.x = Z.start.ox + dx; Z.y = Z.start.oy + dy; zoomClamp(); zoomApply();
      }
    });
    const up = (e) => {
      const wasMoved = Z.start && Z.start.moved;
      Z.ptrs.delete(e.pointerId);
      if (Z.ptrs.size < 2) Z.pinch = null;
      if (Z.ptrs.size === 0) {
        if (!wasMoved && e.type === "pointerup") {
          const now = Date.now();
          if (now - Z.lastTap < 320) { zoomTo(Z.s > 1.2 ? 1 : 2.5, e.clientX, e.clientY); Z.lastTap = 0; }
          else Z.lastTap = now;
        } else if (wasMoved && Z.s <= 1.02) {
          // horizontal swipe at fit-scale = turn page
          const dx = e.clientX - Z.start.x;
          if (dx < -60) zoomNav(1); else if (dx > 60) zoomNav(-1);
        }
        Z.start = null;
      }
    };
    v.addEventListener("pointerup", up); v.addEventListener("pointercancel", up);
    v.addEventListener("wheel", (e) => { e.preventDefault(); zoomTo(Z.s * (e.deltaY < 0 ? 1.15 : 0.87), e.clientX, e.clientY); }, { passive: false });
    $("#rz-in").addEventListener("click", () => zoomTo(Z.s * 1.4));
    $("#rz-out").addEventListener("click", () => zoomTo(Z.s / 1.4));
    $("#rz-fit").addEventListener("click", () => zoomTo(1));
    $("#rz-close").addEventListener("click", closeZoom);
    $("#rz-prev").addEventListener("click", () => zoomNav(-1));
    $("#rz-next").addEventListener("click", () => zoomNav(1));
  }
  function zoomNav(d) {
    if (!cur) return;
    const n = Number($("#rd-zoomed").dataset.n || cur.page) + d;
    if (n < 1 || n > cur.book.pages) return;
    goTo(n, true); openZoom(n);
  }

  // ---------------- read aloud ----------------
  function langFor(b) {
    const s = norm(b.subject);
    if (s.includes("hindi")) return "hi-IN";
    if (s.includes("kannada")) return "kn-IN";
    return "en-IN";
  }
  async function speakPage() {
    if (!cur || !("speechSynthesis" in window)) { alert("Read-aloud isn't supported in this browser."); return; }
    if (speaking) { stopSpeak(); return; }
    const txt = await pageText(cur.book, cur.meta, cur.page);
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
    $("#rd-prev").addEventListener("click", prev);
    $("#rd-next").addEventListener("click", next);
    $("#rd-slider").addEventListener("change", (e) => goTo(Number(e.target.value)));
    $("#rd-thumbs").addEventListener("click", () => {
      const s = $("#rd-thumbstrip"); s.classList.toggle("hidden");
      if (!s.classList.contains("hidden")) { onPage(cur.page); loadThumbsLocal(); }
    });
    $("#rd-zoom").addEventListener("click", () => openZoom());
    $("#rd-mode").addEventListener("click", () => {
      if (!cur || cur.book.local) return;
      cur.mode = cur.mode === "page" ? "flip" : "page";
      try { localStorage.setItem(MKEY, cur.mode); } catch {}
      mountMode(cur.page);
    });
    $("#rd-full").addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else $("#reader").requestFullscreen().catch(() => {});
    });
    document.addEventListener("fullscreenchange", () => { $("#rd-full").textContent = document.fullscreenElement ? "⛶" : "⛶"; if (cur && cur.mode === "page") goTo(cur.page, true); });
    $("#rd-speak").addEventListener("click", speakPage);
    $("#rd-quiz").addEventListener("click", quizOnPage);
    $("#rd-done-quiz").addEventListener("click", quizWholeBook);
    $("#rd-done-close").addEventListener("click", () => closeReader());

    // page mode: track scroll-snap position; tap zones; double-tap -> zoom
    const pages = $("#rd-pages");
    let scrollT = null;
    pages.addEventListener("scroll", () => {
      clearTimeout(scrollT);
      scrollT = setTimeout(() => {
        if (!cur || cur.mode !== "page") return;
        const n = Math.round(pages.scrollLeft / pages.clientWidth) + 1;
        if (n !== cur.page) onPage(n);
      }, 80);
    }, { passive: true });
    let tapT = null, lastTap = 0;
    pages.addEventListener("click", (e) => {
      if (!cur) return;
      const now = Date.now();
      if (now - lastTap < 320) { clearTimeout(tapT); lastTap = 0; openZoom(); return; }
      lastTap = now;
      const r = pages.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      tapT = setTimeout(() => { if (x > 0.72) next(); else if (x < 0.28) prev(); else setChrome(chromeHidden); }, 330);
    });
    window.addEventListener("resize", () => { if (cur && cur.mode === "page") goTo(cur.page, true); });
    bindZoom();

    document.addEventListener("keydown", (e) => {
      if (!cur) return;
      const zoomed = !$("#rd-zoomed").classList.contains("hidden");
      if (e.key === "ArrowRight") zoomed ? zoomNav(1) : next();
      else if (e.key === "ArrowLeft") zoomed ? zoomNav(-1) : prev();
      else if (e.key === "Escape") { if (zoomed) closeZoom(); else closeReader(); }
      else if (e.key === "+" || e.key === "=") { if (zoomed) zoomTo(Z.s * 1.4); }
      else if (e.key === "-") { if (zoomed) zoomTo(Z.s / 1.4); }
    });
    window.addEventListener("pagehide", () => { if (cur) markPage(cur.book, cur.page); });
  }

  RQ.books = { bookFor, quizFor, openReader, renderBooks, loadRead, reload, get list() { return books; } };
  RQ.views.books = renderBooks;
  bind();
  RQ.ready.then(loadIndex).then(() => RQ.renderHome());
})();
