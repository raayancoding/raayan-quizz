#!/usr/bin/env node
/* CI checks (no framework): JS syntax, JSON validity, quiz index <-> files, quiz schema
 * basics, answer bias thresholds (same rules as lighthouse/validate_quiz.py). Exit 1 on failure. */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warn = [];
const ok = (m) => console.log("  ✓", m);

// 1. JS syntax
for (const f of ["js/store.js", "js/app.js", "js/reader.js", "js/game.js", "js/practice.js", "sw.js"]) {
  try { execFileSync(process.execPath, ["--check", resolve(root, f)], { stdio: "pipe" }); ok(f); }
  catch (e) { errors.push(`${f}: ${e.stderr}`); }
}

// 2. JSON files
for (const f of ["manifest.webmanifest", "schema/quiz.schema.json", "quizzes/index.json", "capacitor.config.json", "package.json"]) {
  if (!existsSync(resolve(root, f))) continue;
  try { JSON.parse(readFileSync(resolve(root, f), "utf8")); ok(f); } catch (e) { errors.push(`${f}: invalid JSON (${e.message})`); }
}

// 3. quizzes
const idx = JSON.parse(readFileSync(resolve(root, "quizzes/index.json"), "utf8"));
const seen = new Set();
let totalQ = 0, longest = 0, single = 0, trues = 0, bools = 0;
for (const m of idx.quizzes) {
  const file = resolve(root, "quizzes", m.file);
  if (seen.has(m.id)) errors.push(`index: duplicate id ${m.id}`);
  seen.add(m.id);
  if (!existsSync(file)) { errors.push(`index: missing file ${m.file}`); continue; }
  let q;
  try { q = JSON.parse(readFileSync(file, "utf8")); } catch (e) { errors.push(`${m.file}: invalid JSON`); continue; }
  if (q.id !== m.id) errors.push(`${m.file}: id ${q.id} != index ${m.id}`);
  if (q.questions.length !== m.count) warn.push(`${m.file}: count ${q.questions.length} != index ${m.count}`);
  const ids = new Set();
  let qLongest = 0, qSingle = 0, qTrue = 0, qBool = 0;
  q.questions.forEach((it, i) => {
    const tag = `${m.file} Q${i + 1}`;
    if (ids.has(it.id)) errors.push(`${tag}: duplicate id ${it.id}`); ids.add(it.id);
    if (!["single", "multiple", "boolean"].includes(it.type)) errors.push(`${tag}: bad type`);
    if (!it.question || !it.explanation) errors.push(`${tag}: missing question/explanation`);
    if (it.type === "boolean") { if (typeof it.answer !== "boolean") errors.push(`${tag}: boolean answer`); qBool++; if (it.answer) qTrue++; }
    else {
      if (!Array.isArray(it.options) || it.options.length < 2) { errors.push(`${tag}: options`); return; }
      const a = Array.isArray(it.answer) ? it.answer : [it.answer];
      if (it.type === "single" && a.length !== 1) errors.push(`${tag}: single needs 1 answer`);
      a.forEach((k) => { if (!Number.isInteger(k) || k < 0 || k >= it.options.length) errors.push(`${tag}: answer ${k} out of range`); });
      if (it.type === "single") {
        qSingle++;
        const lens = it.options.map((o) => String(o).length), mx = Math.max(...lens);
        if (lens[a[0]] === mx && lens.filter((l) => l === mx).length === 1 && mx > Math.min(...lens) * 1.3) qLongest++;
      }
    }
    if (it.image && !/^(https?:|data:)/.test(it.image) && !existsSync(join(dirname(file), it.image))) errors.push(`${tag}: image not found ${it.image}`);
  });
  totalQ += q.questions.length; longest += qLongest; single += qSingle; trues += qTrue; bools += qBool;
  // bias gate only for quizzes authored after the rule existed (sourceDir present)
  if (q.sourceDir && qSingle >= 12 && qLongest / qSingle > 0.35) errors.push(`${m.file}: longest-option bias ${Math.round(100 * qLongest / qSingle)}%`);
  if (q.sourceDir && qBool >= 12 && (qTrue / qBool < 0.35 || qTrue / qBool > 0.65)) errors.push(`${m.file}: boolean True ${Math.round(100 * qTrue / qBool)}%`);
}
ok(`${idx.quizzes.length} quizzes, ${totalQ} questions · longest-option ${Math.round(100 * longest / single)}% · True ${Math.round(100 * trues / bools)}%`);

// 4. book index (if present) points at existing files
for (const r of ["books"]) {
  const p = resolve(root, r, "index.json");
  if (!existsSync(p)) continue;
  const b = JSON.parse(readFileSync(p, "utf8"));
  const bad = b.books.filter((x) => !existsSync(resolve(root, r, x.dir, "book.json")) || !existsSync(resolve(root, r, x.dir, "p", "001.webp")));
  if (bad.length) errors.push(`${r}/index.json: ${bad.length} book(s) missing pages: ${bad.slice(0, 3).map((x) => x.dir).join(", ")}`);
  else ok(`${r}: ${b.books.length} books`);
}

// 5. versions in sync (package.json is the source; build-www stamps the rest, but keep repo tidy)
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const appV = /const APP_VERSION = "([^"]+)"/.exec(readFileSync(resolve(root, "js/app.js"), "utf8"))?.[1];
if (appV !== pkg.version) warn.push(`js/app.js APP_VERSION ${appV} != package.json ${pkg.version} (build stamps it; run npm run version:sync to align)`);

warn.forEach((w) => console.log("  !", w));
if (errors.length) { console.error(`\n${errors.length} error(s):`); errors.slice(0, 40).forEach((e) => console.error("  ✗", e)); process.exit(1); }
console.log(`\nAll checks passed (${warn.length} warning(s)).`);
