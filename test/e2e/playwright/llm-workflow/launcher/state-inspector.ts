import type { Page } from '@playwright/test';
import type { ExtensionState } from '../types';
import { HomePage } from '../page-objects/home-page';

export async function detectCurrentScreen(
  page: Page | undefined,
): Promise<ExtensionState['currentScreen']> {
  if (!page) {
    return 'unknown';
  }

  const currentUrl = page.url();
  const urlScreenMatch = detectScreenFromUrl(currentUrl);
  if (urlScreenMatch !== 'unknown') {
    return urlScreenMatch;
  }

  const screenSelectors: {
    screen: ExtensionState['currentScreen'];
    selector: string;
  }[] = [
    { screen: 'unlock', selector: '[data-testid="unlock-password"]' },
    { screen: 'home', selector: '[data-testid="account-menu-icon"]' },
    { screen: 'onboarding-welcome', selector: '[data-testid="get-started"]' },
    {
      screen: 'onboarding-import',
      selector: '[data-testid="onboarding-import-wallet"]',
    },
    {
      screen: 'onboarding-create',
      selector: '[data-testid="onboarding-create-wallet"]',
    },
    {
      screen: 'onboarding-srp',
      selector: '[data-testid="srp-input-import__srp-note"]',
    },
    {
      screen: 'onboarding-password',
      selector: '[data-testid="create-password-new-input"]',
    },
    {
      screen: 'onboarding-complete',
      selector: '[data-testid="onboarding-complete-done"]',
    },
    {
      screen: 'onboarding-metametrics',
      selector: '[data-testid="metametrics-i-agree"]',
    },
    { screen: 'settings', selector: '[data-testid="settings-page"]' },
  ];

  for (const { screen, selector } of screenSelectors) {
    const isVisible = await page
      .locator(selector)
      .isVisible({ timeout: 500 })
      .catch(() => false);
    if (isVisible) {
      return screen;
    }
  }

  return 'unknown';
}

export function detectScreenFromUrl(
  url: string,
): ExtensionState['currentScreen'] {
  const hash = url.split('#')[1] ?? '';

  const urlPatterns: {
    pattern: RegExp;
    screen: ExtensionState['currentScreen'];
  }[] = [
    { pattern: /^\/send/u, screen: 'send' },
    { pattern: /^\/swap/u, screen: 'swap' },
    { pattern: /^\/bridge/u, screen: 'bridge' },
    { pattern: /^\/confirm-transaction/u, screen: 'confirm-transaction' },
    { pattern: /^\/confirm-signature/u, screen: 'confirm-signature' },
    { pattern: /^\/settings/u, screen: 'settings' },
    { pattern: /^\/unlock/u, screen: 'unlock' },
    { pattern: /notification\.html/u, screen: 'notification' },
  ];

  for (const { pattern, screen } of urlPatterns) {
    if (pattern.test(hash) || pattern.test(url)) {
      return screen;
    }
  }

  return 'unknown';
}

export async function getExtensionState(
  page: Page | undefined,
  options: {
    extensionId?: string;
    chainId: number;
  },
): Promise<ExtensionState> {
  if (!page || !options.extensionId) {
    throw new Error('Extension not initialized');
  }

  const currentUrl = page.url();
  const isUnlocked = await page
    .locator('[data-testid="account-menu-icon"]')
    .isVisible()
    .catch(() => false);

  const currentScreen = await detectCurrentScreen(page);

  let accountAddress: string | null = null;
  let networkName: string | null = null;
  const { chainId } = options;
  let balance: string | null = null;

  if (currentScreen === 'home' && isUnlocked) {
    const homePage = new HomePage(page);

    accountAddress = (await homePage.getAccountAddress()) || null;
    networkName = (await homePage.getNetworkName()) || null;
    balance = (await homePage.getBalance()) || null;
  }

  return {
    isLoaded: true,
    currentUrl,
    extensionId: options.extensionId,
    isUnlocked,
    currentScreen,
    accountAddress,
    networkName,
    chainId,
    balance,
  };
}
