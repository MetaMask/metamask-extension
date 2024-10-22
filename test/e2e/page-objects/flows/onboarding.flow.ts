import { Driver } from '../../webdriver/driver';
import OnboardingMetricsPage from '../pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../pages/onboarding/start-onboarding-page';

export const importSRPOnboardingFlow = async (
  driver: Driver,
) => {
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
  await onboardingPasswordPage.fillPassword();
};