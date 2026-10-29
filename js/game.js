/* Raayan Quizz — game layer: profile (avatar/name/theme), XP + levels, daily streak + goal,
 * sticker mystery boxes, subject "islands" map and chapter trails. All state in RQ.progress. */
(() => {
  "use strict";
  const RQ = window.RQ;
  const { $, el } = RQ;

  // ---------------- profile ----------------
  const AVATARS = [
    { id: "owl", face: "🦉", name: "Hoot" }, { id: "robot", face: "🤖", name: "Bolt" },
    { id: "dragon", face: "🐲", name: "Ember" }, { id: "cat", face: "🐱", name: "Pixel" },
    { id: "fox", face: "🦊", name: "Zippy" }, { id: "panda", face: "🐼", name: "Momo" },
    { id: "unicorn", face: "🦄", name: "Sparkle" }, { id: "dino", face: "🦖", name: "Rex" },
  ];
  const THEMES = [
    { id: "candy", name: "Candy", icon: "🍭" }, { id: "space", name: "Space", icon: "🚀" },
    { id: "jungle", name: "Jungle", icon: "🌴" }, { id: "ocean", name: "Ocean", icon: "🐠" },
    { id: "dark", name: "Night", icon: "🌙" },
  ];
  const PRKEY = "raayan-quizz:profile";
  let profile = (() => { try { return JSON.parse(localStorage.getItem(PRKEY)) || null; } catch { return null; } })();
  const saveProfile = () => { try { localStorage.setItem(PRKEY, JSON.stringify(profile)); } catch {} };
  const avatar = () => AVATARS.find((a) => a.id === (profile && profile.avatar)) || AVATARS[0];
  function applyTheme() {
    document.documentElement.dataset.theme = (profile && profile.theme) || "candy";
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = getComputedStyle(document.documentElement).getPropertyValue("--indigo").trim() || "#7c3aed";
  }

  // ---------------- XP / levels / streak ----------------
  const LEVELS = [
    [0, "Seedling", "🌱"], [100, "Sprout", "🌿"], [300, "Explorer", "🧭"], [700, "Adventurer", "🎒"],
    [1500, "Scholar", "📚"], [3000, "Whiz", "⚡"], [6000, "Champion", "🏆"], [12000, "Legend", "👑"],
  ];
  const DAILY_GOAL = 20;
  const todayKey = () => new Date().toISOString().slice(0, 10);
  function g() { // game state lives inside progress so reset/export cover it
    const p = RQ.progress;
    p.game = p.game || {};
    const s = p.game;
    s.xp = s.xp | 0; s.streak = s.streak | 0; s.bestStreak = s.bestStreak | 0;
    s.lastDay = s.lastDay || ""; s.today = s.today || { day: todayKey(), correct: 0, answered: 0 };
    s.stickers = s.stickers || {}; s.boxes = s.boxes | 0;
    if (s.today.day !== todayKey()) s.today = { day: todayKey(), correct: 0, answered: 0 };
    return s;
  }
  function levelOf(xp) {
    let i = 0;
    while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    const next = LEVELS[i + 1];
    return { i, name: LEVELS[i][1], icon: LEVELS[i][2], xp, from: LEVELS[i][0], to: next ? next[0] : null,
      pct: next ? Math.round(((xp - LEVELS[i][0]) / (next[0] - LEVELS[i][0])) * 100) : 100 };
  }
  function touchStreak() {
    const s = g(), t = todayKey();
    if (s.lastDay === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    s.streak = s.lastDay === y.toISOString().slice(0, 10) ? s.streak + 1 : 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.lastDay = t;
  }
  function addXp(n, why) {
    const s = g();
    const before = levelOf(s.xp);
    s.xp += n;
    const after = levelOf(s.xp);
    RQ.saveProgress();
    if (after.i > before.i) setTimeout(() => toast(`${after.icon} Level up!`, `You are now a ${after.name}!`), 500);
    return after;
  }
  function toast(h, body) {
    const t = $("#award-toast");
    if (!t) return;
    t.innerHTML = "";
    t.appendChild(el("div", "at-ico", h.slice(0, 2)));
    const b = el("div", "at-body");
    b.appendChild(el("div", "at-h", h.slice(2).trim()));
    b.appendChild(el("div", "at-name", body));
    t.appendChild(b);
    t.className = "award-toast tier-gold"; void t.offsetWidth; t.classList.add("show");
    RQ.burstConfetti(80, 0.5); RQ.sndWin();
    setTimeout(() => t.classList.remove("show"), 2600);
  }

  // ---------------- stickers (mystery box) ----------------
  const STICKERS = {
    Science: ["🔬", "🧪", "🧲", "🌋", "🦕", "🪐", "🌈", "🧬", "⚗️", "🔭"],
    Mathematics: ["➗", "📐", "🧮", "🔢", "📏", "♾️", "🎲", "🧊", "🥧", "⏱️"],
    English: ["📚", "✒️", "🎭", "📜", "🖋️", "🦉", "🗣️", "📰", "🎤", "🧚"],
    Hindi: ["🪔", "🎋", "🥁", "🪁", "🐘", "🌺", "🏵️", "🎨", "📯", "🛕"],
    ICT: ["💻", "🤖", "🖱️", "⌨️", "💾", "🛰️", "🔌", "🧩", "🕹️", "📡"],
    "AI-Literacy": ["🧠", "🤖", "🛡️", "⚖️", "🔍", "💡", "🗂️", "🧭", "🎯", "🪪"],
    "Social Science": ["🌍", "🗺️", "🏛️", "🪙", "⛵", "🏰", "🧭", "🌾", "🕌", "🚂"],
    Kannada: ["🌼", "🐘", "🥥", "🏛️", "🎶", "🦌", "🌿", "🚣", "🪢", "🌺"],
    SEL: ["💗", "🤝", "🌈", "🧘", "😊", "🌱", "🫧", "🛡️", "🎯", "🕊️"],
    _default: ["⭐", "🌟", "✨", "🎈", "🎉", "🍭", "🍩", "🧸", "🎁", "🪄"],
  };
  // subject -> sticker family (Maths-1/Maths-2 share the Mathematics set, SST-1/2 the Social Science set, ...)
  function stickerFamily(subject) {
    const s = String(subject || "").toLowerCase();
    if (STICKERS[subject]) return subject;
    if (/math/.test(s)) return "Mathematics";
    if (/sst|social/.test(s)) return "Social Science";
    if (/kannada/.test(s)) return "Kannada";
    if (/hindi/.test(s)) return "Hindi";
    if (/english/.test(s)) return "English";
    if (/ai/.test(s)) return "AI-Literacy";
    if (/ict|computer/.test(s)) return "ICT";
    if (/science/.test(s)) return "Science";
    if (/sel|emotional/.test(s)) return "SEL";
    return "_default";
  }
  const stickerSet = (subject) => STICKERS[stickerFamily(subject)];
  // each shelf + actual subject collects its own set (Grade 8 Maths-1 and Maths-2 are separate albums)
  const stickerKey = (cat, subject) => `${cat}|${subject || "Fun"}`;
  function openBox(cat, subject) {
    const s = g();
    const set = stickerSet(subject);
    const key = stickerKey(cat, subject);
    s.stickers[key] = s.stickers[key] || [];
    const missing = set.filter((x) => !s.stickers[key].includes(x));
    const pool = missing.length && Math.random() < 0.75 ? missing : set;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const isNew = !s.stickers[key].includes(pick);
    if (isNew) s.stickers[key].push(pick);
    s.boxes += 1;
    RQ.saveProgress();
    return { sticker: pick, isNew, have: s.stickers[key].length, total: set.length, subject: String(subject || "Fun").replace(/-/g, " ") };
  }
  function showBox(cat, subject) {
    const box = el("div", "mbox");
    const inner = el("button", "mbox-gift", "🎁");
    const cap = el("div", "mbox-cap", "You earned a mystery box! Tap to open");
    box.appendChild(inner); box.appendChild(cap);
    $("#res-meta").parentElement.insertBefore(box, $("#res-meta").nextSibling);
    inner.addEventListener("click", () => {
      const r = openBox(cat, subject);
      inner.textContent = r.sticker; inner.classList.add("open"); inner.disabled = true;
      cap.textContent = r.isNew ? `New sticker! ${r.have}/${r.total} ${r.subject} stickers collected` : `Duplicate sticker — ${r.have}/${r.total} collected`;
      RQ.burstConfetti(120, 0.5); RQ.sndWin();
    }, { once: true });
  }

  // ---------------- header widget (avatar, level, streak, daily ring) ----------------
  function renderHeader() {
    let w = $("#game-head");
    if (!w) {
      w = el("div", "game-head"); w.id = "game-head";
      $(".hero").after(w);
    }
    const s = g(), lv = levelOf(s.xp), a = avatar();
    w.innerHTML = "";
    const av = el("button", "gh-avatar", a.face); av.title = "Change buddy / theme";
    av.addEventListener("click", openProfile);
    w.appendChild(av);
    const mid = el("div", "gh-mid");
    mid.appendChild(el("div", "gh-name", `${profile && profile.name ? profile.name : "Raayan"} · ${lv.icon} ${lv.name}`));
    const bar = el("div", "gh-bar"); const fill = el("div", "gh-fill"); fill.style.width = `${lv.pct}%`; bar.appendChild(fill);
    mid.appendChild(bar);
    mid.appendChild(el("div", "gh-xp muted", lv.to ? `${lv.xp} XP · ${lv.to - lv.xp} to ${LEVELS[lv.i + 1][1]}` : `${lv.xp} XP · max level!`));
    w.appendChild(mid);
    const st = el("div", "gh-streak"); st.title = `Best streak: ${s.bestStreak} days`;
    st.appendChild(el("span", "gh-flame", s.streak ? "🔥" : "🫧"));
    st.appendChild(el("strong", null, String(s.streak)));
    st.appendChild(el("span", "muted", "day streak"));
    w.appendChild(st);
    const ring = el("div", "gh-ring");
    const pct = Math.min(100, Math.round((s.today.correct / DAILY_GOAL) * 100));
    ring.style.setProperty("--p", pct);
    ring.appendChild(el("span", null, pct >= 100 ? "✅" : `${s.today.correct}/${DAILY_GOAL}`));
    ring.title = `Today's goal: ${DAILY_GOAL} correct answers`;
    w.appendChild(ring);
    const hint = $("#home-hint");
    if (hint) hint.textContent = pct >= 100 ? "Daily goal done — you're on fire! 🔥" : `Get ${DAILY_GOAL - s.today.correct} more right today to keep your streak 🔥`;
    const h1 = document.querySelector(".hero-text h1");
    if (h1) h1.textContent = `Hi ${profile && profile.name ? profile.name : "Raayan"}! Ready to play?`;
  }

  // ---------------- profile dialog ----------------
  function openProfile(first) {
    let d = $("#profile-dlg");
    if (d) d.remove();
    d = el("div", "pdlg"); d.id = "profile-dlg";
    const card = el("div", "card pop pdlg-card");
    card.appendChild(el("h2", null, first === true ? "👋 Welcome! Pick your buddy" : "🎨 Your buddy & theme"));
    const nameRow = el("label", "pdlg-name");
    nameRow.appendChild(el("span", null, "Your name"));
    const inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 16; inp.value = (profile && profile.name) || "Raayan"; inp.placeholder = "Name";
    nameRow.appendChild(inp); card.appendChild(nameRow);
    card.appendChild(el("h3", "section-h", "Buddy"));
    const ag = el("div", "pdlg-grid");
    let pickA = (profile && profile.avatar) || "owl", pickT = (profile && profile.theme) || "candy";
    AVATARS.forEach((a) => {
      const b = el("button", `pdlg-opt ${a.id === pickA ? "on" : ""}`); b.appendChild(el("span", "big", a.face)); b.appendChild(el("span", null, a.name));
      b.addEventListener("click", () => { pickA = a.id; ag.querySelectorAll(".pdlg-opt").forEach((x) => x.classList.remove("on")); b.classList.add("on"); RQ.sndClick(); });
      ag.appendChild(b);
    });
    card.appendChild(ag);
    card.appendChild(el("h3", "section-h", "Theme"));
    const tg = el("div", "pdlg-grid themes");
    THEMES.forEach((t) => {
      const b = el("button", `pdlg-opt theme-${t.id} ${t.id === pickT ? "on" : ""}`); b.appendChild(el("span", "big", t.icon)); b.appendChild(el("span", null, t.name));
      b.addEventListener("click", () => { pickT = t.id; tg.querySelectorAll(".pdlg-opt").forEach((x) => x.classList.remove("on")); b.classList.add("on"); document.documentElement.dataset.theme = t.id; RQ.sndClick(); });
      tg.appendChild(b);
    });
    card.appendChild(tg);
    // shelves: which grades/boards this kid sees everywhere (library, books, awards)
    const shelves = RQ.categoryList(true).map((c) => c.name).filter((c) => c !== "Demo" && c !== "My Quizzes");
    let pickS = new Set((profile && profile.shelves) || []);
    if (shelves.length > 1) {
      card.appendChild(el("h3", "section-h", "My shelves"));
      card.appendChild(el("p", "muted small", "Tick the grades you want to see. Leave all unticked to see everything."));
      const sg = el("div", "pdlg-grid shelves");
      shelves.forEach((c) => {
        const b = el("button", `pdlg-opt ${pickS.has(c) ? "on" : ""}`); b.type = "button";
        b.appendChild(el("span", "big", /^Grade/.test(c) ? "🎓" : "📗")); b.appendChild(el("span", null, c));
        b.addEventListener("click", () => { pickS.has(c) ? pickS.delete(c) : pickS.add(c); b.classList.toggle("on", pickS.has(c)); RQ.sndClick(); });
        sg.appendChild(b);
      });
      card.appendChild(sg);
    }
    const acts = el("div", "results-actions");
    const ok = el("button", "primary big", first === true ? "Let's go! 🚀" : "Save");
    ok.addEventListener("click", () => {
      profile = { name: inp.value.trim() || "Raayan", avatar: pickA, theme: pickT, shelves: [...pickS].filter((c) => shelves.includes(c)), createdAt: (profile && profile.createdAt) || Date.now() };
      saveProfile(); applyTheme(); d.remove(); RQ.renderHome(); RQ.navTo("home"); RQ.sndWin();
    });
    acts.appendChild(ok);
    if (first !== true) { const c = el("button", "ghost-btn", "Cancel"); c.addEventListener("click", () => { applyTheme(); d.remove(); }); acts.appendChild(c); }
    card.appendChild(acts);
    d.appendChild(card);
    document.body.appendChild(d);
  }

  // ---------------- subject trail (chapter path) ----------------
  function renderTrail(items, grid) {
    const trail = el("div", "trail");
    items.forEach((qz, i) => {
      const best = RQ.progress.best[qz.id];
      const paused = !!localStorage.getItem(`raayan-quizz:paused:${qz.id}`);
      const state = best == null ? (paused ? "paused" : "new") : best >= 90 ? "mastered" : "done";
      const node = el("button", `tnode ${state} ${i % 2 ? "right" : "left"}`);
      const dot = el("span", "tdot", state === "mastered" ? "⭐" : state === "done" ? "✓" : state === "paused" ? "⏸" : String(i + 1));
      node.appendChild(dot);
      const lbl = el("span", "tlabel");
      lbl.appendChild(el("strong", null, qz.title));
      lbl.appendChild(el("span", "muted", best != null ? `Best ${best}% · ${qz.count} Qs` : `${qz.count} questions`));
      node.appendChild(lbl);
      const book = RQ.books && RQ.books.bookFor(qz);
      if (book) {
        const rb = el("span", "tread", "📖"); rb.title = "Read the book";
        rb.addEventListener("click", (e) => { e.stopPropagation(); RQ.books.openReader(book); });
        node.appendChild(rb);
      }
      node.addEventListener("click", async () => { try { RQ.activeQuiz = await RQ.fetchQuiz(qz); RQ.openSetup(); } catch (e) { alert(e.message); } });
      trail.appendChild(node);
    });
    grid.classList.add("trail-host");
    grid.replaceChildren(trail);
  }

  // ---------------- hooks ----------------
  RQ.hooks.onAnswer.push((q, right) => {
    const s = g();
    s.today.answered += 1;
    if (right) {
      s.today.correct += 1;
      const d = q.difficulty === "tricky" ? 15 : q.difficulty === "tough" ? 10 : 5;
      addXp(d);
      if (s.today.correct === DAILY_GOAL) setTimeout(() => toast("🎯 Daily goal reached!", `${DAILY_GOAL} correct answers today — streak safe!`), 300);
    }
    touchStreak();
    RQ.saveProgress();
  });
  RQ.hooks.onFinish.push((session, quiz, pct) => {
    const bonus = pct === 100 ? 50 : pct >= 90 ? 30 : pct >= 70 ? 15 : 5;
    addXp(bonus + Math.min(25, session.questions.length));
    document.querySelectorAll(".mbox").forEach((x) => x.remove());
    if (session.questions.length >= 5 && pct >= 50 && quiz.subject !== "A Demo" && !session.cfg.fixMode) setTimeout(() => showBox(RQ.categoryOf(quiz), quiz.subject), 400);
  });
  RQ.hooks.onHome.push(renderHeader);
  RQ.hooks.onAwards.push(() => {
    const box = $("#sticker-album");
    if (!box) return;
    box.innerHTML = "";
    const s = g();
    box.appendChild(el("h3", "section-h", `🎁 Sticker album · ${s.boxes} boxes opened`));
    // one row per shelf+subject; show every subject on the kid's chosen shelves even before any box
    const rows = {};
    Object.entries(s.stickers).forEach(([k, have]) => { rows[k.includes("|") ? k : `Earlier|${k}`] = have; });
    RQ.playableQuizzes().forEach((m) => { const k = stickerKey(RQ.categoryOf(m), m.subject); rows[k] = rows[k] || []; });
    const byCat = {};
    Object.keys(rows).forEach((k) => { const [cat, sub] = k.split("|"); if (cat !== "Earlier" && !RQ.shelfOk(cat)) return; (byCat[cat] = byCat[cat] || []).push([sub, rows[k]]); });
    Object.keys(byCat).sort().forEach((cat) => {
      box.appendChild(el("h4", "album-cat", cat));
      byCat[cat].sort((a, b) => a[0].localeCompare(b[0])).forEach(([sub, have]) => {
        const set = stickerSet(sub === "_default" ? "" : sub);
        const row = el("div", "album-row");
        row.appendChild(el("div", "album-h", `${RQ.subjectIcon(sub)} ${sub === "_default" ? "Fun" : sub.replace(/-/g, " ")} · ${have.length}/${set.length}`));
        const grid = el("div", "album-grid");
        set.forEach((x) => grid.appendChild(el("span", `stk ${have.includes(x) ? "got" : ""}`, have.includes(x) ? x : "❔")));
        row.appendChild(grid); box.appendChild(row);
      });
    });
  });
  RQ.trail = renderTrail;
  RQ.game = { g, levelOf, LEVELS, AVATARS, THEMES, STICKERS, stickerSet, openProfile, get profile() { return profile; } };

  applyTheme();
  RQ.ready.then(() => { if (!profile) setTimeout(() => openProfile(true), 400); });
})();
