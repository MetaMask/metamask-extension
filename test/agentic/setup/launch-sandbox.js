#!/usr/bin/env node
// launch-sandbox.js — Launch isolated Chromium with MetaMask extension + wallet.
//
// Standalone (no farmslot dependency). All knobs are env vars so each worktree
// or developer can customize without editing this file.
//
// Required:
//   AGENT_DIR          Directory for runtime state (PIDs, fixture, profile).
//   PROFILE_DIR        Chrome user-data-dir (idempotent across runs).
//   EXTENSION_DIR      Built extension (typically <repo>/dist/chrome).
//   WALLET_FIXTURE     Path to wallet-fixture.json (template at
//                      test/agentic/wallet-fixture.example.json).
//
// Optional:
//   CDP_PORT           Remote debugging port (default 9222).
//   SANDBOX_LABEL      Window-title prefix (default "agentic").
//   LAUNCH_MODE        "fullscreen" (default) or "sidepanel".
//   SHOW_LANDING       "true" to render slot-info dapp (default false).
//   DAPP_PORT          Landing-page port (default CDP_PORT + 1000).
//   CHROME_BIN         Override Chromium binary (default Playwright bundled).
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, execFileSync } = require('child_process');

const env = process.env;
const required = ['AGENT_DIR', 'PROFILE_DIR', 'EXTENSION_DIR', 'WALLET_FIXTURE'];
for (const key of required) {
  if (!env[key]) {
    console.error(`FAIL: ${key} env var required`);
    process.exit(1);
  }
}

const AGENT_DIR = env.AGENT_DIR;
const PROFILE_DIR = env.PROFILE_DIR;
const EXTENSION_DIR = env.EXTENSION_DIR;
const WALLET_FIXTURE = env.WALLET_FIXTURE;
const CDP_PORT = env.CDP_PORT || '9222';
const SANDBOX_LABEL = env.SANDBOX_LABEL || 'agentic';
const LAUNCH_MODE = env.LAUNCH_MODE || 'fullscreen';
const SHOW_LANDING = env.SHOW_LANDING === 'true';
const DAPP_PORT = parseInt(env.DAPP_PORT || String(parseInt(CDP_PORT, 10) + 1000), 10);

if (!['fullscreen', 'sidepanel'].includes(LAUNCH_MODE)) {
  console.error(`FAIL: LAUNCH_MODE must be 'fullscreen' or 'sidepanel', got '${LAUNCH_MODE}'`);
  process.exit(1);
}

const FIXTURE_STATE = path.join(AGENT_DIR, 'fixture-state.json');
const PID_FILE_LAUNCHER = path.join(AGENT_DIR, 'launcher.pid');
const PID_FILE_BROWSER = path.join(AGENT_DIR, 'browser.pid');
const EXTENSION_ID_FILE = path.join(AGENT_DIR, 'extension.id');
const PREFS_PATH = path.join(PROFILE_DIR, 'Default', 'Preferences');

fs.mkdirSync(AGENT_DIR, { recursive: true });
fs.mkdirSync(PROFILE_DIR, { recursive: true });

function killExisting() {
  for (const file of [PID_FILE_LAUNCHER, PID_FILE_BROWSER]) {
    try {
      const pid = parseInt(fs.readFileSync(file, 'utf8').trim(), 10);
      if (pid && process.kill(pid, 0)) {
        console.log(`[cleanup] Killing stale ${path.basename(file)} (PID ${pid})`);
        process.kill(pid);
      }
    } catch {}
  }
  try { fs.unlinkSync(path.join(PROFILE_DIR, 'SingletonLock')); } catch {}
  for (const f of [PID_FILE_LAUNCHER, PID_FILE_BROWSER, EXTENSION_ID_FILE]) {
    try { fs.unlinkSync(f); } catch {}
  }
}

function checkExtensionBuild() {
  const manifest = path.join(EXTENSION_DIR, 'manifest.json');
  const swBundle = path.join(EXTENSION_DIR, 'scripts/app-init.js');
  if (!fs.existsSync(manifest)) {
    console.error(`FAIL: No build at ${manifest}`);
    console.error('  Run: yarn start  (in another terminal, leave watching)');
    process.exit(1);
  }
  if (!fs.existsSync(swBundle)) {
    console.error(`FAIL: SW bundle missing at ${swBundle} — wait for build to finish.`);
    process.exit(1);
  }
}

