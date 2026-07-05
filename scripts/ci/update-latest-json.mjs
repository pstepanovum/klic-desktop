// Merge a Windows entry into the auto-updater feed (latest.json).
//
// The macOS .dmg + .app.tar.gz + darwin-aarch64 entry are built locally on a Mac
// and uploaded to the release. This script runs in CI after the Windows build and
// ADDS the windows-x86_64 entry to the SAME latest.json (downloaded from the
// release first), so both platforms share one feed. It never removes darwin.
//
// Env in: WIN_SIG (contents of the NSIS .sig), WIN_URL (download URL of the
// installer), APP_VERSION (from package.json), LATEST_JSON (path, default latest.json).
import { readFileSync, writeFileSync } from 'node:fs';

const path = process.env.LATEST_JSON || 'latest.json';
const { WIN_SIG, WIN_URL, APP_VERSION } = process.env;

if (!WIN_SIG || !WIN_URL) {
  console.error('WIN_SIG and WIN_URL are required');
  process.exit(1);
}

let feed = {};
try {
  feed = JSON.parse(readFileSync(path, 'utf8') || '{}');
} catch {
  console.warn(`No readable ${path} — starting a fresh feed (darwin will be absent until the Mac re-uploads).`);
}

if (APP_VERSION) feed.version = APP_VERSION;
feed.platforms = feed.platforms || {};
feed.platforms['windows-x86_64'] = { signature: WIN_SIG, url: WIN_URL };

writeFileSync(path, JSON.stringify(feed, null, 2));
console.log(`Updated ${path} — platforms: ${Object.keys(feed.platforms).join(', ')}`);
