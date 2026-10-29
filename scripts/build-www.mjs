#!/usr/bin/env node
/* Assemble the web app into www/ for Capacitor (and any static host).
 * Copies only runtime files; skips node_modules, android/, books-private/, docs, scripts.
 * Books (NCERT page images, ~150 MB) are skipped unless --with-books; the app then streams
 * them from BOOKS_REMOTE (GitHub Pages) when the local folder is missing.
 *   node scripts/build-www.mjs [--with-books] [--out www] */
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const withBooks = args.includes("--with-books");
const out = resolve(root, args[args.indexOf("--out") + 1] && args.includes("--out") ? args[args.indexOf("--out") + 1] : "www");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const FILES = ["index.html", "favicon.svg", "logo.png", "manifest.webmanifest", "sw.js"];
const DIRS = ["css", "js", "vendor", "quizzes", "schema"].concat(withBooks ? ["books"] : []);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of FILES) if (existsSync(resolve(root, f))) cpSync(resolve(root, f), resolve(out, f));
for (const d of DIRS) if (existsSync(resolve(root, d))) cpSync(resolve(root, d), resolve(out, d), { recursive: true, filter: (s) => !/\.DS_Store$|-tips\.md$/.test(s) });

// single source of truth for the version: package.json
const stamp = (file, re, rep) => { const p = resolve(out, file); if (!existsSync(p)) return; writeFileSync(p, readFileSync(p, "utf8").replace(re, rep)); };
stamp("js/app.js", /const APP_VERSION = "[^"]+"/, `const APP_VERSION = "${pkg.version}"`);
stamp("sw.js", /const VERSION = "[^"]+"/, `const VERSION = "rq-v${pkg.version}"`);
stamp("index.html", /id="about-version">[^<]*</g, `id="about-version">${pkg.version}<`);
stamp("index.html", /id="foot-version">[^<]*</g, `id="foot-version">${pkg.version}<`);
console.log(`www built at ${out} (v${pkg.version}, books ${withBooks ? "bundled" : "remote"})`);