function generateFixture() {
  const generator = path.join(__dirname, 'generate-fixture.cjs');
  console.log('[fixture] Generating state from wallet fixture...');
  try {
    execFileSync('node', [generator, WALLET_FIXTURE, FIXTURE_STATE], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (e) {
    console.error('FAIL: fixture generation failed');
    process.exit(1);
  }
}

function preFillStorage(extId) {
  const stateRaw = fs.readFileSync(FIXTURE_STATE, 'utf8');
  const fixture = JSON.parse(stateRaw);
  const versioned = fixture?.data
    ? { data: fixture.data, meta: { ...(fixture.meta || {}), storageKind: 'data' } }
    : fixture;
  const dbPath = path.join(PROFILE_DIR, 'Default', 'Local Extension Settings', extId);
  fs.mkdirSync(dbPath, { recursive: true });
  try {
    const { ClassicLevel } = require('classic-level');
    const db = new ClassicLevel(dbPath, { valueEncoding: 'json' });
    return db.open()
      .then(async () => {
        const entries = Object.entries(versioned);
        for (const [k, v] of entries) await db.put(k, v);
        await db.close();
        console.log(`[prefill] Wrote ${entries.length} keys for ${extId}`);
      });
  } catch (e) {
    console.warn(`[prefill] WARN: LevelDB write failed (${e.message}) — falling back to CDP injection`);
    return Promise.resolve();
  }
}

function patchPrefs(extId) {
  try {
    const prefs = fs.existsSync(PREFS_PATH)
      ? JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8'))
      : {};
    if (!prefs.extensions) prefs.extensions = {};
    if (!prefs.extensions.ui) prefs.extensions.ui = {};
    prefs.extensions.ui.developer_mode = true;
    const pinned = prefs.extensions.pinned_extensions || [];
    if (!pinned.includes(extId)) pinned.push(extId);
    prefs.extensions.pinned_extensions = pinned;
    if (!prefs.extensions.commands) prefs.extensions.commands = {};
    prefs.extensions.commands['mac:Alt+Shift+M'] = {
      command_name: '_execute_action',
      extension: extId,
      global: false,
    };
    fs.mkdirSync(path.dirname(PREFS_PATH), { recursive: true });
    fs.writeFileSync(PREFS_PATH, JSON.stringify(prefs));
  } catch {}
}

async function waitForCdp(port) {
  for (let i = 0; i < 60; i++) {
    try {
      const ok = await new Promise((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${port}/json/version`, (res) => {
          let body = '';
          res.on('data', (c) => { body += c; });
          res.on('end', () => resolve(body));
        });
        req.on('error', reject);
      });
      if (ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  killExisting();
  checkExtensionBuild();
  generateFixture();

  // Best-effort prefill using last-known extension ID before launch (avoids the
  // SW skeleton bug where state injected after SW startup is ignored).
  let knownExtId = '';
  try {
    const prefs = JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8'));
    for (const [, val] of Object.entries(prefs.extensions?.commands || {})) {
      if (val.command_name === '_execute_action') {
        knownExtId = val.extension;
        break;
      }
    }
    if (!knownExtId) {
      for (const [eid, info] of Object.entries(prefs.extensions?.settings || {})) {
        if (info.manifest?.name === 'MetaMask') { knownExtId = eid; break; }
      }
    }
  } catch {}

  if (knownExtId) {
    await preFillStorage(knownExtId);
    patchPrefs(knownExtId);
  }

  const { chromium } = require('playwright');

  fs.writeFileSync(PID_FILE_LAUNCHER, String(process.pid));

  console.log('[browser] Launching Chromium...');
  console.log(`  Label:     ${SANDBOX_LABEL}`);
  console.log(`  Extension: ${EXTENSION_DIR}`);
  console.log(`  Profile:   ${PROFILE_DIR}`);
  console.log(`  CDP:       ${CDP_PORT}`);
  console.log(`  Mode:      ${LAUNCH_MODE}`);

  const args = [
    `--user-data-dir=${PROFILE_DIR}`,
    `--disable-extensions-except=${EXTENSION_DIR}`,
    `--load-extension=${EXTENSION_DIR}`,
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=420,800',
    `--remote-debugging-port=${CDP_PORT}`,
  ];

  const chromiumPath = env.CHROME_BIN || chromium.executablePath();
  if (process.platform === 'darwin' && chromiumPath.includes('.app/Contents/MacOS/')) {
    // Use macOS LaunchServices so the app is detached from this Node process.
    const appBundle = chromiumPath.replace(/\.app\/Contents\/MacOS\/.*$/, '.app');
    execFileSync('open', ['-n', '-a', appBundle, '--args', ...args], { stdio: 'ignore' });
  } else {
    require('child_process').spawn(chromiumPath, args, {
      detached: true,
      stdio: 'ignore',
    }).unref();
  }

  const ready = await waitForCdp(CDP_PORT);
  if (!ready) {
    console.error('FAIL: Chromium did not expose CDP within 60s');
    process.exit(1);
  }

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];

  try {
    const browserPid = execSync(
      `/usr/sbin/lsof -ti tcp:${CDP_PORT} -sTCP:LISTEN | head -1`,
      { timeout: 2000 },
    ).toString().trim();
    if (browserPid) fs.writeFileSync(PID_FILE_BROWSER, browserPid);
  } catch {}

  let extId = '';
  for (let i = 0; i < 30 && !extId; i++) {
    for (const sw of ctx.serviceWorkers()) {
      if (sw.url().startsWith('chrome-extension://')) {
        extId = sw.url().split('/')[2];
        break;
      }
    }
    if (!extId) {
      for (const p of ctx.pages()) {
        if (p.url().startsWith('chrome-extension://')) {
          extId = p.url().split('/')[2];
          break;
        }
      }
    }
    if (!extId) await new Promise((r) => setTimeout(r, 2000));
  }
  if (!extId) {
    console.error('FAIL: extension not detected after 60s');
    process.exit(1);
  }
  console.log(`[ext] ID: ${extId}`);
  fs.writeFileSync(EXTENSION_ID_FILE, extId);

  // Persist prefs for next run + ensure dev mode toggle (UI-driven).
  try {
    const devPage = await ctx.newPage();
    await devPage.goto('chrome://extensions', { waitUntil: 'load', timeout: 30000 });
    await devPage.waitForTimeout(1500);
    await devPage.evaluate(() => {
      const manager = document.querySelector('extensions-manager');
      const toolbar = manager?.shadowRoot?.querySelector('extensions-toolbar');
      const toggle = toolbar?.shadowRoot?.querySelector('#devMode');
      if (toggle && !toggle.checked) toggle.click();
    });
    await devPage.close().catch(() => {});
  } catch (e) {
    console.warn(`[ext] WARN: could not toggle developer mode (${e.message})`);
  }

  // If we didn't prefill earlier (no known ID at boot), inject via CDP now.
  if (!knownExtId) {
    const stateRaw = fs.readFileSync(FIXTURE_STATE, 'utf8');
    const fixture = JSON.parse(stateRaw);
    const versioned = fixture?.data
      ? { data: fixture.data, meta: { ...(fixture.meta || {}), storageKind: 'data' } }
      : fixture;
    const extPage = ctx.pages().find((p) => p.url().startsWith('chrome-extension://')) || (await ctx.newPage());
    await extPage.goto(`chrome-extension://${extId}/home.html`, { waitUntil: 'load', timeout: 30000 });
    await extPage.evaluate(async (state) => {
      await chrome.storage.local.set(state);
    }, versioned);
    await extPage.reload({ waitUntil: 'load', timeout: 30000 });
  }

  let extPage = ctx.pages().find((p) => p.url().includes('chrome-extension://')) || ctx.pages()[0];
  if (!extPage.url().startsWith('chrome-extension://')) {
    await extPage.goto(`chrome-extension://${extId}/home.html`, { waitUntil: 'load', timeout: 30000 });
  }
  await new Promise((r) => setTimeout(r, 2000));

  // Tag window title with sandbox label for multi-instance disambiguation.
  await extPage.evaluate((id) => {
    const prefix = `${id} — `;
    const setTitle = () => {
      if (!document.title.startsWith(prefix)) document.title = prefix + document.title;
    };
    setTitle();
    new MutationObserver(setTitle).observe(
      document.querySelector('title') || document.head,
      { childList: true, subtree: true, characterData: true },
    );
  }, SANDBOX_LABEL);

  const wallet = JSON.parse(fs.readFileSync(WALLET_FIXTURE, 'utf8'));
  const password = wallet.password;
  const unlockSelector = '[data-testid="unlock-password"]';
  const readySelectors = [
    '[data-testid="account-menu-icon"]',
    '[data-testid="account-options-menu-button"]',
    '.wallet-overview',
    '.home__container',
  ];

  async function detectReady(page) {
    for (const sel of readySelectors) {
      try {
        if (await page.locator(sel).first().isVisible()) return sel;
      } catch {}
    }
    return null;
  }

  let detected = 'unknown';
  for (let i = 0; i < 15; i++) {
    if (await detectReady(extPage)) { detected = 'unlocked'; break; }
    if (await extPage.locator(unlockSelector).count()) { detected = 'locked'; break; }
    if (extPage.url().includes('/onboarding')) { detected = 'onboarding'; break; }
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (detected === 'locked') {
    console.log('[wallet] Unlocking...');
    await extPage.fill(unlockSelector, password);
    await extPage.click('[data-testid="unlock-submit"]');
    const deadline = Date.now() + 45000;
    while (Date.now() < deadline && !(await detectReady(extPage))) {
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!(await detectReady(extPage))) {
      console.error('FAIL: unlock submitted but ready selector never appeared');
      process.exit(1);
    }
    console.log('[wallet] Unlocked');
  } else if (detected === 'unlocked') {
    console.log('[wallet] Already unlocked');
  } else {
    console.warn(`[wallet] State after boot: ${detected} (${extPage.url()})`);
  }

  for (const p of ctx.pages()) {
    if (p !== extPage && p.url().includes('chrome-extension://') && p.url().includes('home.html')) {
      await p.close().catch(() => {});
    }
  }

  console.log(`[ready] ${SANDBOX_LABEL} (CDP:${CDP_PORT})`);
  process.exit(0);
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  for (const f of [PID_FILE_LAUNCHER, PID_FILE_BROWSER, EXTENSION_ID_FILE]) {
    try { fs.unlinkSync(f); } catch {}
  }
  process.exit(1);
});
