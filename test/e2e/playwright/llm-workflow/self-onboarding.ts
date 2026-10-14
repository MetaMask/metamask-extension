import { importSRPOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import LoginPage from '../../page-objects/pages/onboarding/login-page';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import type { Driver } from '../../webdriver/driver';
import type { ScreenName } from './launcher-types';
import { SCREEN_CHECKS, waitForAnyScreen } from './launcher/state-inspector';

const CANARY_SRP_PREFIX = 'CANARY-NOT-A-REAL-SRP-';

const FINISH_SCREENS: ScreenName[] = ['onboarding-complete', 'unlock', 'home'];
const FINISH_SCREEN_CHECKS = SCREEN_CHECKS.filter(({ screen }) =>
  FINISH_SCREENS.includes(screen),
);
const MAX_FINISH_STEPS = 3;

/**
 * Normalizes a secret recovery phrase to single-spaced words.
 *
 * @param phrase - The phrase supplied by the caller.
 * @returns The normalized phrase.
 */
export function normalizeSecretRecoveryPhrase(phrase: string): string {
  const words = phrase
    .trim()
    .split(/\s+/u)
    .filter((word) => word.length > 0);
  if (words.length !== 12 && words.length !== 24) {
    throw new Error('secret recovery phrase must be 12 or 24 words');
  }
  if (phrase.trim().startsWith(CANARY_SRP_PREFIX)) {
    throw new Error('marker strings cannot onboard MetaMask');
  }
  return words.join(' ');
}

/**
 * Finishes onboarding from wherever the UI is: the completion page, or the
 * unlock page the UI shows when the wallet locks before onboarding completes.
 * Returns once home is shown or the completion page has been confirmed.
 *
 * @param driver - The e2e driver bound to the extension page.
 * @param password - The wallet password, used to unlock.
 */
export async function finishOnboarding(
  driver: Driver,
  password: string,
): Promise<void> {
  for (let step = 0; step < MAX_FINISH_STEPS; step++) {
    const { screen } = await waitForAnyScreen(driver, FINISH_SCREEN_CHECKS);
    if (screen === 'home') {
      return;
    }
    if (screen === 'onboarding-complete') {
      await new OnboardingCompletePage(driver).completeOnboarding();
      return;
    }
    await new LoginPage(driver).loginToHomepage(password);
  }
  throw new Error('onboarding did not finish after unlocking');
}

/**
 * Imports `phrase` by walking the onboarding UI with the e2e onboarding flow,
 * so a UI change that breaks it also fails the e2e suite.
 *
 * The completion screen is finished here rather than through
 * `completeImportSRPOnboardingFlow`, whose sidepanel handling uses the raw
 * Selenium driver; the launcher navigates home itself afterwards.
 *
 * @param driver - The e2e driver bound to the extension page, which must be
 * on the onboarding welcome screen.
 * @param phrase - The secret recovery phrase to import.
 * @param password - The wallet password to set, so the wallet can be
 * unlocked again later.
 */
export async function runSelfOnboarding(
  driver: Driver,
  phrase: string,
  password: string,
): Promise<void> {
  const seedPhrase = normalizeSecretRecoveryPhrase(phrase);
  try {
    await importSRPOnboardingFlow({
      driver,
      seedPhrase,
      password,
      needNavigateToNewPage: false,
    });
    await finishOnboarding(driver, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.length > 0 && !message.includes(seedPhrase)) {
      throw new Error(`self-onboarding failed: ${message}`);
    }
    throw new Error('self-onboarding failed');
  }
}
