/* Raayan Quizz — smarter practice: mistake bank (spaced repetition), challenge mode,
 * parent view (long-press logo), export/import progress. */
(() => {
  "use strict";
  const RQ = window.RQ;
  const { $, el } = RQ;

  // ---------------- mistake bank ----------------
  // progress.mistakes[quizId] = { [qid]: { n: wrongCount, due: ts, box: 0..3, subject, title } }
  const SPACING = [1, 3, 7, 21].map((d) => d * 86400000);
  function bank() { const p = RQ.progress; p.mistakes = p.mistakes || {}; return p.mistakes; }
  function dueMistakes(subjectFilter) {
    const out = [];
    const now = Date.now();
    Object.entries(bank()).forEach(([quizId, qs]) => Object.entries(qs).forEach(([qid, m]) => {
      if (subjectFilter && m.subject !== subjectFilter) return;
      out.push({ quizId, qid, ...m, due: m.due || 0, overdue: now - (m.due || 0) });
    }));
    return out.sort((a, b) => b.overdue - a.overdue);
  }
  const countMistakes = (s) => Object.values(bank()).reduce((n, qs) => n + Object.values(qs).filter((m) => !s || m.subject === s).length, 0);
  const dueCount = (s) => dueMistakes(s).filter((m) => m.due <= Date.now()).length;

  RQ.hooks.onAnswer.push((q, right, session) => {
    const quiz = RQ.activeQuiz;
    if (!quiz || !quiz.id || quiz.subject === "A Demo") return;
    const b = bank();
    const inFix = session.cfg && session.cfg.fixMode;
    const src = inFix && session.cfg.srcOf ? session.cfg.srcOf[q.id] : quiz.id;
    const qid = inFix ? String(q.id).split("::").pop() : q.id;
    const entry = (b[src] = b[src] || {});
    if (!right) {
      const m = entry[qid] || { n: 0, box: 0, subject: inFix ? session.cfg.subjectOf[q.id] : quiz.subject, title: quiz.title };
      m.n += 1; m.box = 0; m.due = Date.now() + SPACING[0]; m.last = Date.now();
      entry[qid] = m;
    } else if (entry[qid]) {
      const m = entry[qid];
      m.box = (m.box | 0) + 1;
      if (m.box >= SPACING.length) delete entry[qid];     // mastered: 4 correct in a row over 1+3+7+21 days
      else m.due = Date.now() + SPACING[m.box];
      if (!Object.keys(entry).length) delete b[src];
    }
    RQ.saveProgress();
  });

  // "Fix my mistakes" — builds a synthetic quiz from due items across quizzes of one subject
  async function startFix(subject) {
    const items = dueMistakes(subject);
    const due = items.filter((m) => m.due <= Date.now());
    const pick = (due.length ? due : items).slice(0, 20);
    if (!pick.length) { alert("No mistakes to fix — nice!"); return; }
    const byQuiz = {};
    pick.forEach((m) => (byQuiz[m.quizId] = byQuiz[m.quizId] || []).push(m.qid));
    const metas = (RQ.quizIndex && RQ.quizIndex.quizzes) || [];
    const questions = [], srcOf = {}, subjectOf = {};
    for (const [quizId, qids] of Object.entries(byQuiz)) {
      const meta = metas.find((x) => x.id === quizId);
      if (!meta) continue;
      try {
        const qz = await RQ.fetchQuiz(meta);
        qz.questions.filter((q) => qids.includes(q.id)).forEach((q) => { const sid = `${quizId}::${q.id}`; questions.push({ ...q, id: sid }); srcOf[sid] = quizId; subjectOf[sid] = meta.subject; });
      } catch { /* skip missing quiz */ }
    }
    if (!questions.length) { alert("Couldn't load those questions."); return; }
    RQ.activeQuiz = { id: `fix-${subject || "all"}`, title: `🩹 Fix my mistakes${subject ? " · " + subject.replace(/-/g, " ") : ""}`, subject: subject || "Mixed", questions, fixMode: true };
    RQ.startSession({ count: questions.length, difficulty: "all", topic: "all", shuffle: true, instant: true, timer: false, timerMin: 10, fixMode: true, srcOf, subjectOf, noRecord: true });
  }

  // normalise synthetic ids back to original when recording mistakes in fix mode (handled via srcOf),
  // and keep fix sessions out of best-score/history: app checks cfg.noRecord
  function renderFixCard() {
    let box = $("#fix-card");
    if (!box) { box = el("div", "fix-card hidden"); box.id = "fix-card"; $("#home-categories").before(box); }
    const total = countMistakes(), due = dueCount();
    if (!total) { box.classList.add("hidden"); return; }
    box.classList.remove("hidden");
    box.innerHTML = "";
    box.appendChild(el("span", "fix-ico", "🩹"));
    const t = el("div", "fix-txt");
    t.appendChild(el("strong", null, due ? `${due} mistake${due > 1 ? "s" : ""} ready to fix today` : `${total} mistake${total > 1 ? "s" : ""} in your bank`));
    t.appendChild(el("span", "muted", due ? "Beat them now and they come back less often." : "Nothing due right now — come back tomorrow."));
    box.appendChild(t);
    const b = el("button", "primary", "Fix my mistakes");
    b.addEventListener("click", () => startFix(null));
    box.appendChild(b);
  }
  RQ.hooks.onHome.push(renderFixCard);

  // subject-level fix button on the trail header
  RQ.hooks.onSubject.push((cat, sub) => {
    let b = $("#subject-fix");
    if (!b) { b = el("button", "ghost-btn subject-fix"); b.id = "subject-fix"; $("#subject-progress").after(b); }
    const n = countMistakes(sub);
    b.classList.toggle("hidden", !n);
    b.textContent = `🩹 Fix my ${n} ${sub.replace(/-/g, " ")} mistake${n > 1 ? "s" : ""}`;
    b.onclick = () => startFix(sub);
  });

  // ---------------- challenge mode (60 s blitz, 3 lives, combo) ----------------
  function startChallenge() {
    const q = RQ.activeQuiz;
    if (!q) return;
    RQ.startSession({ count: q.questions.length, difficulty: "all", topic: "all", shuffle: true, instant: false, timer: true, timerMin: 1,
      challenge: true, lives: 3, noRecord: false, label: "⚡ Challenge" });
  }
  RQ.hooks.onAnswer.push((q, right, session) => {
    if (!session.cfg.challenge) return;
    session.combo = right ? (session.combo | 0) + 1 : 0;
    if (!right) session.lives -= 1;
    if (right && session.combo >= 2) { session.score += Math.min(3, session.combo - 1); } // combo bonus points
    const hud = $("#ch-hud");
    if (hud) hud.textContent = `${"❤️".repeat(Math.max(0, session.lives))}${"🖤".repeat(3 - Math.max(0, session.lives))} · 🔥x${session.combo}`;
    $("#q-score").textContent = `⭐ ${session.score}`;
    // auto-advance quickly; end on 0 lives
    setTimeout(() => {
      if (RQ.session !== session) return;
      if (session.lives <= 0) RQ.finish(); else $("#btn-next").click();
    }, right ? 450 : 900);
  });

  // ---------------- parent view ----------------
  function parentView() {
    const p = RQ.progress, g = (RQ.game && RQ.game.g()) || {};
    const metas = (RQ.quizIndex && RQ.quizIndex.quizzes) || [];
    const bySub = {};
    metas.forEach((m) => { if (RQ.isDemoMeta(m)) return; const s = m.subject; bySub[s] = bySub[s] || { n: 0, done: 0, best: [], mistakes: countMistakes(s) }; bySub[s].n++; if (p.best[m.id] != null) { bySub[s].done++; bySub[s].best.push(p.best[m.id]); } });
    const hist = metas.map((m) => ({ m, h: RQ.loadHistory(m.id) })).filter((x) => x.h && x.h.runs.length);
    const time = hist.reduce((s, x) => s + x.h.runs.reduce((a, r) => a + (r.timeSec || 0), 0), 0);
    const weakTopics = {};
    Object.values(bank()).forEach((qs) => Object.values(qs).forEach((m) => { weakTopics[m.subject] = (weakTopics[m.subject] || 0) + m.n; }));

    let d = $("#parent-dlg"); if (d) d.remove();
    d = el("div", "pdlg"); d.id = "parent-dlg";
    const card = el("div", "card pop pdlg-card");
    card.appendChild(el("h2", null, "👨‍👩‍👧 Parent view"));
    card.appendChild(el("p", "muted", "Long-press the logo to open this. Everything is stored only on this device."));
    const stats = el("div", "stat-grid");
    [["⭐", `${p.totalCorrect}/${p.totalAnswered}`, "Correct / answered"], ["🎯", p.totalAnswered ? `${Math.round((100 * p.totalCorrect) / p.totalAnswered)}%` : "—", "Overall accuracy"],
     ["⏱️", `${Math.round(time / 60)} min`, "Time in quizzes"], ["🔥", `${g.streak || 0} (best ${g.bestStreak || 0})`, "Day streak"],
     ["📖", `${p.pagesRead} pages · ${p.booksRead} books`, "Reading"], ["🩹", String(countMistakes()), "Open mistakes"]]
      .forEach(([i, v, l]) => { const c = el("div", "stat-card"); c.appendChild(el("div", "stat-ico", i)); c.appendChild(el("div", "stat-val", v)); c.appendChild(el("div", "stat-lbl", l)); stats.appendChild(c); });
    card.appendChild(stats);
    card.appendChild(el("h3", "section-h", "Per subject"));
    const tbl = el("table", "ptable");
    tbl.innerHTML = "<thead><tr><th>Subject</th><th>Quizzes</th><th>Avg best</th><th>Mistakes</th></tr></thead>";
    const tb = el("tbody");
    Object.keys(bySub).sort().forEach((s) => {
      const x = bySub[s];
      const avg = x.best.length ? Math.round(x.best.reduce((a, b) => a + b, 0) / x.best.length) : null;
      const tr = el("tr");
      tr.innerHTML = `<td>${s.replace(/-/g, " ")}</td><td>${x.done}/${x.n}</td><td>${avg == null ? "—" : avg + "%"}</td><td>${x.mistakes}</td>`;
      if (avg != null && avg < 60) tr.classList.add("weak");
      tb.appendChild(tr);
    });
    tbl.appendChild(tb); card.appendChild(tbl);
    const weakest = Object.entries(weakTopics).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (weakest.length) card.appendChild(el("p", null, `Needs most practice: ${weakest.map(([s, n]) => `${s.replace(/-/g, " ")} (${n} wrong)`).join(", ")}`));
    card.appendChild(el("h3", "section-h", "Recent attempts"));
    const list = el("div", "plist");
    hist.flatMap((x) => x.h.runs.map((r) => ({ r, m: x.m }))).sort((a, b) => b.r.date - a.r.date).slice(0, 12)
      .forEach(({ r, m }) => { const row = el("div", "history-row"); row.appendChild(el("span", null, `${m.title} — ${r.score}/${r.total} (${r.pct}%)`)); row.appendChild(el("span", "muted", new Date(r.date).toLocaleString())); list.appendChild(row); });
    if (!list.children.length) list.appendChild(el("p", "muted", "No attempts yet."));
    card.appendChild(list);

    const acts = el("div", "results-actions");
    const ex = el("button", "primary", "⬇️ Export progress");
    ex.addEventListener("click", exportProgress);
    const im = el("label", "ghost-btn", "⬆️ Import progress");
    const fi = document.createElement("input"); fi.type = "file"; fi.accept = "application/json,.json"; fi.hidden = true;
    fi.addEventListener("change", (e) => importProgress(e.target.files[0]));
    im.appendChild(fi);
    const cl = el("button", "ghost-btn", "Close");
    cl.addEventListener("click", () => d.remove());
    acts.append(ex, im, cl);
    card.appendChild(acts);
    d.appendChild(card);
    document.body.appendChild(d);
  }

  // ---------------- export / import ----------------
  function snapshot() {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith("raayan-quizz:")) ls[k] = localStorage.getItem(k); }
    return { app: "raayan-quizz", version: RQ.APP_VERSION, exportedAt: new Date().toISOString(), data: ls };
  }
  function exportProgress() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `raayan-quizz-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function importProgress(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (j.app !== "raayan-quizz" || !j.data) throw new Error("not a Raayan Quizz export");
        if (!confirm(`Import progress from ${j.exportedAt ? j.exportedAt.slice(0, 10) : "file"}? This replaces what's on this device.`)) return;
        Object.keys(localStorage).filter((k) => k.startsWith("raayan-quizz:")).forEach((k) => localStorage.removeItem(k));
        Object.entries(j.data).forEach(([k, v]) => localStorage.setItem(k, v));
        location.reload();
      } catch (e) { alert("Import failed: " + e.message); }
    };
    r.readAsText(file);
  }

  // ---------------- wiring ----------------
  function bind() {
    // long-press (700 ms) on the logo -> parent view
    const brand = document.querySelector(".brand");
    let t = null;
    const start = () => { t = setTimeout(() => { t = null; parentView(); }, 700); };
    const cancel = () => { if (t) { clearTimeout(t); t = null; } };
    brand.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => brand.addEventListener(ev, cancel));
    brand.addEventListener("contextmenu", (e) => { e.preventDefault(); parentView(); });

    // challenge button on setup
    const btn = el("button", "ghost-btn challenge-btn", "⚡ 60-second Challenge");
    btn.type = "button"; btn.id = "btn-challenge";
    $("#setup-form button[type=submit]").after(btn);
    btn.addEventListener("click", startChallenge);
  }

  RQ.practice = { startFix, startChallenge, parentView, exportProgress, countMistakes, dueCount };
  bind();
})();
