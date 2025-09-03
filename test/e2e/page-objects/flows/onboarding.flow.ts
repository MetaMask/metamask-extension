import { Browser } from 'selenium-webdriver';
import { AuthConnection } from '@metamask/seedless-onboarding-controller';
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
import HomePage from '../pages/home/homepage';
import LoginPage from '../pages/login-page';
import TermsOfUseUpdateModal from '../pages/dialog/terms-of-use-update-modal';

/**
 * Navigate to the onboarding welcome login page
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.participateInMetaMetrics] - Whether to participate in MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 * @returns A promise that resolves when the onboarding welcome login page is loaded.
 */
const goToOnboardingWelcomeLoginPage = async ({
  driver,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
}) => {
  if (needNavigateToNewPage) {
    await driver.navigate();
  }

  if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
    await onboardingMetricsFlow(driver, {
      participateInMetaMetrics,
      dataCollectionForMarketing,
    });
  }

  const startOnboardingPage = new StartOnboardingPage(driver);
  // await startOnboardingPage.checkBannerPageIsLoaded();
  // await startOnboardingPage.agreeToTermsOfUse();
  await startOnboardingPage.checkLoginPageIsLoaded();

  return startOnboardingPage;
};

/**
 * Create new wallet with social login onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param options.password - The password to create. Defaults to WALLET_PASSWORD.
 * @param options.participateInMetaMetrics - Whether to participate in MetaMetrics. Defaults to false.
 * @param options.needNavigateToNewPage - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param options.dataCollectionForMarketing - Whether to opt in to data collection for marketing. Defaults to false.
 * @param options.authConnection - The authentication connection to use. Defaults to AuthConnection.Google.
 */
export const createNewWalletWithSocialLoginOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  authConnection = AuthConnection.Google,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  password?: string;
  authConnection?: AuthConnection;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
}) => {
  console.log(
    'Starting the creation of a new wallet with social login onboarding flow',
  );
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    participateInMetaMetrics,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });

  await startOnboardingPage.createWalletWithSocialLogin(authConnection);
  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();

  await onboardingPasswordPage.createWalletPassword(password);

  // if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
  //   await onboardingMetricsFlow(driver, {
  //     participateInMetaMetrics: true,
  //     dataCollectionForMarketing: true,
  //   });
  // }
};

/**
 * Import wallet with social login onboarding flow
 *
 * @param options - The options object.
 * @param options.authConnection - The auth connection (social login type) to use. Defaults to AuthConnection.Google.
 * @param options.driver - The WebDriver instance.
 * @param options.password - The password to create. Defaults to WALLET_PASSWORD.
 * @param options.participateInMetaMetrics - Whether to participate in MetaMetrics. Defaults to false.
 * @param options.needNavigateToNewPage - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param options.dataCollectionForMarketing - Whether to opt in to data collection for marketing. Defaults to false.
 */

export const importWalletWithSocialLoginOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
  authConnection = AuthConnection.Google,
}: {
  driver: Driver;
  newWallet?: boolean;
  password?: string;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
  authConnection?: AuthConnection;
}) => {
  console.log('Starting the rehydration of a wallet onboarding flow');
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    participateInMetaMetrics,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });

  await startOnboardingPage.importWalletWithSocialLogin(authConnection);

  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();
  await loginPage.loginToHomepage(password);

  // if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
  //   await onboardingMetricsFlow(driver, {
  //     participateInMetaMetrics: true,
  //     dataCollectionForMarketing: true,
  //   });
  // }
};

/**
 * Create new wallet onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to create. Defaults to WALLET_PASSWORD.
 * @param [options.participateInMetaMetrics] - Whether to participate in MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 * @param [options.skipSRPBackup] - Whether to skip the SRP backup step. Defaults to false.
 * @param [options.socialLoginEnabled] - Indicates if social login feature is enabled. Defaults to true.
 */
export const createNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
  skipSRPBackup = false,
  socialLoginEnabled = true,
}: {
  driver: Driver;
  password?: string;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
  skipSRPBackup?: boolean;
  socialLoginEnabled?: boolean;
}): Promise<void> => {
  console.log('Starting the creation of a new wallet onboarding flow');
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    participateInMetaMetrics,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });
  await startOnboardingPage.createWalletWithSrp(socialLoginEnabled);

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();

  if (skipSRPBackup) {
    await secureWalletPage.skipSRPBackup();
  } else {
    await secureWalletPage.revealAndConfirmSRP();
  }

  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    await onboardingMetricsFlow(driver, {
      participateInMetaMetrics,
      dataCollectionForMarketing,
    });
  }
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
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    participateInMetaMetrics,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });
  await startOnboardingPage.createWalletWithSrp();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();
  await secureWalletPage.revealAndDoNotConfirmSRP();
};

