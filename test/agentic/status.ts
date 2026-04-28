/**
 * status.ts — Quick status check for CDP-connected MetaMask extension.
 *
 * Usage: npx tsx status.ts [--cdp-port <port>]
 *
 * Checks: CDP connection, extension targets, wallet lock state, current screen,
 * perps controller state. No browser interaction — read-only.
 */

import http from 'http';
import { chromium } from '@playwright/test';

function httpGetJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

const cdpPort = (() => {
  const idx = process.argv.indexOf('--cdp-port');
  if (idx >= 0) {
    const val = parseInt(process.argv[idx + 1] ?? '', 10);
    return Number.isNaN(val) ? 6668 : val;
  }
  return 6668;
})();

const G = '\x1b[32m';
const R = '\x1b[31m';
const Y = '\x1b[33m';
const D = '\x1b[2m';
const X = '\x1b[0m';

async function main(): Promise<void> {
  process.stdout.write(`\n${D}CDP port:${X} ${cdpPort}\n`);

  // 1. Check CDP reachable
  let versionInfo: Record<string, string>;
  try {
    versionInfo = (await httpGetJson(
      `http://localhost:${cdpPort}/json/version`,
    )) as Record<string, string>;
    process.stdout.write(`${G}Connected${X}  ${versionInfo.Browser ?? 'unknown browser'}\n`);
  } catch {
    process.stdout.write(`${R}Cannot connect${X} to CDP on port ${cdpPort}\n`);
    process.exit(1);
  }

  // 2. List targets
  const targets = (await httpGetJson(
    `http://localhost:${cdpPort}/json/list`,
  )) as Array<{
    type: string;
    url: string;
    title: string;
    webSocketDebuggerUrl?: string;
  }>;

  // Find extension
  const extPattern = /chrome-extension:\/\/([a-z]+)\//u;
  const extIds = new Set<string>();
  for (const t of targets) {
    const m = t.url.match(extPattern);
    if (m) {
      extIds.add(m[1]);
    }
  }

  if (extIds.size === 0) {
    process.stdout.write(`${R}No extension${X} found in CDP targets\n`);
    process.exit(1);
  }

  const extensionId = [...extIds][0];
  process.stdout.write(`${D}Extension:${X}  ${extensionId}\n`);

  // 3. Summarize targets
  process.stdout.write(`\n${D}Targets (${targets.length}):${X}\n`);
  for (const t of targets) {
    const short = t.url.length > 90 ? `${t.url.slice(0, 87)}...` : t.url;
    const typeColor = t.type === 'service_worker' ? Y : t.type === 'page' ? G : D;
    process.stdout.write(`  ${typeColor}${t.type.padEnd(16)}${X} ${short}\n`);
  }

  // 4. Connect via Playwright to read extension state
  const homePage = targets.find(
    (t) => t.type === 'page' && t.url.includes(`${extensionId}/home.html`),
  );

  if (!homePage) {
    process.stdout.write(`\n${Y}No home.html page${X} — cannot read wallet state\n`);
    process.exit(0);
  }

  const browser = await chromium.connectOverCDP(`http://localhost:${cdpPort}`);
  const contexts = browser.contexts();
  let page = null;
  for (const ctx of contexts) {
    for (const p of ctx.pages()) {
      if (p.url().includes(`${extensionId}/home.html`)) {
        page = p;
        break;
      }
    }
    if (page) {
      break;
    }
  }

  if (!page) {
    process.stdout.write(`\n${Y}Could not attach${X} to home.html via Playwright\n`);
    await browser.close();
    process.exit(0);
  }

  // Disable Playwright's default media emulation so we don't override the
  // real OS `prefers-color-scheme` (flips MetaMask theme when theme=System).
  await page
    .emulateMedia({ colorScheme: null, reducedMotion: null, forcedColors: null })
    .catch(() => {});

  // Current URL
  const currentHash = await page.evaluate('location.hash');
  process.stdout.write(`\n${D}Current screen:${X} ${String(currentHash)}\n`);

  // Wallet lock state
  const lockCheck = await page.evaluate(
    "(function(){try{var m=stateHooks.store.getState().metamask;" +
      "return JSON.stringify({hasVault:m.keyrings&&m.keyrings.length>0})}catch(e){return JSON.stringify({error:e.message})}})()",
  );
  const lock = JSON.parse(String(lockCheck));
  if (lock.error) {
    process.stdout.write(`${Y}Wallet state:${X}   error — ${lock.error}\n`);
  } else {
    // isUnlocked is runtime-only, not persisted. Check for unlock-password element instead.
    const hasUnlockInput = await page
      .locator('[data-testid="unlock-password"]')
      .count();
    const isLocked = hasUnlockInput > 0;
    const lockIcon = isLocked ? `${R}LOCKED${X}` : `${G}UNLOCKED${X}`;
    process.stdout.write(`${D}Wallet:${X}         ${lockIcon}  (vault: ${lock.hasVault ? 'yes' : 'no'})\n`);
  }

  // Perps state — sync store read + live balance via submitRequestToBackground
  const perpsCheck = await page.evaluate(
    "(async()=>{try{" +
      'var m=stateHooks.store.getState().metamask;' +
      'if(m.activeProvider===undefined){return JSON.stringify({present:false})}' +
      'var bal="N/A",pnl="N/A",roe="N/A",live=false;' +
      "try{var r=await stateHooks.submitRequestToBackground('perpsGetAccountState',[]);" +
      'if(r){bal=r.totalBalance??"N/A";pnl=r.unrealizedPnl??"N/A";roe=r.returnOnEquity??"N/A";live=true}}catch(re){' +
      'var c=m.cachedAccountState;if(c){bal=c.totalBalance??"N/A";pnl=c.unrealizedPnl??"N/A";roe=c.returnOnEquity??"N/A"}}' +
      'return JSON.stringify({present:true,provider:m.activeProvider,' +
      'testnet:!!m.isTestnet,balance:bal,pnl:pnl,roe:roe,live:live})' +
      '}catch(e){return JSON.stringify({error:e.message})}})()',
  );
  const perps = JSON.parse(String(perpsCheck));
  if (perps.error) {
    process.stdout.write(`${D}Perps:${X}          ${R}error${X} — ${perps.error}\n`);
  } else if (!perps.present) {
    process.stdout.write(`${D}Perps:${X}          ${Y}not present${X} (feature disabled or not initialized)\n`);
  } else {
    const testnetTag = perps.testnet ? `${Y}TESTNET${X}` : `${G}MAINNET${X}`;
    process.stdout.write(
      `${D}Perps:${X}          ${G}active${X}  provider=${perps.provider}  ${testnetTag}\n`,
    );
    const src = perps.live ? '' : `  ${Y}(cached)${X}`;
    process.stdout.write(
      `${D}Balance:${X}        $${perps.balance}  (uPnL: $${perps.pnl}, RoE: ${perps.roe}%)${src}\n`,
    );
  }

  // Visible testIds (top 15)
  const testIds = await page.evaluate(
    "Array.from(document.querySelectorAll('[data-testid]')).map(e=>e.getAttribute('data-testid')).slice(0,15)",
  );
  const ids = testIds as string[];
  if (ids.length > 0) {
    process.stdout.write(`\n${D}Visible testIDs (first ${ids.length}):${X}\n`);
    for (const id of ids) {
      process.stdout.write(`  ${id}\n`);
    }
  }

  process.stdout.write('\n');
  await browser.close();
}

main().catch((err) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
