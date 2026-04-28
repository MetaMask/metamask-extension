'use strict';

// Route constants (from ui/helpers/constants/routes.ts)
const SEND_ROUTE = '/send';
const CONFIRM_TRANSACTION_ROUTE = '/confirm-transaction';
const CONFIRMATION_V_NEXT_ROUTE = '/confirmation';
const SIGNATURE_REQUEST_PATH = '/signature-request';
const CONNECT_ROUTE = '/connect';
const CROSS_CHAIN_SWAP_ROUTE = '/cross-chain';
const PREPARE_SWAP_ROUTE = '/swaps/prepare-bridge-page';
const SETTINGS_ROUTE = '/settings';
const UNLOCK_ROUTE = '/unlock';

function hasRoutePrefix(path, route) {
  return path === route || path.startsWith(`${route}/`);
}

function detectScreenFromUrl(url) {
  const hash = url.split('#')[1] ?? '';
  const hashPath = hash.split(/[?#]/u)[0] || hash;

  const matchers = [
    { test: (p) => hasRoutePrefix(p, SEND_ROUTE), screen: 'send' },
    { test: (p) => hasRoutePrefix(p, CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE), screen: 'swap' },
    { test: (p) => hasRoutePrefix(p, `${CONFIRM_TRANSACTION_ROUTE}${SIGNATURE_REQUEST_PATH}`) || p.includes(SIGNATURE_REQUEST_PATH), screen: 'confirm-signature' },
    { test: (p) => hasRoutePrefix(p, CONFIRM_TRANSACTION_ROUTE), screen: 'confirm-transaction' },
    { test: (p) => hasRoutePrefix(p, CONFIRMATION_V_NEXT_ROUTE), screen: 'confirmation' },
    { test: (p) => hasRoutePrefix(p, CONNECT_ROUTE), screen: 'connect' },
    { test: (p) => hasRoutePrefix(p, SETTINGS_ROUTE), screen: 'settings' },
    { test: (p) => hasRoutePrefix(p, UNLOCK_ROUTE), screen: 'unlock' },
    { test: (p) => /notification\.html/u.test(p), screen: 'notification' },
  ];

  for (const { test, screen } of matchers) {
    if (test(hashPath) || test(url)) return screen;
  }
  return 'unknown';
}

async function detectCurrentScreen(page) {
  if (!page) return 'unknown';

  const currentUrl = page.url();
  const urlMatch = detectScreenFromUrl(currentUrl);
  if (urlMatch !== 'unknown') return urlMatch;

  const screenSelectors = [
    { screen: 'unlock', selector: '[data-testid="unlock-password"]' },
    { screen: 'home', selector: '[data-testid="account-menu-icon"]' },
    { screen: 'onboarding-welcome', selector: '[data-testid="get-started"]' },
    { screen: 'onboarding-import', selector: '[data-testid="onboarding-import-wallet"]' },
    { screen: 'onboarding-create', selector: '[data-testid="onboarding-create-wallet"]' },
    { screen: 'onboarding-srp', selector: '[data-testid="srp-input-import__srp-note"]' },
    { screen: 'onboarding-password', selector: '[data-testid="create-password-new-input"]' },
    { screen: 'onboarding-complete', selector: '[data-testid="onboarding-complete-done"]' },
    { screen: 'onboarding-metametrics', selector: '[data-testid="metametrics-i-agree"]' },
    { screen: 'settings', selector: '[data-testid="settings-page"]' },
  ];

  for (const { screen, selector } of screenSelectors) {
    const visible = await page.locator(selector).isVisible({ timeout: 500 }).catch(() => false);
    if (visible) return screen;
  }
  return 'unknown';
}

async function getExtensionState(page, options) {
  if (!page || !options.extensionId) throw new Error('Extension not initialized');

  const currentUrl = page.url();
  const isUnlocked = await page.locator('[data-testid="account-menu-icon"]').isVisible().catch(() => false);
  const currentScreen = await detectCurrentScreen(page);

  let accountAddress = null;
  let networkName = null;
  let balance = null;

  if (currentScreen === 'home' && isUnlocked) {
    // Account address
    const addrBtn = page.locator('[data-testid="address-copy-button-text"]');
    if (await addrBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const title = await addrBtn.getAttribute('title');
      if (title?.startsWith('0x')) { accountAddress = title; }
      else {
        const dataAddr = await addrBtn.getAttribute('data-address');
        if (dataAddr?.startsWith('0x')) { accountAddress = dataAddr; }
        else { accountAddress = (await addrBtn.textContent())?.trim() || null; }
      }
    }
    if (!accountAddress) {
      const selAcct = page.locator('[data-testid="selected-account-address"]');
      if (await selAcct.isVisible({ timeout: 2000 }).catch(() => false)) {
        accountAddress = (await selAcct.textContent())?.trim() || null;
      }
    }

    // Network name
    const netLocators = [
      { loc: page.locator('[data-testid="picker-network-label"]'), method: 'text' },
      { loc: page.locator('[data-testid="networks-subtitle-test-id"]'), method: 'text' },
      { loc: page.locator('[data-testid="network-display"]'), method: 'text' },
      { loc: page.locator('.mm-picker-network'), method: 'aria' },
    ];
    for (const { loc, method } of netLocators) {
      if (await loc.isVisible({ timeout: 1500 }).catch(() => false)) {
        let text;
        if (method === 'aria') {
          text = await loc.getAttribute('aria-label') || await loc.innerText();
        } else {
          text = await loc.textContent();
        }
        if (text?.trim()) { networkName = text.trim(); break; }
      }
    }

    // Balance
    const balLocators = [
      '[data-testid="eth-overview__primary-currency"]',
      '[data-testid="eth-overview__secondary-currency"]',
      '[data-testid="coin-overview__primary-currency"]',
      '[data-testid="coin-overview__secondary-currency"]',
    ];
    for (const sel of balLocators) {
      const text = await page.locator(sel).textContent({ timeout: 2000 }).catch(() => null);
      if (text?.includes('ETH')) { balance = text.trim(); break; }
    }
    if (!balance) {
      for (const sel of balLocators.slice(0, 1).concat(balLocators.slice(2, 3))) {
        const text = await page.locator(sel).textContent({ timeout: 1500 }).catch(() => null);
        if (text?.trim()) { balance = text.trim(); break; }
      }
    }
  }

  return {
    isLoaded: true,
    currentUrl,
    extensionId: options.extensionId,
    isUnlocked,
    currentScreen,
    accountAddress,
    networkName,
    chainId: options.chainId,
    balance,
  };
}

module.exports = { getExtensionState, detectCurrentScreen, detectScreenFromUrl };
