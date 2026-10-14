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
import {
  type AccountsState,
  getMaybeSelectedInternalAccount,
} from '../../../../../shared/lib/selectors/accounts';
import type { ProviderConfigState } from '../../../../../shared/lib/selectors/networks';
import {
  getProviderConfig,
  getNetworkConfigurationsByChainId,
} from '../../../../../shared/lib/selectors/networks';
import HeaderNavbar from '../../../page-objects/pages/home/header-navbar';
import HomePage from '../../../page-objects/pages/home/homepage';
import LoginPage from '../../../page-objects/pages/onboarding/login-page';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingPrivacySettingsPage from '../../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import OnboardingSrpPage from '../../../page-objects/pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import SettingsPage from '../../../page-objects/pages/settings/settings-page';
import type { Driver } from '../../../webdriver/driver';
import { getE2EDriver, withTimeout } from '../e2e-driver';
import type { ExtensionState, ScreenName } from '../launcher-types';

const SCREEN_PROBE_TIMEOUT_MS = 2_000;
const BALANCE_TIMEOUT_MS = 2_000;

export type ScreenCheck = {
  screen: ScreenName;
  description: string;
  check: (driver: Driver) => Promise<void>;
};

/**
 * Screens recognised from the DOM, each by its e2e page object's own load
 * assertion, so a UI change that breaks one also fails the e2e suite.
 */
export const SCREEN_CHECKS: ScreenCheck[] = [
  {
    screen: 'unlock',
    description: 'unlock page',
    check: (driver) => new LoginPage(driver).checkPageIsLoaded(),
  },
  {
    screen: 'onboarding-welcome',
    description: 'onboarding welcome page',
    check: (driver) => new StartOnboardingPage(driver).checkLoginPageIsLoaded(),
  },
  {
    screen: 'home',
    description: 'home page',
    check: (driver) => new HomePage(driver).checkPageIsLoaded(),
  },
  {
    screen: 'onboarding-srp',
    description: 'secret recovery phrase page',
    check: (driver) => new OnboardingSrpPage(driver).checkPageIsLoaded(),
  },
  {
    screen: 'onboarding-password',
    description: 'create password page',
    check: (driver) => new OnboardingPasswordPage(driver).checkPageIsLoaded(),
  },
  {
    screen: 'onboarding-complete',
    description: 'onboarding complete page',
    check: (driver) => new OnboardingCompletePage(driver).checkPageIsLoaded(),
  },
  {
    screen: 'onboarding-metametrics',
    description: 'metametrics page',
    check: (driver) => new OnboardingMetricsPage(driver).checkPageIsLoaded(),
  },
  {
    screen: 'onboarding-privacy',
    description: 'privacy settings page',
    check: (driver) =>
      new OnboardingPrivacySettingsPage(driver).checkPageIsLoaded(),
  },
  {
    screen: 'settings',
    description: 'settings page',
    check: (driver) => new SettingsPage(driver).checkPageIsLoaded(),
  },
];

const LAUNCH_SCREENS: ScreenName[] = ['unlock', 'onboarding-welcome', 'home'];

/** Screens the extension can open on after launch. */
export const LAUNCH_SCREEN_CHECKS: ScreenCheck[] = SCREEN_CHECKS.filter(
  ({ screen }) => LAUNCH_SCREENS.includes(screen),
);

/**
 * Resolves with the first screen whose check passes. Rejects only when every
 * check fails.
 *
 * @param driver - The e2e driver bound to the page.
 * @param checks - The candidate screens.
 * @returns The screen that was reached.
 */
export async function waitForAnyScreen(
  driver: Driver,
  checks: ScreenCheck[],
): Promise<ScreenCheck> {
  return await Promise.any(
    checks.map(async (screenCheck) => {
      await screenCheck.check(driver);
      return screenCheck;
    }),
  );
}

