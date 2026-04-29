#!/usr/bin/env node
'use strict';

const { chromium } = require('@playwright/test');

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? (process.argv[idx + 1] ?? fallback) : fallback;
}

async function main() {
  const cdpPort = Number(arg('--cdp-port', '9222'));
  const label = arg('--label', '');

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`);
  const ctx = browser.contexts()[0];
  const page =
    ctx && (ctx.pages().find((p) => p.url().startsWith('chrome-extension://')) || ctx.pages()[0]);
  if (!page) {
    console.error('No extension page available for soft refresh');
    process.exit(1);
  }

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(3000);

  if (label) {
    await page.evaluate((id) => {
      const prefix = `${id} — `;
      const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const setTitle = () => {
        if (!document.title.startsWith(prefix)) {
          document.title =
            prefix +
            document.title.replace(new RegExp(`^${escapeRe(id)} — `), '');
        }
      };
      setTitle();
      new MutationObserver(setTitle).observe(
        document.querySelector('title') || document.head,
        { childList: true, subtree: true, characterData: true },
      );
    }, label);
  }

  const out = await page.evaluate(() => ({
    href: location.href,
    title: document.title,
    unlockInput: !!document.querySelector('[data-testid="unlock-password"]'),
    accountMenu: !!document.querySelector('[data-testid="account-menu-icon"]'),
    body: document.body.innerText.slice(0, 400),
  }));

  console.log(JSON.stringify(out, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
