import { Driver } from '../../webdriver/driver';
import OnboardingMetricsPage from '../pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../pages/onboarding/start-onboarding-page';
import SecureWalletPage from '../pages/onboarding/secure-wallet-page';
import OnboardingCompletePage from '../pages/onboarding/onboarding-complete-page';
import { WALLET_PASSWORD } from '../../helpers';
import { E2E_SRP } from '../../default-fixture';

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
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.seedPhrase] - The seed phrase to import. Defaults to E2E_SRP.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 * @param [options.fillSrpWordByWord] - Whether to fill the SRP word by word. Defaults to false.
 */
export const importSRPOnboardingFlow = async ({
  driver,
  seedPhrase = E2E_SRP,
  password = WALLET_PASSWORD,
  fillSrpWordByWord = false,
}: {
  driver: Driver;
  seedPhrase?: string;
  password?: string;
  fillSrpWordByWord?: boolean;
}): Promise<void> => {
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
  if (fillSrpWordByWord) {
    await onboardingSrpPage.fillSrpWordByWord(seedPhrase);
  } else {
    await onboardingSrpPage.fillSrp(seedPhrase);
  }
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
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.seedPhrase] - The seed phrase to import. Defaults to E2E_SRP.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 * @param [options.fillSrpWordByWord] - Whether to fill the SRP word by word. Defaults to false.
 * @returns A promise that resolves when the onboarding flow is complete.
 */
export const completeImportSRPOnboardingFlow = async ({
  driver,
  seedPhrase = E2E_SRP,
  password = WALLET_PASSWORD,
  fillSrpWordByWord = false,
}: {
  driver: Driver;
  seedPhrase?: string;
  password?: string;
  fillSrpWordByWord?: boolean;
}): Promise<void> => {
  console.log('Starting to complete import SRP onboarding flow');
  await importSRPOnboardingFlow({
    driver,
    seedPhrase,
    password,
    fillSrpWordByWord,
  });

  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();
};
