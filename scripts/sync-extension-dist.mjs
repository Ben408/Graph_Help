#!/usr/bin/env node
/**
 * Rebuild extension-dist from the local-use extension/, bumping the shared
 * distribution number. Preserves hosted defaults (Vercel UI base + hosts).
 *
 * Usage:
 *   node scripts/sync-extension-dist.mjs          # bump + sync
 *   node scripts/sync-extension-dist.mjs --no-bump  # sync only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "extension");
const distDir = path.join(root, "extension-dist");
const distMetaPath = path.join(srcDir, "distribution.json");

const LOCAL_UI = "http://127.0.0.1:3002";
const LOCAL_UI_ALT = "http://localhost:3002";
const HOSTED_UI = "https://v0-concept-graph-demo.vercel.app";

const SHARED_FILES = [
  "content.js",
  "sidepanel.js",
  "sidepanel.html",
  "background.js",
  "options.js",
  "options.html",
];

const noBump = process.argv.includes("--no-bump");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rewriteHosted(text) {
  return text
    .replaceAll(LOCAL_UI, HOSTED_UI)
    .replaceAll(LOCAL_UI_ALT, HOSTED_UI);
}

function copyShared(version) {
  ensureDir(distDir);
  for (const name of SHARED_FILES) {
    const from = path.join(srcDir, name);
    const to = path.join(distDir, name);
    if (!fs.existsSync(from)) {
      console.warn(`skip missing ${name}`);
      continue;
    }
    let body = fs.readFileSync(from, "utf8");
    body = rewriteHosted(body);
    fs.writeFileSync(to, body, "utf8");
  }

  // Icons: copy if present on either side
  const iconSrc = path.join(srcDir, "icons");
  const iconDist = path.join(distDir, "icons");
  if (fs.existsSync(iconSrc)) {
    ensureDir(iconDist);
    for (const f of fs.readdirSync(iconSrc)) {
      fs.copyFileSync(path.join(iconSrc, f), path.join(iconDist, f));
    }
  }
}

function writeLocalManifest(meta) {
  const manifest = readJson(path.join(srcDir, "manifest.json"));
  manifest.version = meta.version;
  manifest.description =
    "Context-aware Smart Help panel beside Intacct. Copilot stays; this replaces Help on this page. Field ? help stays native.";
  manifest.host_permissions = [
    "https://*.intacct.com/*",
    "http://127.0.0.1:3002/*",
    "http://localhost:3002/*",
  ];
  writeJson(path.join(srcDir, "manifest.json"), manifest);
}

function writeDistManifest(meta) {
  const local = readJson(path.join(srcDir, "manifest.json"));
  const dist = {
    ...local,
    version: meta.version,
    description:
      "Context-aware Smart Help beside Intacct (hosted UI). Copilot stays untouched. Field ? help stays native.",
    host_permissions: [
      "https://*.intacct.com/*",
      "https://v0-concept-graph-demo.vercel.app/*",
      "https://*.vercel.app/*",
    ],
  };
  writeJson(path.join(distDir, "manifest.json"), dist);
}

function updateReadme(meta) {
  const readmePath = path.join(distDir, "readme.txt");
  if (!fs.existsSync(readmePath)) return;
  let text = fs.readFileSync(readmePath, "utf8");
  const header = `Smart Help for Sage Intacct — distribution build ${meta.distribution} (v${meta.version})`;
  text = text.replace(
    /^Smart Help for Sage Intacct — distribution build.*$/m,
    header
  );
  if (!/^Distribution:\s*\d+/m.test(text)) {
    text = text.replace(
      /^(=======+\s*\n)/m,
      `$1Distribution: ${meta.distribution}\nVersion: ${meta.version}\n\n`
    );
  } else {
    text = text
      .replace(/^Distribution:\s*\d+/m, `Distribution: ${meta.distribution}`)
      .replace(/^Version:\s*.+$/m, `Version: ${meta.version}`);
  }
  fs.writeFileSync(readmePath, text, "utf8");
}

function main() {
  if (!fs.existsSync(distMetaPath)) {
    writeJson(distMetaPath, {
      distribution: 1,
      version: "0.3.1",
      note: "Bump via npm run extension:dist",
    });
  }

  const meta = readJson(distMetaPath);
  if (!noBump) {
    meta.distribution = Number(meta.distribution || 0) + 1;
  }
  meta.version = `0.3.${meta.distribution}`;
  meta.updatedAt = new Date().toISOString();
  writeJson(distMetaPath, meta);

  copyShared(meta.version);
  writeLocalManifest(meta);
  writeDistManifest(meta);
  updateReadme(meta);

  console.log(
    `extension sync OK — distribution ${meta.distribution} (v${meta.version})${
      noBump ? " [no bump]" : ""
    }`
  );
  console.log(`  local: ${path.relative(root, srcDir)}`);
  console.log(`  dist:  ${path.relative(root, distDir)}`);
}

main();
