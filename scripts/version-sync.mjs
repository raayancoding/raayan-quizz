#!/usr/bin/env node
/* Write package.json version into js/app.js, sw.js and index.html (keeps the repo consistent
 * with what build-www stamps). Run after `npm version x.y.z --no-git-tag-version`. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const v = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version;
const edit = (f, re, rep) => { const p = resolve(root, f); writeFileSync(p, readFileSync(p, "utf8").replace(re, rep)); };
edit("js/app.js", /const APP_VERSION = "[^"]+"/, `const APP_VERSION = "${v}"`);
edit("sw.js", /const VERSION = "[^"]+"/, `const VERSION = "rq-v${v}"`);
edit("index.html", /id="about-version">[^<]*</g, `id="about-version">${v}<`);
edit("index.html", /id="foot-version">[^<]*</g, `id="foot-version">${v}<`);
console.log(`synced version ${v}`);
