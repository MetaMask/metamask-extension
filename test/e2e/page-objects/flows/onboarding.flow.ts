import { Driver } from '../../webdriver/driver';
import OnboardingMetricsPage from '../pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../pages/onboarding/start-onboarding-page';
import SecureWalletPage from '../pages/onboarding/secure-wallet-page';
import OnboardingCompletePage from '../pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../pages/onboarding/onboarding-privacy-settings-page';
import { WALLET_PASSWORD } from '../../helpers';
import { E2E_SRP } from '../../default-fixture';

/**
 * Create new wallet onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to create. Defaults to WALLET_PASSWORD.
 * @param [options.participateInMetaMetrics] - Whether to participate in MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 */
export const createNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  password?: string;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
}): Promise<void> => {
  console.log('Starting the creation of a new wallet onboarding flow');
  if (needNavigateToNewPage) {
    await driver.navigate();
  }
  const startOnboardingPage = new StartOnboardingPage(driver);
  await startOnboardingPage.check_pageIsLoaded();
  await startOnboardingPage.checkTermsCheckbox();
  await startOnboardingPage.clickCreateWalletButton();

  const onboardingMetricsPage = new OnboardingMetricsPage(driver);
  await onboardingMetricsPage.check_pageIsLoaded();
  if (dataCollectionForMarketing) {
    await onboardingMetricsPage.clickDataCollectionForMarketingCheckbox();
  }
  if (participateInMetaMetrics) {
    await onboardingMetricsPage.clickIAgreeButton();
  } else {
    await onboardingMetricsPage.clickNoThanksButton();
  }

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.check_pageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.check_pageIsLoaded();
  await secureWalletPage.revealAndConfirmSRP();
};

/**
 * Incomplete create new wallet onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 * @param [options.participateInMetaMetrics] - Whether to participate in MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 */
export const incompleteCreateNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  password?: string;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
}): Promise<void> => {
  console.log('Starting the creation of a new wallet onboarding flow');
  if (needNavigateToNewPage) {
    await driver.navigate();
  }
  const startOnboardingPage = new StartOnboardingPage(driver);
  await startOnboardingPage.check_pageIsLoaded();
  await startOnboardingPage.checkTermsCheckbox();
  await startOnboardingPage.clickCreateWalletButton();

  const onboardingMetricsPage = new OnboardingMetricsPage(driver);
  await onboardingMetricsPage.check_pageIsLoaded();
  if (dataCollectionForMarketing) {
    await onboardingMetricsPage.clickDataCollectionForMarketingCheckbox();
  }
  if (participateInMetaMetrics) {
    await onboardingMetricsPage.clickIAgreeButton();
  } else {
    await onboardingMetricsPage.clickNoThanksButton();
  }

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.check_pageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.check_pageIsLoaded();
  await secureWalletPage.revealAndDoNotConfirmSRP();
};

/**
 * Import SRP onboarding flow
 *
 * @param params - The parameters for the onboarding flow.
 * @param params.driver - The WebDriver instance to control the browser.
 * @param params.seedPhrase - The seed phrase to import. Defaults to E2E_SRP.
 * @param params.password - The password to set for the imported wallet. Defaults to WALLET_PASSWORD.
 * @param params.fillSrpWordByWord - Whether to fill the SRP word by word. Defaults to false.
 * @param params.participateInMetaMetrics - Whether to participate in MetaMetrics. Defaults to false.
 * @param params.dataCollectionForMarketing - Whether to enable data collection for marketing. Defaults to false.
 * @returns A promise that resolves when the onboarding flow is complete.
 */
export const importSRPOnboardingFlow = async ({
  driver,
  seedPhrase = E2E_SRP,
  password = WALLET_PASSWORD,
  fillSrpWordByWord = false,
  participateInMetaMetrics = false,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  seedPhrase?: string;
  password?: string;
  fillSrpWordByWord?: boolean;
  participateInMetaMetrics?: boolean;
  dataCollectionForMarketing?: boolean;
}): Promise<void> => {
  console.log('Starting the import of SRP onboarding flow');
  await driver.navigate();

  const startOnboardingPage = new StartOnboardingPage(driver);
  await startOnboardingPage.check_pageIsLoaded();
  await startOnboardingPage.checkTermsCheckbox();
  await startOnboardingPage.clickImportWalletButton();

  const onboardingMetricsPage = new OnboardingMetricsPage(driver);
  await onboardingMetricsPage.check_pageIsLoaded();
  if (dataCollectionForMarketing) {
    await onboardingMetricsPage.clickDataCollectionForMarketingCheckbox();
  }
  if (participateInMetaMetrics) {
    await onboardingMetricsPage.clickIAgreeButton();
  } else {
    await onboardingMetricsPage.clickNoThanksButton();
  }

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
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 * @param [options.participateInMetaMetrics] - Whether to participate in MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 */
export const completeCreateNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  password?: string;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
}): Promise<void> => {
  console.log('start to complete create new wallet onboarding flow ');
  await createNewWalletOnboardingFlow({
    driver,
    password,
    participateInMetaMetrics,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });
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
 * @param [options.participateInMetaMetrics] - Whether to participate in MetaMetrics. Defaults to false.
 * @param [options.dataCollectionForMarketing] - Whether to enable data collection for marketing. Defaults to false.
 * @returns A promise that resolves when the onboarding flow is complete.
 */
export const completeImportSRPOnboardingFlow = async ({
  driver,
  seedPhrase = E2E_SRP,
  password = WALLET_PASSWORD,
  fillSrpWordByWord = false,
  participateInMetaMetrics = false,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  seedPhrase?: string;
  password?: string;
  fillSrpWordByWord?: boolean;
  participateInMetaMetrics?: boolean;
  dataCollectionForMarketing?: boolean;
}): Promise<void> => {
  console.log('Starting to complete import SRP onboarding flow');
  await importSRPOnboardingFlow({
    driver,
    seedPhrase,
    password,
    fillSrpWordByWord,
    participateInMetaMetrics,
    dataCollectionForMarketing,
  });

  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();
};

/**
 * Complete create new wallet onboarding flow with custom privacy settings.
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param options.password - The password to use. Defaults to WALLET_PASSWORD.
 * @param options.needNavigateToNewPage - Whether to navigate to new page to start the onboarding flow. Defaults to true.
 * @param options.toggleBasicFunctionality - Indicates if basic functionalities should be opted out. Defaults to true.
 * @param options.toggleAssetsPrivacy - Indicates if assets privacy functionalities should be opted out. Defaults to true.
 */
export const completeCreateNewWalletOnboardingFlowWithCustomSettings = async ({
  driver,
  password = WALLET_PASSWORD,
  needNavigateToNewPage = true,
  toggleBasicFunctionality = true,
  toggleAssetsPrivacy = true,
}: {
  driver: Driver;
  password?: string;
  needNavigateToNewPage?: boolean;
  toggleBasicFunctionality?: boolean;
  toggleAssetsPrivacy?: boolean;
}): Promise<void> => {
  await createNewWalletOnboardingFlow({
    driver,
    password,
    needNavigateToNewPage,
  });
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.navigateToDefaultPrivacySettings();

  const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
    driver,
  );
  if (toggleBasicFunctionality) {
    await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
  }
  if (toggleAssetsPrivacy) {
    await onboardingPrivacySettingsPage.toggleAssetsSettings();
  }

  await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();
  await onboardingCompletePage.check_pageIsLoaded();
  await onboardingCompletePage.completeOnboarding();
};
