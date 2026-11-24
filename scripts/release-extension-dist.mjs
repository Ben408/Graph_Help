#!/usr/bin/env node
/**
 * Zip `extension-dist/` and publish a GitHub Release to the distribution repo.
 *
 * Usage:
 *   npm run extension:release              # zip current extension-dist/ and publish release
 *   npm run extension:release -- --zip-only # only build the zip locally (no GitHub upload)
 *
 * Env overrides:
 *   EXTENSION_RELEASE_REPO (default: Ben408/Smart-Help-Extension)
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "extension-dist");
const outDir = path.join(root, "dist-releases");
const distMetaPath = path.join(root, "extension", "distribution.json");
const manifestPath = path.join(distDir, "manifest.json");

const zipOnly = process.argv.includes("--zip-only");
const repo = process.env.EXTENSION_RELEASE_REPO || "Ben408/Smart-Help-Extension";

if (!fs.existsSync(manifestPath)) {
  console.error("extension-dist/manifest.json not found. Run `npm run extension:dist` first.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const distMeta = fs.existsSync(distMetaPath)
  ? JSON.parse(fs.readFileSync(distMetaPath, "utf8"))
  : { distribution: 0, version: manifest.version };

const version = manifest.version || distMeta.version;
const distribution = distMeta.distribution ?? 0;
const tag = `v${version}`;
const zipName = `smart-help-extension-${tag}-dist${distribution}.zip`;
const zipPath = path.join(outDir, zipName);

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

// Zip contents of extension-dist/ (excluding any stray .zip files).
if (process.platform === "win32") {
  const psScript = [
    "$ErrorActionPreference = 'Stop'",
    `$src = '${distDir.replace(/'/g, "''")}'`,
    `$dst = '${zipPath.replace(/'/g, "''")}'`,
    "$items = Get-ChildItem -Path $src -Exclude '*.zip'",
    "Compress-Archive -Path $items.FullName -DestinationPath $dst -Force",
  ].join("; ");
  execFileSync("powershell", ["-NoProfile", "-Command", psScript], { stdio: "inherit" });
} else {
  execFileSync("zip", ["-r", zipPath, ".", "-x", "*.zip"], { cwd: distDir, stdio: "inherit" });
}

console.log(`Built ${zipPath}`);

if (zipOnly) {
  process.exit(0);
}

const notes = [
  `## Smart Help for Sage — ${tag} (Distribution #${distribution})`,
  "",
  "### Install in Chrome",
  `1. Download \`${zipName}\` from **Assets** below and unzip it to a folder on your computer.`,
  "2. Open `chrome://extensions` in Chrome and turn on **Developer mode** (top right).",
  "3. Click **Load unpacked** and select the unzipped folder (the folder containing `manifest.json`).",
  "4. Open Sage Intacct or Sage Planning and click the **Smart Help for Sage** icon in the Chrome toolbar.",
  "",
  `Built from \`Ben408/Graph_Help\` (\`extension-dist/\`, manifest version \`${version}\`).`,
].join("\n");

// Check if release already exists; if so, upload/clobber asset, otherwise create release.
let exists = false;
try {
  execFileSync("gh", ["release", "view", tag, "--repo", repo], { stdio: "ignore" });
  exists = true;
} catch {
  exists = false;
}

if (exists) {
  console.log(`Release ${tag} already exists on ${repo}; uploading updated asset...`);
  execFileSync("gh", ["release", "upload", tag, zipPath, "--clobber", "--repo", repo], {
    stdio: "inherit",
  });
} else {
  console.log(`Creating release ${tag} on ${repo}...`);
  execFileSync(
    "gh",
    [
      "release",
      "create",
      tag,
      zipPath,
      "--repo",
      repo,
      "--title",
      `Smart Help for Sage ${tag} (Dist #${distribution})`,
      "--notes",
      notes,
    ],
    { stdio: "inherit" }
  );
}

console.log(`Published ${zipName} to https://github.com/${repo}/releases/tag/${tag}`);
