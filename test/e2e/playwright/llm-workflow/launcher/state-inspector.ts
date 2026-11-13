import type { Page } from '@playwright/test';
import {
  BASIC_FUNCTIONALITY_OFF_ROUTE,
  DEEP_LINK_ROUTE,
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  RESTORE_VAULT_ROUTE,
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
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import {
  ROUTE_PAGE_OBJECT_REGISTRY,
  matchRoute,
} from '../../../route-registry';
import type { Driver } from '../../../webdriver/driver';
import { getE2EDriver, withTimeout } from '../e2e-driver';
import type { ExtensionState, ScreenName } from '../launcher-types';

const SCREEN_PROBE_TIMEOUT_MS = 2_000;
const BALANCE_TIMEOUT_MS = 2_000;

export type ScreenCheck = {
  /** Route path pattern of the screen, as keyed in the route registry. */
  route: string;
  screen: ScreenName;
  description: string;
  check: (driver: Driver) => Promise<void>;
};

function createScreenCheck(
  route: string,
  description: string,
  check: ScreenCheck['check'],
): ScreenCheck {
  return { route, screen: getScreenName(route), description, check };
}

/**
 * Screens waited for from the DOM while launching and self-onboarding, each by
 * its e2e page object's own load assertion, so a UI change that breaks one
 * also fails the e2e suite.
 */
export const SCREEN_CHECKS: ScreenCheck[] = [
  createScreenCheck(UNLOCK_ROUTE, 'unlock page', (driver) =>
    new LoginPage(driver).checkPageIsLoaded(),
  ),
  createScreenCheck(
    ONBOARDING_WELCOME_ROUTE,
    'onboarding welcome page',
    (driver) => new StartOnboardingPage(driver).checkLoginPageIsLoaded(),
  ),
  createScreenCheck(DEFAULT_ROUTE, 'home page', (driver) =>
    new HomePage(driver).checkPageIsLoaded(),
  ),
  createScreenCheck(
    ONBOARDING_COMPLETION_ROUTE,
    'onboarding complete page',
    (driver) => new OnboardingCompletePage(driver).checkPageIsLoaded(),
  ),
];

const LAUNCH_ROUTES = [UNLOCK_ROUTE, ONBOARDING_WELCOME_ROUTE, DEFAULT_ROUTE];

/** Screens the extension can open on after launch. */
export const LAUNCH_SCREEN_CHECKS: ScreenCheck[] = SCREEN_CHECKS.filter(
  ({ route }) => LAUNCH_ROUTES.includes(route),
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

/**
 * Names a screen after its route path pattern without the dynamic segments,
 * e.g. `/account-list` is `account-list` and `/send/:page?` is `send`.
 *
 * @param routePath - A route path pattern from the route registry.
 * @returns The screen name.
 */
export function getScreenName(routePath: string): ScreenName {
  const segments = routePath
    .split('/')
    .filter((segment) => segment && !segment.startsWith(':'));
  return segments.length > 0 ? segments.join('-') : 'home';
}

function hasRoutePrefix(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`);
}

// Must match the routes rendered outside `RequireAuthenticated` in
// ui/pages/routes/routes.component.tsx.
const LOCKED_ROUTES = [
  ONBOARDING_ROUTE,
  UNLOCK_ROUTE,
  LOCK_ROUTE,
  RESTORE_VAULT_ROUTE,
];
const UNAUTHENTICATED_ROUTES = [DEEP_LINK_ROUTE, BASIC_FUNCTIONALITY_OFF_ROUTE];

const REGISTRY_ROUTES = Object.keys(ROUTE_PAGE_OBJECT_REGISTRY);

const LOCKED_SCREENS = new Set(
  REGISTRY_ROUTES.filter((route) =>
    LOCKED_ROUTES.some((locked) => hasRoutePrefix(route, locked)),
  ).map(getScreenName),
);

const UNLOCKED_SCREENS = new Set([
  'notification',
  ...REGISTRY_ROUTES.filter(
    (route) =>
      !LOCKED_SCREENS.has(getScreenName(route)) &&
      !UNAUTHENTICATED_ROUTES.includes(route),
  ).map(getScreenName),
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

/**
 * Finds the route for a hash path. A path that is not a route itself (e.g. a
 * nested step missing from `ROUTES`) gets its closest parent route, but never
 * the home route.
 *
 * @param hashPath - The URL hash without `#` and query string.
 * @returns The route path pattern, or `undefined`.
 */
function findRoute(hashPath: string): string | undefined {
  if (hashPath === '' || hashPath === DEFAULT_ROUTE) {
    return DEFAULT_ROUTE;
  }
  for (
    let path = hashPath;
    path.startsWith('/') && path.length > 1;
    path = path.slice(0, path.lastIndexOf('/'))
  ) {
    const route = matchRoute(path);
    if (route) {
      return route.path;
    }
  }
  return undefined;
}

export function detectScreenFromUrl(
  url: string,
): ExtensionState['currentScreen'] {
  const hash = url.split('#')[1] ?? '';
  const hashPath = hash.split(/[?#]/u)[0] || hash;
  const route = findRoute(hashPath);

  if (
    /notification\.html/u.test(url) &&
    (route === undefined || route === DEFAULT_ROUTE)
  ) {
    return 'notification';
  }
  return route === undefined ? 'unknown' : getScreenName(route);
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