/**
 * Handle the onboarding metrics page flow
 *
 * @param driver - The WebDriver instance to control the browser
 * @param options - The options object
 * @param [options.participateInMetaMetrics] - Whether to participate in MetaMetrics. Defaults to false
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false
 */
export async function onboardingMetricsFlow(
  driver: Driver,
  { participateInMetaMetrics = false, dataCollectionForMarketing = false } = {},
) {
  const onboardingMetricsPage = new OnboardingMetricsPage(driver);
  await onboardingMetricsPage.checkPageIsLoaded();
  if (dataCollectionForMarketing) {
    await onboardingMetricsPage.clickDataCollectionForMarketingCheckbox();
  }
  if (participateInMetaMetrics) {
    await onboardingMetricsPage.clickIAgreeButton();
  } else {
    await onboardingMetricsPage.clickNoThanksButton();
  }
}

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
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    participateInMetaMetrics,
    dataCollectionForMarketing,
  });
  await startOnboardingPage.importWallet();

  const onboardingSrpPage = new OnboardingSrpPage(driver);
  await onboardingSrpPage.checkPageIsLoaded();
  if (fillSrpWordByWord) {
    await onboardingSrpPage.fillSrpWordByWord(seedPhrase);
  } else {
    await onboardingSrpPage.fillSrp(seedPhrase);
  }
  await onboardingSrpPage.clickConfirmButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    await onboardingMetricsFlow(driver, {
      participateInMetaMetrics,
      dataCollectionForMarketing,
    });
  }
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
 * @param [options.skipSRPBackup] - Whether to skip the SRP backup step. Defaults to false.
 */
export const completeCreateNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  participateInMetaMetrics = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
  skipSRPBackup = false,
}: {
  driver: Driver;
  password?: string;
  participateInMetaMetrics?: boolean;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
  skipSRPBackup?: boolean;
}): Promise<void> => {
  console.log('start to complete create new wallet onboarding flow ');
  await createNewWalletOnboardingFlow({
    driver,
    password,
    participateInMetaMetrics,
    needNavigateToNewPage,
    dataCollectionForMarketing,
    skipSRPBackup,
  });
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  if (!skipSRPBackup) {
    await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
  }
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
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
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
 * @param options.socialLoginEnabled - Indicates if social login feature is enabled. Defaults to true.
 */
export const completeCreateNewWalletOnboardingFlowWithCustomSettings = async ({
  driver,
  password = WALLET_PASSWORD,
  needNavigateToNewPage = true,
  toggleBasicFunctionality = true,
  toggleAssetsPrivacy = true,
  socialLoginEnabled = true,
}: {
  driver: Driver;
  password?: string;
  needNavigateToNewPage?: boolean;
  toggleBasicFunctionality?: boolean;
  toggleAssetsPrivacy?: boolean;
  socialLoginEnabled?: boolean;
}): Promise<void> => {
  await createNewWalletOnboardingFlow({
    driver,
    password,
    needNavigateToNewPage,
    socialLoginEnabled,
  });
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
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
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.completeOnboarding();
};

/**
 * Complete recovery onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param options.password - The password to use. Defaults to WALLET_PASSWORD.
 */
export const completeVaultRecoveryOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
}: {
  driver: Driver;
  password?: string;
}): Promise<void> => {
  // after a vault recovery the Login page is displayed before the normal
  // onboarding flow.
  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();
  await loginPage.loginToHomepage(password);

  // complete metrics onboarding flow
  await onboardingMetricsFlow(driver, {
    participateInMetaMetrics: false,
    dataCollectionForMarketing: false,
  });

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();
  await secureWalletPage.skipSRPBackup();

  // finish up onboarding screens
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.completeOnboarding();

  const homePage = new HomePage(driver);
  homePage.checkPageIsLoaded();

  // Because our state was reset, and the flow skips the welcome screen, we now
  // need to accept the terms of use again
  const updateTermsOfUseModal = new TermsOfUseUpdateModal(driver);
  await updateTermsOfUseModal.checkPageIsLoaded();
  await updateTermsOfUseModal.confirmAcceptTermsOfUseUpdate();
};
