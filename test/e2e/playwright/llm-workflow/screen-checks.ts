import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import OnboardingSrpPage from '../../page-objects/pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import type { Driver } from '../../webdriver/driver';
import { withTimeout } from './e2e-driver';
import type { ScreenName } from './launcher-types';

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

/**
 * Describes screens for error messages.
 *
 * @param checks - The screens to describe.
 * @returns A comma-separated description.
 */
export function describeScreens(checks: ScreenCheck[]): string {
  return checks.map(({ description }) => description).join(', ');
}

/**
 * Identifies the current screen from the DOM, giving up after `timeoutMs`.
 * Some page objects use their own longer waits, so the probe is capped here
 * rather than through the driver timeout alone.
 *
 * @param driver - The e2e driver bound to the page.
 * @param timeoutMs - Maximum time to spend probing.
 * @returns The detected screen, or `'unknown'`.
 */
export async function detectScreenFromPageObjects(
  driver: Driver,
  timeoutMs: number,
): Promise<ScreenName> {
  const handles: { timer?: ReturnType<typeof setTimeout> } = {};
  const giveUp = new Promise<ScreenName>((resolve) => {
    handles.timer = setTimeout(() => resolve('unknown'), timeoutMs);
  });
  try {
    return await Promise.race([
      waitForAnyScreen(withTimeout(driver, timeoutMs), SCREEN_CHECKS).then(
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
 * Waits until the wallet home page is loaded.
 *
 * @param driver - The e2e driver bound to the page.
 */
export async function waitForHomePage(driver: Driver): Promise<void> {
  await new HomePage(driver).checkPageIsLoaded();
}

/**
 * Reports whether the unlocked wallet header is shown.
 *
 * @param driver - The e2e driver bound to the page.
 * @param timeoutMs - Maximum time to wait for the header.
 * @returns Whether the header is visible.
 */
export async function isWalletHeaderVisible(
  driver: Driver,
  timeoutMs: number,
): Promise<boolean> {
  try {
    await new HeaderNavbar(withTimeout(driver, timeoutMs)).checkPageIsLoaded();
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the balance from the home page, or `null` when it is not shown.
 *
 * @param driver - The e2e driver bound to the page.
 * @param timeoutMs - Maximum time to wait for the balance.
 * @returns The balance text, or `null`.
 */
export async function readHomeBalance(
  driver: Driver,
  timeoutMs: number,
): Promise<string | null> {
  try {
    return (await new HomePage(driver).getBalance(timeoutMs)) || null;
  } catch {
    return null;
  }
}
