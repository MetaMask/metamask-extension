import type { Page } from '@playwright/test';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  SEND_ROUTE,
  SETTINGS_ROUTE,
  SIGNATURE_REQUEST_PATH,
  UNLOCK_ROUTE,
} from '../../../../../ui/helpers/constants/routes';
import type { ExtensionState } from '../launcher-types';
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
  const hashPath = hash.split(/[?#]/u)[0] || hash;

  const routeMatchers: {
    matcher: (path: string) => boolean;
    screen: ExtensionState['currentScreen'];
  }[] = [
    { matcher: (path) => hasRoutePrefix(path, SEND_ROUTE), screen: 'send' },
    {
      matcher: (path) =>
        hasRoutePrefix(path, CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE),
      screen: 'swap',
    },
    {
      matcher: (path) =>
        hasRoutePrefix(
          path,
          `${CONFIRM_TRANSACTION_ROUTE}${SIGNATURE_REQUEST_PATH}`,
        ) || path.includes(SIGNATURE_REQUEST_PATH),
      screen: 'confirm-signature',
    },
    {
      matcher: (path) => hasRoutePrefix(path, CONFIRM_TRANSACTION_ROUTE),
      screen: 'confirm-transaction',
    },
    {
      matcher: (path) => hasRoutePrefix(path, CONFIRMATION_V_NEXT_ROUTE),
      screen: 'confirmation',
    },
    {
      matcher: (path) => hasRoutePrefix(path, CONNECT_ROUTE),
      screen: 'connect',
    },
    {
      matcher: (path) => hasRoutePrefix(path, SETTINGS_ROUTE),
      screen: 'settings',
    },
    { matcher: (path) => hasRoutePrefix(path, UNLOCK_ROUTE), screen: 'unlock' },
    {
      matcher: (path) => /notification\.html/u.test(path),
      screen: 'notification',
    },
  ];

  for (const { matcher, screen } of routeMatchers) {
    if (matcher(hashPath) || matcher(url)) {
      return screen;
    }
  }

  return 'unknown';
}

function hasRoutePrefix(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`);
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
