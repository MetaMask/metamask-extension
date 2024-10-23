import { Driver } from '../../webdriver/driver';
import OnboardingMetricsPage from '../pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../pages/onboarding/start-onboarding-page';
import SecureWalletPage from '../pages/onboarding/secure-wallet-page';
import OnboardingCompletePage from '../pages/onboarding/onboarding-complete-page';

export const importSRPOnboardingFlow = async (driver: Driver) => {
  console.log('start import srp onboarding flow ');
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
  await onboardingSrpPage.fillSrp();
  await onboardingSrpPage.clickConfirmButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.check_pageIsLoaded();
  await onboardingPasswordPage.createImportedWalletPassword();
};

export const completeCreateNewWalletOnboardingFlow = async (driver: Driver) => {
  console.log('start to complete create new wallet onboarding flow ');
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
  await onboardingPasswordPage.createWalletPassword();

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.check_pageIsLoaded();
  await secureWalletPage.revealAndConfirmSRP();

  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.check_congratulationsMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();
};

export const completeImportSRPOnboardingFlow = async (driver: Driver) => {
  console.log('start to complete import srp onboarding flow ');
  await importSRPOnboardingFlow(driver);
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();
};