// Some page objects use their own longer waits, so the probe is capped here
// rather than through the driver timeout alone.
async function detectScreenFromPageObjects(
  page: Page,
): Promise<ExtensionState['currentScreen']> {
  const handles: { timer?: ReturnType<typeof setTimeout> } = {};
  const giveUp = new Promise<ScreenName>((resolve) => {
    handles.timer = setTimeout(
      () => resolve('unknown'),
      SCREEN_PROBE_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([
      waitForAnyScreen(
        withTimeout(getE2EDriver(page), SCREEN_PROBE_TIMEOUT_MS),
        SCREEN_CHECKS,
      ).then(
        ({ screen }) => screen,
        (): ScreenName => 'unknown',
      ),
      giveUp,
    ]);
  } finally {
    clearTimeout(handles.timer);
  }
}

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

  return await detectScreenFromPageObjects(page);
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

  return await new HeaderNavbar(
    withTimeout(getE2EDriver(page), SCREEN_PROBE_TIMEOUT_MS),
  )
    .checkPageIsLoaded()
    .then(
      () => true,
      () => false,
    );
}

// Fetches the raw metamask Redux state via stateHooks. Uses CDP
// Runtime.evaluate directly because Playwright's page.evaluate() wrapper
// references setInterval internally, which is blocked by LavaMoat scuttling.
const CDP_FETCH_METAMASK_STATE = `
(async () => {
  const hooks = globalThis.stateHooks;
  if (typeof hooks?.getCleanAppState !== 'function') return null;
  const state = await hooks.getCleanAppState();
  return JSON.stringify(state?.metamask ?? null);
})()
`.trim();

type IdentityData = {
  accountAddress: string | null;
  networkName: string | null;
  chainId: string | null;
};

// The CDP-fetched metamask slice is cast to the selector state types so that
// identity extraction reuses the same logic as the extension UI. This keeps
// the inspector in sync with future state-shape changes automatically.
type SelectorState = AccountsState & ProviderConfigState;

function resolveIdentity(metamaskState: Record<string, unknown>): IdentityData {
  const state = { metamask: metamaskState } as SelectorState;

  const selectedAccount = getMaybeSelectedInternalAccount(state);

  let networkName: string | null = null;
  let chainId: string | null = null;
  try {
    const providerConfig = getProviderConfig(state);
    chainId = providerConfig.chainId ?? null;
    // getProviderConfig returns nickname only for custom RPC endpoints.
    // Fall back to the canonical network name for built-in networks.
    const configs = getNetworkConfigurationsByChainId(state);
    networkName =
      providerConfig.nickname ?? configs[providerConfig.chainId]?.name ?? null;
  } catch {
    // getProviderConfig throws when configuration is not found
  }

  return {
    accountAddress: selectedAccount?.address ?? null,
    networkName,
    chainId,
  };
}

async function extractIdentityViaCDP(page: Page): Promise<IdentityData | null> {
  let cdp;
  try {
    cdp = await page.context().newCDPSession(page);
    const result = await cdp.send('Runtime.evaluate', {
      expression: CDP_FETCH_METAMASK_STATE,
      awaitPromise: true,
      returnByValue: true,
    });

    if (result.exceptionDetails || !result.result?.value) {
      return null;
    }

    const parsed =
      typeof result.result.value === 'string'
        ? JSON.parse(result.result.value)
        : result.result.value;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return resolveIdentity(parsed as Record<string, unknown>);
  } catch {
    return null;
  } finally {
    await cdp?.detach().catch(() => undefined);
  }
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
  let { chainId } = options;
  let balance: string | null = null;

  const identity = await extractIdentityViaCDP(page);

  if (identity) {
    accountAddress = identity.accountAddress;
    networkName = identity.networkName;

    if (identity.chainId) {
      const parsed = Number(identity.chainId);
      if (!Number.isNaN(parsed)) {
        chainId = parsed;
      }
    }
  }

  // Balance remains DOM-based (home screen only) pending a separate
  // investigation into extracting it from Redux state.
  if (isUnlocked && currentScreen === 'home') {
    balance =
      (await new HomePage(getE2EDriver(page))
        .getBalance(BALANCE_TIMEOUT_MS)
        .catch(() => '')) || null;
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
