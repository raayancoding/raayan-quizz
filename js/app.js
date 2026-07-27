/* Raayan Quizz — generic offline quiz engine (vanilla JS, no deps).
 * Loads quizzes from quizzes/index.json (when served) or a local file picker.
 * Supports single / multiple / boolean questions, difficulty & topic filters,
 * shuffle, optional timer, instant explanations, scoring, review and history. */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ---------------- fun: sound, confetti, mascot ----------------
  let soundOn = (() => { try { return localStorage.getItem("raayan-quizz:sound") !== "off"; } catch { return true; } })();
  let audioCtx = null;
  function beep(freqs, dur = 0.14, type = "sine", gain = 0.14) {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      let t = audioCtx.currentTime;
      freqs.forEach((f) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type; osc.frequency.value = f;
        g.gain.setValueAtTime(gain, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(audioCtx.destination);
        osc.start(t); osc.stop(t + dur);
        t += dur * 0.9;
      });
    } catch { /* ignore audio errors */ }
  }
  const sndRight = () => beep([523, 659, 784, 1047], 0.12, "triangle", 0.12); // C-E-G-C
  const sndWrong = () => beep([220, 175], 0.18, "sawtooth", 0.08);
  const sndWin = () => beep([523, 659, 784, 1047, 1319], 0.16, "triangle", 0.13);
  const sndClick = () => beep([660], 0.05, "square", 0.05);

  // lightweight canvas confetti (no dependencies)
  const confettiCanvas = document.getElementById("confetti");
  const cctx = confettiCanvas ? confettiCanvas.getContext("2d") : null;
  let cparts = [], craf = null;
  function sizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener("resize", sizeConfetti);
  sizeConfetti();
  function burstConfetti(count = 90, originX = 0.5) {
    if (!cctx) return;
    const colors = ["#7c3aed", "#ec4899", "#38bdf8", "#f59e0b", "#22c55e", "#fbbf24"];
    for (let i = 0; i < count; i++) {
      cparts.push({
        x: confettiCanvas.width * originX + (Math.random() - 0.5) * 120,
        y: confettiCanvas.height * 0.32,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * -9 - 4,
        g: 0.28 + Math.random() * 0.1,
        size: 6 + Math.random() * 7,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
        life: 90 + Math.random() * 40
      });
    }
    if (!craf) craf = requestAnimationFrame(stepConfetti);
  }
  function stepConfetti() {
    cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    cparts = cparts.filter((p) => p.life > 0 && p.y < confettiCanvas.height + 40);
    cparts.forEach((p) => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
      cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rot);
      cctx.fillStyle = p.color;
      cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      cctx.restore();
    });
    if (cparts.length) craf = requestAnimationFrame(stepConfetti);
    else { craf = null; cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
  }

  const CHEERS = ["You got it! 🎉", "Awesome! 🌟", "Brilliant! ✨", "Nailed it! 💪", "Super! 🚀", "Yes! 🎈"];
  const NUDGES = ["Almost! 🤔", "Nice try! 💛", "Keep going! 🌱", "You'll get the next! ✨", "Learn &amp; win! 📚"];
  const START = ["Let's go! 🦉", "You can do it!", "Have fun! 🎯", "Think it through 🧠"];
  function mascot(mood) {
    const face = document.getElementById("mascot-face");
    const bubble = document.getElementById("mascot-bubble");
    if (!face || !bubble) return;
    face.classList.remove("happy", "sad");
    void face.offsetWidth; // restart animation
    if (mood === "right") { face.textContent = "🤩"; face.classList.add("happy"); bubble.innerHTML = CHEERS[(Math.random() * CHEERS.length) | 0]; }
    else if (mood === "wrong") { face.textContent = "🙈"; face.classList.add("sad"); bubble.innerHTML = NUDGES[(Math.random() * NUDGES.length) | 0]; }
    else { face.textContent = "🦉"; bubble.innerHTML = START[(Math.random() * START.length) | 0]; }
  }

  const DEMO = {
    schemaVersion: 1,
    id: "demo-general",
    title: "Demo Quiz",
    subject: "A Demo",
    description: "A tiny sample so you can see how it works.",
    questions: [
      { id: "d1", type: "single", difficulty: "simple",
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1,
        explanation: "Mars looks red because of iron-oxide (rust) on its surface." },
      { id: "d2", type: "boolean", difficulty: "simple",
        question: "The Sun is a star.", answer: true,
        explanation: "The Sun is the star at the centre of our solar system." },
      { id: "d3", type: "multiple", difficulty: "tough",
        question: "Select all even numbers.",
        options: ["3", "4", "7", "10"], answer: [1, 3],
        explanation: "4 and 10 are even (divisible by 2); 3 and 7 are odd." },
      { id: "d4", type: "single", difficulty: "simple",
        question: "Which of these is a solid?",
        options: ["Water", "Pencil", "Air", "Steam"], answer: 1,
        explanation: "A pencil has a fixed shape and volume, so it is a solid." },
      { id: "d5", type: "boolean", difficulty: "tricky",
        question: "Gases have a fixed volume.", answer: false,
        explanation: "Gases have neither a fixed shape nor a fixed volume — they fill their container."
      }
    ]
  };

  // ---------------- app meta / contact (edit these) ----------------
  // Bump APP_VERSION manually before committing — it shows on the About page + footer.
  const APP_VERSION = "1.0.0";
  const ABOUT = {
    github: "", // e.g. "https://github.com/your-handle"  (leave "" to show a placeholder)
    email: "",  // e.g. "raayan@example.com"
  };

  // ---------------- state ----------------
  let quizIndex = null;      // { title, quizzes: [meta...] }
  let activeQuiz = null;     // normalized quiz object
  let session = null;        // running session
  let timerHandle = null;
  let currentCat = null;     // browse breadcrumb
  let currentSubject = null;

  // ---------------- categories (grade / demo / general) ----------------
  const SUBJECT_ICONS = {
    "AI-Literacy": "🤖", "English": "🔤", "Hindi": "📕", "ICT": "💻",
    "Kannada-III-Language": "🔡", "Mathematics": "➗", "Science": "🔬",
    "SEL": "💗", "Social Science": "🌍", "Social-Science": "🌍", "A Demo": "🎮",
  };
  const subjectIcon = (s) => SUBJECT_ICONS[s] || "📘";
  const isDemoMeta = (m) => !!m && (m.id === "demo-general" || m.subject === "A Demo");
  function categoryOf(m) {
    if (isDemoMeta(m)) return "Demo";
    if (m.grade != null && m.grade !== "") return `Grade ${m.grade}`;
    return "General";
  }
  const catOrder = (c) =>
    c === "Demo" ? 0 : c === "General" ? 9999 : (parseInt(String(c).replace(/\D/g, ""), 10) || 500) + 1;
  const catIcon = (c) => (c === "Demo" ? "🎮" : c === "General" ? "🌈" : "🎓");
  function categoryList() {
    const cats = {};
    (quizIndex && quizIndex.quizzes || []).forEach((m) => {
      const c = categoryOf(m); (cats[c] = cats[c] || []).push(m);
    });
    return Object.keys(cats).sort((a, b) => catOrder(a) - catOrder(b)).map((c) => ({ name: c, items: cats[c] }));
  }
  function groupBy(arr, keyFn) {
    const o = {};
    arr.forEach((x) => { const k = keyFn(x); (o[k] = o[k] || []).push(x); });
    return o;
  }
  const chapterNum = (m) => {
    const n = parseInt(String(m.chapter || m.title || "").match(/\d+/)?.[0] ?? "9999", 10);
    return isNaN(n) ? 9999 : n;
  };

  // ---------------- progress + awards (localStorage) ----------------
  const PKEY = "raayan-quizz:progress";
  function normalizeProgress(p) {
    p = p && typeof p === "object" ? p : {};
    return {
      totalCorrect: p.totalCorrect | 0,
      totalAnswered: p.totalAnswered | 0,
      quizzesPlayed: p.quizzesPlayed | 0,
      perfectCount: p.perfectCount | 0,
      best: p.best && typeof p.best === "object" ? p.best : {},
      subjects: Array.isArray(p.subjects) ? p.subjects : [],
      awards: p.awards && typeof p.awards === "object" ? p.awards : {},
    };
  }
  function loadProgress() {
    try { return normalizeProgress(JSON.parse(localStorage.getItem(PKEY))); } catch { return normalizeProgress({}); }
  }
  function saveProgress() { try { localStorage.setItem(PKEY, JSON.stringify(progress)); } catch {} }
  let progress = loadProgress();

  const masteredCount = () => Object.values(progress.best).filter((v) => v >= 90).length;
  const playableQuizzes = () => (quizIndex && quizIndex.quizzes || []).filter((m) => !isDemoMeta(m));
  function subjectItems(subject) {
    return playableQuizzes().filter((m) => (m.subject || "") === subject);
  }
  function isComplete(items) { return items.length > 0 && items.every((m) => progress.best[m.id] != null); }
  function anySubjectComplete() {
    const subs = [...new Set(playableQuizzes().map((m) => m.subject || ""))];
    return subs.some((s) => isComplete(subjectItems(s)));
  }
  function anyGradeComplete() {
    const cats = categoryList().filter((c) => c.name.startsWith("Grade "));
    return cats.some((c) => isComplete(c.items));
  }

  const AWARDS = [
    { id: "first-steps", name: "First Steps", icon: "🐣", tier: "bronze", desc: "Finish your very first quiz.", check: (p) => p.quizzesPlayed >= 1 },
    { id: "sharp-10", name: "Sharp Shooter", icon: "🎯", tier: "bronze", desc: "Answer 10 questions correctly.", check: (p) => p.totalCorrect >= 10 },
    { id: "explorer-3", name: "Explorer", icon: "🧭", tier: "bronze", desc: "Try 3 different subjects.", check: (p) => p.subjects.length >= 3 },
    { id: "brainy-50", name: "Brainy Buddy", icon: "🧠", tier: "silver", desc: "50 correct answers in total.", check: (p) => p.totalCorrect >= 50 },
    { id: "perfect-1", name: "Perfect!", icon: "🌟", tier: "silver", desc: "Score 100% on any quiz.", check: (p) => p.perfectCount >= 1 },
    { id: "on-a-roll", name: "On a Roll", icon: "🔥", tier: "silver", desc: "Finish 10 quizzes.", check: (p) => p.quizzesPlayed >= 10 },
    { id: "century-100", name: "Century", icon: "💯", tier: "silver", desc: "100 correct answers in total.", check: (p) => p.totalCorrect >= 100 },
    { id: "performer", name: "Star Performer", icon: "⭐", tier: "gold", desc: "Master 5 quizzes at 90%+.", check: () => masteredCount() >= 5 },
    { id: "flawless-5", name: "Flawless Five", icon: "💎", tier: "gold", desc: "Get 100% on five quizzes.", check: (p) => p.perfectCount >= 5 },
    { id: "globe-6", name: "Globe Trotter", icon: "🌍", tier: "gold", desc: "Try 6 different subjects.", check: (p) => p.subjects.length >= 6 },
    { id: "subject-champ", name: "Subject Champion", icon: "🏆", tier: "gold", desc: "Finish every quiz in a subject.", check: () => anySubjectComplete() },
    { id: "nerd", name: "Certified Nerd", icon: "🤓", tier: "gold", desc: "Master 10 quizzes at 90%+.", check: () => masteredCount() >= 10 },
    { id: "marathoner", name: "Marathoner", icon: "🏃", tier: "gold", desc: "Finish 25 quizzes.", check: (p) => p.quizzesPlayed >= 25 },
    { id: "grade-champ", name: "Grade Champion", icon: "🎓", tier: "platinum", desc: "Finish every quiz in a whole grade.", check: () => anyGradeComplete() },
    { id: "scholar-500", name: "Super Scholar", icon: "📚", tier: "platinum", desc: "500 correct answers in total.", check: (p) => p.totalCorrect >= 500 },
    { id: "legend-1000", name: "Quiz Legend", icon: "👑", tier: "platinum", desc: "1000 correct answers in total.", check: (p) => p.totalCorrect >= 1000 },
  ];

  function recordResult() {
    const id = activeQuiz.id || "unknown";
    const total = session.questions.length;
    const pct = Math.round((session.score / total) * 100);
    progress.totalCorrect += session.score;
    progress.totalAnswered += total;
    progress.quizzesPlayed += 1;
    if (pct === 100) progress.perfectCount += 1;
    if ((progress.best[id] ?? -1) < pct) progress.best[id] = pct;
    const subj = activeQuiz.subject || "";
    if (subj && subj !== "A Demo" && !progress.subjects.includes(subj)) progress.subjects.push(subj);
    const newly = AWARDS.filter((a) => !progress.awards[a.id] && a.check(progress));
    newly.forEach((a) => { progress.awards[a.id] = Date.now(); });
    saveProgress();
    return newly;
  }

  // grant (silently) any award already qualified — keeps things correct after a
  // version bump adds new awards, or if progress was imported/seeded.
  function syncAwards() {
    const newly = AWARDS.filter((a) => !progress.awards[a.id] && a.check(progress));
    if (newly.length) { newly.forEach((a) => { progress.awards[a.id] = Date.now(); }); saveProgress(); }
    return newly;
  }

  // celebration toast queue
  function celebrateAwards(list) {
    if (!list || !list.length) return;
    const toast = document.getElementById("award-toast");
    if (!toast) return;
    let i = 0;
    const showNext = () => {
      if (i >= list.length) return;
      const a = list[i++];
      toast.innerHTML = "";
      toast.appendChild(el("div", "at-ico", a.icon));
      const body = el("div", "at-body");
      body.appendChild(el("div", "at-h", "🎉 New stamp unlocked!"));
      body.appendChild(el("div", "at-name", a.name));
      body.appendChild(el("div", "at-desc", a.desc));
      toast.appendChild(body);
      toast.className = `award-toast tier-${a.tier}`;
      void toast.offsetWidth;
      toast.classList.add("show");
      burstConfetti(90, 0.5); sndWin();
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(showNext, 380);
      }, 2600);
    };
    showNext();
  }

  // ---------------- normalisation ----------------
  function normalizeQuiz(raw) {
    const q = JSON.parse(JSON.stringify(raw));
    q.questions = (q.questions || []).map((item, i) => {
      const id = item.id || `q${i + 1}`;
      const difficulty = item.difficulty || "simple";
      let type = item.type || "single";
      let options = item.options ? item.options.slice() : [];
      let correct;
      if (type === "boolean") {
        options = ["True", "False"];
        const truthy = item.answer === true || item.answer === 0 ||
          String(item.answer).toLowerCase() === "true";
        correct = new Set([truthy ? 0 : 1]);
        type = "single";
      } else if (type === "multiple") {
        const ans = Array.isArray(item.answer) ? item.answer : [item.answer];
        correct = new Set(ans.map(Number));
      } else {
        type = "single";
        correct = new Set([Number(Array.isArray(item.answer) ? item.answer[0] : item.answer)]);
      }
      return {
        id, type, difficulty,
        topic: item.topic || q.topic || "",
        question: item.question || "",
        options, correct,
        explanation: item.explanation || "",
        source: item.source || ""
      };
    });
    return q;
  }

  // ---------------- loading ----------------
  async function loadIndex() {
    try {
      const res = await fetch("quizzes/index.json", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      quizIndex = await res.json();
    } catch (_) {
      quizIndex = null; // likely opened as file:// — offer file picker + demo
    }
    renderHome();
  }

  async function fetchQuiz(meta) {
    const res = await fetch(`quizzes/${meta.file}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load ${meta.file}`);
    return normalizeQuiz(await res.json());
  }

  // ---------------- views ----------------
  function show(view) {
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    $(view).classList.remove("hidden");
    window.scrollTo(0, 0);
  }

  // ---------- reusable bits ----------
  function progressBar(container, items, label) {
    container.innerHTML = "";
    const total = items.length;
    const done = items.filter((m) => progress.best[m.id] != null).length;
    const mastered = items.filter((m) => (progress.best[m.id] ?? 0) >= 90).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const wrap = el("div", "prog");
    const head = el("div", "prog-head");
    head.appendChild(el("span", null, label || "Progress"));
    head.appendChild(el("span", "muted", `${done}/${total} done${mastered ? ` · ${mastered} ⭐` : ""}`));
    wrap.appendChild(head);
    const bar = el("div", "prog-bar");
    const fill = el("div", "prog-fill");
    fill.style.width = `${pct}%`;
    if (total && done === total) fill.classList.add("complete");
    bar.appendChild(fill);
    wrap.appendChild(bar);
    container.appendChild(wrap);
  }

  function quizTile(qz) {
    const tile = el("div", "quiz-tile");
    const best = progress.best[qz.id];
    if (best != null) {
      const b = el("span", `tile-badge ${best >= 90 ? "mastered" : "done"}`, best >= 90 ? "⭐" : "✓");
      b.title = `Best: ${best}%`;
      tile.appendChild(b);
    }
    tile.appendChild(el("div", "qt-title", qz.title));
    const sub = [qz.chapter, qz.topic].filter((x) => x && x !== "Full Book" && x !== "Full Subject" && x !== "Full Chapter").join(" · ");
    if (sub) tile.appendChild(el("div", "qt-sub", sub));
    if (qz.count) tile.appendChild(el("span", "qt-count", `${qz.count} questions`));
    tile.addEventListener("click", async () => {
      try { activeQuiz = await fetchQuiz(qz); openSetup(); }
      catch (e) { alert(e.message); }
    });
    return tile;
  }

  // ---------- level 1: categories ----------
  function renderHome() {
    const wrap = $("#home-categories");
    const empty = $("#library-empty");
    wrap.innerHTML = "";
    renderAwardsStrip();
    if (!quizIndex || !(quizIndex.quizzes || []).length) {
      empty.classList.remove("hidden");
      wrap.classList.add("hidden");
      $("#home-hint").textContent = "Load a quiz JSON file, or serve this folder to see the full library.";
      return;
    }
    empty.classList.add("hidden");
    wrap.classList.remove("hidden");
    categoryList().forEach((cat) => {
      const card = el("button", "cat-card");
      card.appendChild(el("span", "cat-ico", catIcon(cat.name)));
      card.appendChild(el("span", "cat-title", cat.name === "Demo" ? "Demo Quiz" : cat.name));
      if (cat.name === "Demo") {
        card.appendChild(el("span", "cat-meta", "A quick sample to try it out"));
      } else {
        const subs = new Set(cat.items.map((m) => m.subject || "Quizzes")).size;
        card.appendChild(el("span", "cat-meta", `${subs} subject${subs > 1 ? "s" : ""} · ${cat.items.length} quizzes`));
        const done = cat.items.filter((m) => progress.best[m.id] != null).length;
        const p = Math.round((done / cat.items.length) * 100);
        const bar = el("div", "cat-bar");
        const fill = el("div", "cat-bar-fill");
        fill.style.width = `${p}%`;
        if (done === cat.items.length) fill.classList.add("complete");
        bar.appendChild(fill);
        card.appendChild(bar);
      }
      card.addEventListener("click", () => (cat.name === "Demo" ? openDemo() : openCategory(cat.name)));
      wrap.appendChild(card);
    });
  }

  async function openDemo() {
    const meta = (quizIndex && quizIndex.quizzes || []).find(isDemoMeta);
    try { activeQuiz = meta ? await fetchQuiz(meta) : normalizeQuiz(DEMO); }
    catch { activeQuiz = normalizeQuiz(DEMO); }
    openSetup();
  }

  // ---------- level 2: subjects within a category ----------
  function openCategory(name) {
    currentCat = name;
    const items = (quizIndex.quizzes || []).filter((m) => categoryOf(m) === name);
    const bySub = groupBy(items, (m) => m.subject || "Quizzes");
    $("#category-title").textContent = name;
    $("#category-sub").textContent = `${Object.keys(bySub).length} subjects · ${items.length} quizzes`;
    progressBar($("#category-progress"), items, `${name} progress`);
    const list = $("#subject-list");
    list.innerHTML = "";
    Object.keys(bySub).sort().forEach((sub) => {
      const arr = bySub[sub];
      const card = el("button", "cat-card subject-card");
      card.appendChild(el("span", "cat-ico", subjectIcon(sub)));
      card.appendChild(el("span", "cat-title", sub.replace(/-/g, " ")));
      const done = arr.filter((m) => progress.best[m.id] != null).length;
      card.appendChild(el("span", "cat-meta", `${arr.length} quiz${arr.length > 1 ? "zes" : ""} · ${done}/${arr.length} done`));
      const bar = el("div", "cat-bar");
      const fill = el("div", "cat-bar-fill");
      fill.style.width = `${Math.round((done / arr.length) * 100)}%`;
      if (done === arr.length) fill.classList.add("complete");
      bar.appendChild(fill);
      card.appendChild(bar);
      card.addEventListener("click", () => openSubject(name, sub));
      list.appendChild(card);
    });
    show("#view-category");
  }

  // ---------- level 3: quizzes within a subject ----------
  function openSubject(cat, sub) {
    currentCat = cat; currentSubject = sub;
    const items = (quizIndex.quizzes || [])
      .filter((m) => categoryOf(m) === cat && (m.subject || "Quizzes") === sub)
      .sort((a, b) => chapterNum(a) - chapterNum(b));
    $("#subject-title").textContent = sub.replace(/-/g, " ");
    $("#subject-sub").textContent = `${cat} · ${items.length} quiz${items.length > 1 ? "zes" : ""}`;
    $("#subject-back").textContent = `← ${cat}`;
    progressBar($("#subject-progress"), items, `${sub.replace(/-/g, " ")} progress`);
    const grid = $("#subject-quizzes");
    grid.innerHTML = "";
    items.forEach((qz) => grid.appendChild(quizTile(qz)));
    show("#view-subject");
  }

  // ---------- awards strip on home ----------
  function renderAwardsStrip() {
    const strip = $("#awards-strip");
    if (!strip) return;
    syncAwards();
    const earned = AWARDS.filter((a) => progress.awards[a.id]);
    if (!progress.quizzesPlayed) { strip.classList.add("hidden"); return; }
    strip.classList.remove("hidden");
    strip.innerHTML = "";
    const stat = el("div", "strip-stat");
    stat.appendChild(el("strong", null, `⭐ ${progress.totalCorrect}`));
    stat.appendChild(el("span", "muted", "correct answers"));
    strip.appendChild(stat);
    const badges = el("div", "strip-badges");
    earned.slice(-6).forEach((a) => {
      const s = el("span", `mini-badge tier-${a.tier}`, a.icon);
      s.title = `${a.name} — ${a.desc}`;
      badges.appendChild(s);
    });
    if (!earned.length) badges.appendChild(el("span", "muted", "No stamps yet — play a quiz!"));
    strip.appendChild(badges);
    const btn = el("button", "link", `🏅 ${earned.length}/${AWARDS.length}`);
    btn.addEventListener("click", () => { renderAwards(); show("#view-awards"); });
    strip.appendChild(btn);
  }

  // ---------- trophy room ----------
  function renderAwards() {
    syncAwards();
    const stats = $("#awards-stats");
    stats.innerHTML = "";
    const earned = AWARDS.filter((a) => progress.awards[a.id]).length;
    const totalQ = playableQuizzes().length;
    const doneQ = playableQuizzes().filter((m) => progress.best[m.id] != null).length;
    const cards = [
      ["⭐", progress.totalCorrect, "Correct answers"],
      ["🎮", progress.quizzesPlayed, "Quizzes played"],
      ["🌟", progress.perfectCount, "Perfect scores"],
      ["🏅", `${earned}/${AWARDS.length}`, "Stamps earned"],
      ["📚", `${doneQ}/${totalQ}`, "Quizzes tried"],
      ["🎓", masteredCount(), "Mastered (90%+)"],
    ];
    cards.forEach(([ic, val, lbl]) => {
      const c = el("div", "stat-card");
      c.appendChild(el("div", "stat-ico", ic));
      c.appendChild(el("div", "stat-val", String(val)));
      c.appendChild(el("div", "stat-lbl", lbl));
      stats.appendChild(c);
    });
    progressBar($("#awards-progress"), playableQuizzes(), "Whole library");

    const grid = $("#awards-grid");
    grid.innerHTML = "";
    AWARDS.forEach((a) => {
      const got = !!progress.awards[a.id];
      const card = el("div", `badge ${got ? `tier-${a.tier}` : "locked"}`);
      card.appendChild(el("div", "badge-ico", got ? a.icon : "🔒"));
      card.appendChild(el("div", "badge-name", a.name));
      card.appendChild(el("div", "badge-desc", a.desc));
      if (got) card.appendChild(el("div", "badge-when", new Date(progress.awards[a.id]).toLocaleDateString()));
      grid.appendChild(card);
    });
  }

  // ---------- about ----------
  function renderAbout() {
    $("#about-version").textContent = APP_VERSION;
    $("#foot-version").textContent = APP_VERSION;
    const gh = $("#about-github"), ghTxt = $("#about-github-txt");
    const em = $("#about-email"), emTxt = $("#about-email-txt");
    if (ABOUT.github) { gh.href = ABOUT.github; ghTxt.textContent = ABOUT.github.replace(/^https?:\/\//, ""); gh.classList.remove("disabled"); }
    else { gh.href = "#"; ghTxt.textContent = "GitHub — https://github.com/raayancoding"; gh.classList.add("disabled"); }
    if (ABOUT.email) { em.href = `mailto:${ABOUT.email}`; emTxt.textContent = ABOUT.email; em.classList.remove("disabled"); }
    else { em.href = "#"; emTxt.textContent = "Email — raayancoding"; em.classList.add("disabled"); }
  }

  function openSetup() {
    const q = activeQuiz;
    $("#setup-title").textContent = q.title || "Quiz";
    $("#setup-desc").textContent = q.description || "";

    // stats chips
    const diffCount = { simple: 0, tough: 0, tricky: 0 };
    const topics = new Set();
    q.questions.forEach((it) => {
      diffCount[it.difficulty] = (diffCount[it.difficulty] || 0) + 1;
      if (it.topic) topics.add(it.topic);
    });
    const stats = $("#setup-stats");
    stats.innerHTML = "";
    stats.appendChild(el("span", null, `${q.questions.length} questions`));
    Object.entries(diffCount).forEach(([d, n]) => { if (n) stats.appendChild(el("span", null, `${n} ${d}`)); });

    // count options
    const total = q.questions.length;
    const counts = [10, 20, 30, 50, 100].filter((n) => n < total);
    counts.push(total);
    const sel = $("#cfg-count");
    sel.innerHTML = "";
    counts.forEach((n) => {
      const o = el("option", null, n === total ? `All (${total})` : String(n));
      o.value = n; sel.appendChild(o);
    });
    sel.value = String(Math.min(20, total) === total ? total : (counts.find((c) => c >= 20) || total));

    // topic filter
    const topicSel = $("#cfg-topic");
    topicSel.innerHTML = '<option value="all">All topics</option>';
    [...topics].sort().forEach((t) => {
      const o = el("option", null, t); o.value = t; topicSel.appendChild(o);
    });
    topicSel.parentElement.style.display = topics.size ? "" : "none";

    renderHistory(q.id);
    show("#view-setup");
  }

  // ---------------- history (localStorage) ----------------
  const HKEY = (id) => `raayan-quizz:history:${id}`;
  function loadHistory(id) {
    try { return JSON.parse(localStorage.getItem(HKEY(id))) || null; } catch { return null; }
  }
  function saveHistory(id, entry) {
    const h = loadHistory(id) || { attempts: 0, best: 0, runs: [] };
    h.attempts += 1;
    h.best = Math.max(h.best, entry.pct);
    h.runs.unshift(entry);
    h.runs = h.runs.slice(0, 10);
    try { localStorage.setItem(HKEY(id), JSON.stringify(h)); } catch {}
  }
  function renderHistory(id) {
    const box = $("#history-box");
    const list = $("#history-list");
    const h = loadHistory(id);
    if (!h || !h.runs.length) { box.classList.add("hidden"); return; }
    box.classList.remove("hidden");
    list.innerHTML = "";
    const head = el("div", "history-row");
    head.appendChild(el("strong", null, `Best: ${h.best}%`));
    head.appendChild(el("span", "muted", `${h.attempts} attempt(s)`));
    list.appendChild(head);
    h.runs.forEach((r) => {
      const row = el("div", "history-row");
      row.appendChild(el("span", null, `${r.score}/${r.total} · ${r.pct}%`));
      row.appendChild(el("span", "muted", new Date(r.date).toLocaleString()));
      list.appendChild(row);
    });
  }

  // ---------------- session ----------------
  function buildSession(cfg) {
    let pool = activeQuiz.questions.slice();
    if (cfg.difficulty !== "all") pool = pool.filter((q) => q.difficulty === cfg.difficulty);
    if (cfg.topic !== "all") pool = pool.filter((q) => q.topic === cfg.topic);
    if (cfg.shuffle) pool = shuffle(pool);
    if (cfg.count > 0) pool = pool.slice(0, cfg.count);

    // materialise per-question option order
    const questions = pool.map((q) => {
      let order = q.options.map((_, i) => i);
      if (cfg.shuffle && q.type !== "boolean") order = shuffle(order);
      // keep True/False in natural order for boolean-derived questions
      const isTF = q.options.length === 2 && q.options[0] === "True" && q.options[1] === "False";
      if (isTF) order = [0, 1];
      return { ...q, order };
    });

    session = {
      cfg, questions, idx: 0, score: 0,
      answers: new Array(questions.length).fill(null),
      startTime: Date.now(),
      timeLimit: cfg.timer ? cfg.timerMin * 60 : 0
    };
  }

  function startSession(cfg) {
    buildSession(cfg);
    if (!session.questions.length) { alert("No questions match those filters."); return; }
    show("#view-quiz");
    startTimer();
    renderQuestion();
  }

  function startTimer() {
    const box = $("#q-timer");
    clearInterval(timerHandle);
    if (!session.timeLimit) { box.classList.add("hidden"); return; }
    box.classList.remove("hidden");
    const tick = () => {
      const left = session.timeLimit - Math.floor((Date.now() - session.startTime) / 1000);
      if (left <= 0) { box.textContent = "⏱ 0:00"; clearInterval(timerHandle); finish(); return; }
      const m = Math.floor(left / 60), s = left % 60;
      box.textContent = `⏱ ${m}:${String(s).padStart(2, "0")}`;
      box.classList.toggle("warn", left <= 10);
    };
    tick();
    timerHandle = setInterval(tick, 1000);
  }

  function renderQuestion() {
    const q = session.questions[session.idx];
    const n = session.questions.length;
    $("#progress-bar").style.width = `${(session.idx / n) * 100}%`;
    $("#q-counter").textContent = `${session.idx + 1} / ${n}`;
    $("#q-score").textContent = `⭐ ${session.score}`;

    const dtag = $("#q-difficulty");
    dtag.textContent = q.difficulty;
    dtag.dataset.d = q.difficulty;
    const ttag = $("#q-topic");
    ttag.textContent = q.topic || "";
    ttag.classList.toggle("hidden", !q.topic);

    $("#q-text").textContent = q.question;
    const isMulti = q.type === "multiple";
    const opts = $("#q-options");
    opts.innerHTML = "";
    q.order.forEach((optIdx) => {
      const row = el("label", "opt");
      const input = document.createElement("input");
      input.type = isMulti ? "checkbox" : "radio";
      input.name = "opt";
      input.value = optIdx;
      row.appendChild(input);
      row.appendChild(el("span", null, q.options[optIdx]));
      opts.appendChild(row);
    });

    const fb = $("#q-feedback");
    fb.className = "feedback hidden";
    fb.innerHTML = "";
    $("#btn-check").classList.remove("hidden");
    $("#btn-check").disabled = false;
    $("#btn-next").classList.add("hidden");
    $("#btn-next").textContent = session.idx === n - 1 ? "Finish →" : "Next →";
    mascot("start");
  }

  function selectedIndices() {
    return [...document.querySelectorAll('#q-options input:checked')].map((i) => Number(i.value));
  }

  function checkAnswer() {
    const q = session.questions[session.idx];
    const picked = new Set(selectedIndices());
    if (!picked.size) { return; }

    const correct = q.correct;
    const isRight = picked.size === correct.size && [...picked].every((i) => correct.has(i));
    session.answers[session.idx] = { picked: [...picked], right: isRight };
    if (isRight) session.score += 1;

    // lock + colour options
    document.querySelectorAll("#q-options .opt").forEach((row) => {
      const input = row.querySelector("input");
      const idx = Number(input.value);
      input.disabled = true;
      row.classList.add("locked");
      if (correct.has(idx)) row.classList.add("correct");
      else if (picked.has(idx)) row.classList.add("wrong");
    });

    const fb = $("#q-feedback");
    fb.className = `feedback ${isRight ? "right" : "wrong"}`;
    fb.innerHTML = "";
    fb.appendChild(el("span", "verdict", isRight ? "✅ Correct!" : "❌ Not quite"));
    if (session.cfg.instant || !isRight) {
      const correctText = [...correct].map((i) => q.options[i]).join(", ");
      if (!isRight) fb.appendChild(el("div", null, `Correct answer: ${correctText}`));
      if (q.explanation) fb.appendChild(el("div", "rexp", q.explanation));
    }
    fb.classList.remove("hidden");

    if (isRight) { sndRight(); mascot("right"); burstConfetti(70); }
    else { sndWrong(); mascot("wrong"); }

    $("#q-score").textContent = `⭐ ${session.score}`;
    $("#btn-check").classList.add("hidden");
    $("#btn-next").classList.remove("hidden");
  }

  function nextQuestion() {
    if (session.idx < session.questions.length - 1) {
      session.idx += 1;
      renderQuestion();
    } else {
      finish();
    }
  }

  function finish() {
    clearInterval(timerHandle);
    const total = session.questions.length;
    const answered = session.answers.filter(Boolean).length;
    const pct = Math.round((session.score / total) * 100);
    const timeSec = Math.floor((Date.now() - session.startTime) / 1000);

    $("#res-score").textContent = session.score;
    $("#res-total").textContent = total;
    $("#res-pct").textContent = `${pct}%`;
    const msgs = pct >= 90 ? "Outstanding! 🌟" : pct >= 70 ? "Great work! 👏"
      : pct >= 50 ? "Good effort — keep practising." : "Let's review and try again 💪";
    $("#res-msg").textContent = msgs;
    const badge = pct >= 90 ? "🏆" : pct >= 70 ? "🌟" : pct >= 50 ? "👍" : "🌱";
    const badgeEl = document.getElementById("res-badge");
    if (badgeEl) badgeEl.textContent = badge;
    const meta = $("#res-meta");
    meta.innerHTML = "";
    meta.appendChild(el("span", null, `Answered ${answered}/${total}`));
    meta.appendChild(el("span", null, `Time ${Math.floor(timeSec / 60)}m ${timeSec % 60}s`));
    meta.appendChild(el("span", null, session.cfg.difficulty === "all" ? "All levels" : session.cfg.difficulty));

    saveHistory(activeQuiz.id, {
      score: session.score, total, pct, date: Date.now(), timeSec
    });
    const earnedAwards = recordResult();

    if (pct >= 70) { sndWin(); burstConfetti(160, 0.5); setTimeout(() => burstConfetti(120, 0.3), 250); setTimeout(() => burstConfetti(120, 0.7), 450); }
    else if (pct >= 50) { burstConfetti(80, 0.5); }

    renderReview();
    show("#view-results");
    if (earnedAwards.length) setTimeout(() => celebrateAwards(earnedAwards), 900);
  }

  function renderReview() {
    const list = $("#review-list");
    list.innerHTML = "";
    session.questions.forEach((q, i) => {
      const ans = session.answers[i];
      const right = ans && ans.right;
      const item = el("div", `review-item ${right ? "right-item" : "wrong-item"}`);
      item.appendChild(el("div", "rq", `${i + 1}. ${q.question}`));
      const correctText = [...q.correct].map((k) => q.options[k]).join(", ");
      const yourText = ans && ans.picked.length
        ? ans.picked.map((k) => q.options[k]).join(", ") : "— (skipped)";
      const yr = el("div", `ra ${right ? "good" : "bad"}`, `Your answer: ${yourText}`);
      item.appendChild(yr);
      if (!right) item.appendChild(el("div", "ra good", `Correct: ${correctText}`));
      if (q.explanation) item.appendChild(el("div", "rexp", q.explanation));
      list.appendChild(item);
    });
  }

  // ---------------- wiring ----------------
  function readConfig() {
    return {
      count: Number($("#cfg-count").value),
      difficulty: $("#cfg-difficulty").value,
      topic: $("#cfg-topic").value,
      shuffle: $("#cfg-shuffle").checked,
      instant: $("#cfg-instant").checked,
      timer: $("#cfg-timer").checked,
      timerMin: Number($("#cfg-timer-min").value) || 10
    };
  }

  function bind() {
    function navTo(target) {
      if (target === "home") { renderHome(); show("#view-home"); }
      else if (target === "awards") { renderAwards(); show("#view-awards"); }
      else if (target === "about") { renderAbout(); show("#view-about"); }
      else show(`#view-${target}`);
    }
    document.querySelectorAll("[data-nav]").forEach((b) =>
      b.addEventListener("click", () => navTo(b.dataset.nav)));

    const subjBack = document.getElementById("subject-back");
    if (subjBack) subjBack.addEventListener("click", () => (currentCat ? openCategory(currentCat) : navTo("home")));

    const resetBtn = document.getElementById("btn-reset-progress");
    if (resetBtn) resetBtn.addEventListener("click", () => {
      if (!confirm("Reset all your trophies, stamps and best scores on this device? This can't be undone.")) return;
      progress = normalizeProgress({});
      saveProgress();
      renderAwards();
    });

    const soundBtn = document.getElementById("btn-sound");
    if (soundBtn) {
      soundBtn.textContent = soundOn ? "🔊" : "🔇";
      soundBtn.setAttribute("aria-pressed", String(soundOn));
      soundBtn.addEventListener("click", () => {
        soundOn = !soundOn;
        soundBtn.textContent = soundOn ? "🔊" : "🔇";
        soundBtn.setAttribute("aria-pressed", String(soundOn));
        try { localStorage.setItem("raayan-quizz:sound", soundOn ? "on" : "off"); } catch {}
        if (soundOn) sndClick();
      });
    }

    $("#setup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      startSession(readConfig());
    });
    $("#btn-check").addEventListener("click", checkAnswer);
    $("#btn-next").addEventListener("click", nextQuestion);
    $("#btn-quit").addEventListener("click", () => { clearInterval(timerHandle); show("#view-home"); });
    $("#btn-retry").addEventListener("click", openSetup);

    $("#file-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          activeQuiz = normalizeQuiz(JSON.parse(reader.result));
          openSetup();
        } catch (err) { alert("Invalid quiz JSON: " + err.message); }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    $("#try-demo").addEventListener("click", () => {
      activeQuiz = normalizeQuiz(DEMO);
      openSetup();
    });

    // keyboard: Enter = check/next
    document.addEventListener("keydown", (e) => {
      if ($("#view-quiz").classList.contains("hidden")) return;
      if (e.key === "Enter") {
        if (!$("#btn-check").classList.contains("hidden")) checkAnswer();
        else if (!$("#btn-next").classList.contains("hidden")) nextQuestion();
      }
    });
  }

  bind();
  const fv = document.getElementById("foot-version");
  if (fv) fv.textContent = APP_VERSION;
  loadIndex();
})();
