import type { Page } from '@playwright/test';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_HELP_US_IMPROVE_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_REVEAL_SRP_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  PREPARE_SWAP_ROUTE,
  SEND_ROUTE,
  SETTINGS_ROUTE,
  SIGNATURE_REQUEST_PATH,
  UNLOCK_ROUTE,
} from '../../../../../ui/helpers/constants/routes';
import type { ExtensionState } from '../launcher-types';
import { HomePage } from '../page-objects/home-page';

const UNLOCKED_SCREENS: Set<ExtensionState['currentScreen']> = new Set([
  'home',
  'send',
  'swap',
  'settings',
  'confirm-transaction',
  'confirm-signature',
  'confirmation',
  'connect',
  'bridge',
  'notification',
]);

const LOCKED_SCREENS: Set<ExtensionState['currentScreen']> = new Set([
  'unlock',
  'onboarding-welcome',
  'onboarding-import',
  'onboarding-create',
  'onboarding-srp',
  'onboarding-password',
  'onboarding-complete',
  'onboarding-metametrics',
  'onboarding-privacy',
]);

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
      .isVisible({ timeout: 200 })
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
      matcher: (path) => hasRoutePrefix(path, ONBOARDING_WELCOME_ROUTE),
      screen: 'onboarding-welcome',
    },
    {
      matcher: (path) => hasRoutePrefix(path, ONBOARDING_CREATE_PASSWORD_ROUTE),
      screen: 'onboarding-password',
    },
    {
      matcher: (path) => hasRoutePrefix(path, ONBOARDING_IMPORT_WITH_SRP_ROUTE),
      screen: 'onboarding-import',
    },
    {
      matcher: (path) =>
        hasRoutePrefix(path, ONBOARDING_REVEAL_SRP_ROUTE) ||
        hasRoutePrefix(path, ONBOARDING_REVIEW_SRP_ROUTE) ||
        hasRoutePrefix(path, ONBOARDING_CONFIRM_SRP_ROUTE),
      screen: 'onboarding-srp',
    },
    {
      matcher: (path) => hasRoutePrefix(path, ONBOARDING_COMPLETION_ROUTE),
      screen: 'onboarding-complete',
    },
    {
      matcher: (path) =>
        hasRoutePrefix(path, ONBOARDING_METAMETRICS) ||
        hasRoutePrefix(path, ONBOARDING_HELP_US_IMPROVE_ROUTE),
      screen: 'onboarding-metametrics',
    },
    {
      matcher: (path) =>
        hasRoutePrefix(path, ONBOARDING_PRIVACY_SETTINGS_ROUTE),
      screen: 'onboarding-privacy',
    },
    {
      matcher: (path) => hasRoutePrefix(path, ONBOARDING_UNLOCK_ROUTE),
      screen: 'unlock',
    },
    {
      matcher: (path) => hasRoutePrefix(path, ONBOARDING_ROUTE),
      screen: 'onboarding-welcome',
    },
    {
      matcher: (path) => /notification\.html/u.test(path),
      screen: 'notification',
    },
    {
      matcher: (path) => path === DEFAULT_ROUTE || path === '',
      screen: 'home',
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

export async function detectUnlockState(
  page: Page,
  currentScreen: ExtensionState['currentScreen'],
): Promise<boolean> {
  if (UNLOCKED_SCREENS.has(currentScreen)) {
    return true;
  }
  if (LOCKED_SCREENS.has(currentScreen)) {
    return false;
  }

  return page
    .locator('[data-testid="account-menu-icon"]')
    .isVisible()
    .catch(() => false);
}

export async function getBaseExtensionState(
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
  const currentScreen = await detectCurrentScreen(page);
  const isUnlocked = await detectUnlockState(page, currentScreen);

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
