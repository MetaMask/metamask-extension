import { Driver } from '../../webdriver/driver';
import OnboardingMetricsPage from '../pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../pages/onboarding/start-onboarding-page';
import SecureWalletPage from '../pages/onboarding/secure-wallet-page';
import OnboardingCompletePage from '../pages/onboarding/onboarding-complete-page';
import { TEST_SEED_PHRASE, WALLET_PASSWORD } from '../../helpers';

/**
 * Create new wallet onboarding flow
 *
 * @param driver - The WebDriver instance.
 * @param password - The password to create. Defaults to WALLET_PASSWORD.
 */
export const createNewWalletOnboardingFlow = async (
  driver: Driver,
  password: string = WALLET_PASSWORD,
) => {
  console.log('Starting the creation of a new wallet onboarding flow');
  await driver.navigate();
  const startOnboardingPage = new StartOnboardingPage(driver);
  await startOnboardingPage.check_pageIsLoaded();
  await startOnboardingPage.checkTermsCheckbox();
  await startOnboardingPage.clickCreateWalletButton();

  const onboardingMetricsPage = new OnboardingMetricsPage(driver);
  await onboardingMetricsPage.check_pageIsLoaded();
  await onboardingMetricsPage.clickNoThanksButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.check_pageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.check_pageIsLoaded();
  await secureWalletPage.revealAndConfirmSRP();
};

/**
 * Import SRP onboarding flow
 *
 * @param driver - The WebDriver instance.
 * @param seedPhrase - The seed phrase to import. Defaults to TEST_SEED_PHRASE.
 * @param password - The password to use. Defaults to WALLET_PASSWORD.
 */
export const importSRPOnboardingFlow = async (
  driver: Driver,
  seedPhrase: string = TEST_SEED_PHRASE,
  password: string = WALLET_PASSWORD,
) => {
  console.log('Starting the import of SRP onboarding flow');
  await driver.navigate();
  const startOnboardingPage = new StartOnboardingPage(driver);
  await startOnboardingPage.check_pageIsLoaded();
  await startOnboardingPage.checkTermsCheckbox();
  await startOnboardingPage.clickImportWalletButton();

  const onboardingMetricsPage = new OnboardingMetricsPage(driver);
  await onboardingMetricsPage.check_pageIsLoaded();
  await onboardingMetricsPage.clickNoThanksButton();

  const onboardingSrpPage = new OnboardingSrpPage(driver);
  await onboardingSrpPage.check_pageIsLoaded();
  await onboardingSrpPage.fillSrp(seedPhrase);
  await onboardingSrpPage.clickConfirmButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.check_pageIsLoaded();
  await onboardingPasswordPage.createImportedWalletPassword(password);
};

/**
 * Complete create new wallet onboarding flow
 *
 * @param driver - The WebDriver instance.
 * @param password - The password to use. Defaults to WALLET_PASSWORD.
 */
export const completeCreateNewWalletOnboardingFlow = async (
  driver: Driver,
  password: string = WALLET_PASSWORD,
) => {
  console.log('start to complete create new wallet onboarding flow ');
  await createNewWalletOnboardingFlow(driver, password);
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.check_congratulationsMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();
};

/**
 * Complete import SRP onboarding flow
 *
 * @param driver - The WebDriver instance.
 * @param seedPhrase - The seed phrase to import. Defaults to TEST_SEED_PHRASE.
 * @param password - The password to use. Defaults to WALLET_PASSWORD.
 */
export const completeImportSRPOnboardingFlow = async (
  driver: Driver,
  seedPhrase: string = TEST_SEED_PHRASE,
  password: string = WALLET_PASSWORD,
) => {
  console.log('start to complete import srp onboarding flow ');
  await importSRPOnboardingFlow(driver, seedPhrase, password);
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();
};
