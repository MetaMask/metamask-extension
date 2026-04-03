'use strict';

/**
 * JS stub for state-inspector — mirrors the TypeScript original.
 * Used by cdp-session-manager.js in the recipe runner.
 */

async function detectCurrentScreen(page) {
  if (!page) {
    return 'unknown';
  }

  const url = page.url();
  const hash = url.split('#')[1] ?? '';
  const hashPath = hash.split(/[?#]/u)[0] || hash;

  const routeMap = [
    ['/send', 'send'],
    ['/cross-chain/prepare-swap', 'swap'],
    ['/confirm-transaction/signature-request', 'confirm-signature'],
    ['/confirm-transaction', 'confirm-transaction'],
    ['/confirmation', 'confirmation'],
    ['/connect', 'connect'],
    ['/settings', 'settings'],
    ['/unlock', 'unlock'],
  ];

  for (const [route, screen] of routeMap) {
    if (
      hashPath === route ||
      hashPath.startsWith(`${route}/`) ||
      url.includes(route)
    ) {
      return screen;
    }
  }

  // DOM fallback
  const selectors = [
    ['[data-testid="unlock-password"]', 'unlock'],
    ['[data-testid="account-menu-icon"]', 'home'],
    ['[data-testid="settings-page"]', 'settings'],
    ['[data-testid="get-started"]', 'onboarding-welcome'],
  ];

  for (const [selector, screen] of selectors) {
    const visible = await page
      .locator(selector)
      .isVisible({ timeout: 500 })
      .catch(() => false);
    if (visible) {
      return screen;
    }
  }

  return 'unknown';
}

async function getExtensionState(page, options) {
  if (!page || !options.extensionId) {
    throw new Error('Extension not initialized');
  }

  const currentUrl = page.url();
  const isUnlocked = await page
    .locator('[data-testid="account-menu-icon"]')
    .isVisible()
    .catch(() => false);

  const currentScreen = await detectCurrentScreen(page);

  return {
    isLoaded: true,
    currentUrl,
    extensionId: options.extensionId,
    isUnlocked,
    currentScreen,
    accountAddress: null,
    networkName: null,
    chainId: options.chainId,
    balance: null,
  };
}

module.exports = { getExtensionState, detectCurrentScreen };
