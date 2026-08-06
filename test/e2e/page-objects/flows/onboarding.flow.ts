import { Browser } from 'selenium-webdriver';
import { getCleanAppState } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import OnboardingMetricsPage from '../pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../pages/onboarding/onboarding-password-page';
import OnboardingSrpPage from '../pages/onboarding/onboarding-srp-page';
import StartOnboardingPage from '../pages/onboarding/start-onboarding-page';
import SecureWalletPage from '../pages/onboarding/secure-wallet-page';
import SetupPasskeyPage from '../pages/onboarding/setup-passkey-page';
import OnboardingCompletePage from '../pages/onboarding/onboarding-complete-page';
import OnboardingPrivacySettingsPage from '../pages/onboarding/onboarding-privacy-settings-page';
import { E2E_SRP, WALLET_PASSWORD } from '../../constants';
import HeaderNavbar from '../pages/header-navbar';
import HomePage from '../pages/home/homepage';
import LoginPage from '../pages/login-page';
import TermsOfUseUpdateModal from '../pages/dialog/terms-of-use-update-modal';
import { AuthConnection } from '../../../../shared/constants/onboarding';

export type OnboardingMetricsFlowOptions = {
  optedIn?: boolean;
  consentDecisionMade?: boolean;
  dataCollectionForMarketing?: boolean;
};

/**
 * Helper function to handle post-onboarding navigation for sidepanel builds.
 * When sidepanel is enabled, clicking "Done" opens the home page in the sidepanel,
 * but the main window remains on the onboarding completion page.
 * This function navigates the current window to the actual home page.
 * Note: Sidepanel is only supported on Chrome-based browsers, not Firefox.
 *
 * @param driver - The WebDriver instance
 */
export const handleSidepanelPostOnboarding = async (
  driver: Driver,
): Promise<void> => {
  // Only run when sidepanel is actually enabled on Chrome
  const isSidepanelEnabled = process.env.SELENIUM_BROWSER === 'chrome';

  if (!isSidepanelEnabled) {
    return;
  }

  // Give the onboarding completion time to process (needed for sidepanel)
  await driver.delay(2000);

  // Navigate directly to home page in current window
  // With sidepanel enabled, this ensures we load home page in the test window
  await driver.driver.get(`${driver.extensionUrl}/home.html`);

  // Wait for the home page to fully load
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.checkPageIsLoaded();
};

/**
 * Navigate to the onboarding welcome login page
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.optedIn] - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 */
export const goToOnboardingWelcomeLoginPage = async ({
  driver,
  optedIn = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  needNavigateToNewPage?: boolean;
} & OnboardingMetricsFlowOptions) => {
  const metricsOptions = {
    optedIn,
    dataCollectionForMarketing,
  };
  if (needNavigateToNewPage) {
    await driver.navigate();
  }
  if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
    await onboardingMetricsFlow(driver, metricsOptions);
  }

  const startOnboardingPage = new StartOnboardingPage(driver);
  await startOnboardingPage.checkLoginPageIsLoaded();

  return startOnboardingPage;
};

const assertTermsOfUsageAndPrivacyLinksOnCreateLoginOptions = async (
  startOnboardingPage: StartOnboardingPage,
): Promise<void> => {
  await startOnboardingPage.clickCreateWalletButton();
  await startOnboardingPage.checkTermsOfUsageAndPrivacyLinksAreVisible();
};

const assertTermsOfUsageAndPrivacyLinksOnImportLoginOptions = async (
  startOnboardingPage: StartOnboardingPage,
): Promise<void> => {
  await startOnboardingPage.clickImportWalletButton();
  await startOnboardingPage.checkTermsOfUsageAndPrivacyLinksAreVisible(
    'import',
  );
};

/**
 * Skip the passkey setup page when it is presented during onboarding.
 *
 * Note: Passkey setup page is only shown for the non-social login flows.
 *
 * @param driver - The WebDriver instance.
 * @param options - The options object.
 * @param [options.timeout] - The time to wait for the page to appear.
 */
export const skipPasskeySetup = async (
  driver: Driver,
  { timeout = 5000 }: { timeout?: number } = {},
): Promise<void> => {
  // passkey setup is only shown for chrome
  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    const setupPasskeyPage = new SetupPasskeyPage(driver);

    await setupPasskeyPage.checkPageIsLoaded(timeout);
    await setupPasskeyPage.skipPasskeySetup();
  }
};

/**
 * Create new wallet with social login onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param options.password - The password to create. Defaults to WALLET_PASSWORD.
 * @param options.optedIn - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param options.needNavigateToNewPage - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param options.dataCollectionForMarketing - Whether to opt in to data collection for marketing. Defaults to false.
 * @param options.authConnection - The authentication connection to use. Defaults to AuthConnection.Google.
 */
export const createNewWalletWithSocialLoginOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  authConnection = AuthConnection.Google,
  optedIn = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  password?: string;
  authConnection?: AuthConnection;
  needNavigateToNewPage?: boolean;
} & OnboardingMetricsFlowOptions) => {
  console.log(
    'Starting the creation of a new wallet with social login onboarding flow',
  );
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    optedIn,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });

  const originalWindowHandle = await driver.getCurrentWindowHandle();
  await assertTermsOfUsageAndPrivacyLinksOnCreateLoginOptions(
    startOnboardingPage,
  );
  await startOnboardingPage.clickCreateWalletSocialLoginButton(authConnection);

  if (authConnection === AuthConnection.Telegram) {
    await recoverFromTelegramAuthTab({
      driver,
      originalWindowHandle,
    });
  }

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();

  await onboardingPasswordPage.createWalletPassword(password);
};

/**
 * Import wallet with social login onboarding flow
 *
 * @param options - The options object.
 * @param options.authConnection - The auth connection (social login type) to use. Defaults to AuthConnection.Google.
 * @param options.driver - The WebDriver instance.
 * @param options.password - The password to create. Defaults to WALLET_PASSWORD.
 * @param options.optedIn - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param options.needNavigateToNewPage - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param options.dataCollectionForMarketing - Whether to opt in to data collection for marketing. Defaults to false.
 */

export const importWalletWithSocialLoginOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  optedIn = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
  authConnection = AuthConnection.Google,
}: {
  driver: Driver;
  newWallet?: boolean;
  password?: string;
  needNavigateToNewPage?: boolean;
  authConnection?: AuthConnection;
} & OnboardingMetricsFlowOptions) => {
  console.log('Starting the rehydration of a wallet onboarding flow');
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    optedIn,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });

  const originalWindowHandle = await driver.getCurrentWindowHandle();
  await assertTermsOfUsageAndPrivacyLinksOnImportLoginOptions(
    startOnboardingPage,
  );
  await startOnboardingPage.clickImportWalletSocialLoginButton(authConnection);

  if (authConnection === AuthConnection.Telegram) {
    await recoverFromTelegramAuthTab({
      driver,
      originalWindowHandle,
    });
  }

  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();
  await loginPage.loginToHomepage(password);

  // if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
  //   await onboardingMetricsFlow(driver, {
  //     optedIn: true,
  //     dataCollectionForMarketing: true,
  //   });
  // }
};

async function recoverFromTelegramAuthTab({
  driver,
  originalWindowHandle,
}: {
  driver: Driver;
  originalWindowHandle: string;
}): Promise<void> {
  // OAuthService resolves after the redirect is handled and the auth tab close
  // is already in flight, so the E2E flow only needs to restore focus.
  await driver.switchToWindow(originalWindowHandle);
}

/**
 * Create new wallet onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to create. Defaults to WALLET_PASSWORD.
 * @param [options.optedIn] - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 * @param [options.skipSRPBackup] - Whether to skip the SRP backup step. Defaults to false.
 * @param [options.socialLoginEnabled] - Indicates if social login feature is enabled. Defaults to true.
 */
export const createNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  optedIn = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
  skipSRPBackup = false,
  socialLoginEnabled = true,
}: {
  driver: Driver;
  password?: string;
  needNavigateToNewPage?: boolean;
  skipSRPBackup?: boolean;
  socialLoginEnabled?: boolean;
} & OnboardingMetricsFlowOptions): Promise<void> => {
  const metricsOptions = {
    optedIn,
    dataCollectionForMarketing,
  };
  console.log('Starting the creation of a new wallet onboarding flow');
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    ...metricsOptions,
    needNavigateToNewPage,
  });
  await assertTermsOfUsageAndPrivacyLinksOnCreateLoginOptions(
    startOnboardingPage,
  );
  if (socialLoginEnabled) {
    await startOnboardingPage.clickCreateWithSrpButton();
  }

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);
  await skipPasskeySetup(driver);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();

  if (skipSRPBackup) {
    await secureWalletPage.skipSRPBackup();
  } else {
    await secureWalletPage.revealAndConfirmSRP();
  }

  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    await onboardingMetricsFlow(driver, metricsOptions);
  }
};

/**
 * Incomplete create new wallet onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 * @param [options.optedIn] - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 */
export const incompleteCreateNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  optedIn = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
}: {
  driver: Driver;
  password?: string;
  needNavigateToNewPage?: boolean;
  dataCollectionForMarketing?: boolean;
} & OnboardingMetricsFlowOptions): Promise<void> => {
  console.log('Starting the creation of a new wallet onboarding flow');
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    optedIn,
    needNavigateToNewPage,
    dataCollectionForMarketing,
  });
  await assertTermsOfUsageAndPrivacyLinksOnCreateLoginOptions(
    startOnboardingPage,
  );
  await startOnboardingPage.clickCreateWithSrpButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);
  await skipPasskeySetup(driver);

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();
  await secureWalletPage.revealAndDoNotConfirmSRP();
};

/**
 * Handle the onboarding metrics page flow
 *
 * @param driver - The WebDriver instance to control the browser
 * @param options - The options object
 * @param [options.optedIn] - Whether the user has opted in to MetaMetrics. Defaults to false
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false
 */
export async function onboardingMetricsFlow(
  driver: Driver,
  options: OnboardingMetricsFlowOptions = {},
) {
  const { optedIn = false, dataCollectionForMarketing = false } = options;
  const onboardingMetricsPage = new OnboardingMetricsPage(driver);
  await onboardingMetricsPage.checkPageIsLoaded();
  if (dataCollectionForMarketing) {
    await onboardingMetricsPage.clickDataCollectionForMarketingCheckbox();
    await onboardingMetricsPage.validateDataCollectionForMarketingIsChecked();
  }

  // The participate in MetaMetrics checkbox defaults to checked, but may
  // already reflect a previously saved value (e.g. after vault recovery).
  // - If opting in (true): do not click; just validate it's checked.
  // - If opting out (false): ensure it's unchecked without assuming its
  //   current state, to avoid accidentally re-checking it.
  if (optedIn) {
    await onboardingMetricsPage.validateParticipateInMetaMetricsIsChecked();
  } else {
    await onboardingMetricsPage.ensureParticipateInMetaMetricsIsUnchecked();
  }

  await onboardingMetricsPage.clickOnContinueButton();
  // Wait for the analytics ID to be present so subsequent screens track events
  // immediately and deterministically.
  if (optedIn) {
    await driver.wait(async () => {
      const uiState = await getCleanAppState(driver);
      return Boolean(uiState?.metamask?.analyticsId);
    }, driver.timeout);
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
 * @param params.optedIn - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param params.dataCollectionForMarketing - Whether to enable data collection for marketing. Defaults to false.
 * @param params.needNavigateToNewPage - Whether to navigate to a new page before starting. Defaults to true.
 * @returns A promise that resolves when the onboarding flow is complete.
 */
export const importSRPOnboardingFlow = async ({
  driver,
  seedPhrase = E2E_SRP,
  password = WALLET_PASSWORD,
  fillSrpWordByWord = false,
  optedIn = false,
  dataCollectionForMarketing = false,
  needNavigateToNewPage = true,
}: {
  driver: Driver;
  seedPhrase?: string;
  password?: string;
  fillSrpWordByWord?: boolean;
  needNavigateToNewPage?: boolean;
} & OnboardingMetricsFlowOptions): Promise<void> => {
  const metricsOptions = {
    optedIn,
    dataCollectionForMarketing,
  };
  console.log('Starting the import of SRP onboarding flow');
  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    ...metricsOptions,
    needNavigateToNewPage,
  });
  await assertTermsOfUsageAndPrivacyLinksOnImportLoginOptions(
    startOnboardingPage,
  );
  await startOnboardingPage.clickImportWithSrpButton();

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
  await skipPasskeySetup(driver);

  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    await onboardingMetricsFlow(driver, metricsOptions);
  }
};

/**
 * Complete create new wallet onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 * @param [options.optedIn] - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param [options.needNavigateToNewPage] - Indicates whether to navigate to a new page before starting the onboarding flow. Defaults to true.
 * @param [options.dataCollectionForMarketing] - Whether to opt in to data collection for marketing. Defaults to false.
 * @param [options.skipSRPBackup] - Whether to skip the SRP backup step. Defaults to false.
 */
export const completeCreateNewWalletOnboardingFlow = async ({
  driver,
  password = WALLET_PASSWORD,
  optedIn = false,
  needNavigateToNewPage = true,
  dataCollectionForMarketing = false,
  skipSRPBackup = false,
}: {
  driver: Driver;
  password?: string;
  needNavigateToNewPage?: boolean;
  skipSRPBackup?: boolean;
} & OnboardingMetricsFlowOptions): Promise<void> => {
  console.log('start to complete create new wallet onboarding flow ');
  await createNewWalletOnboardingFlow({
    driver,
    password,
    optedIn,
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

  await handleSidepanelPostOnboarding(driver);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForLoadingOverlayToDisappear();
};

/**
 * Complete create new wallet onboarding flow with passkey enrollment.
 * Uses the real WebAuthn enrollment flow (requires a virtual authenticator
 * to be attached to the browser before calling this).
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 */
export const completeOnboardingWithPasskey = async ({
  driver,
  password = WALLET_PASSWORD,
}: {
  driver: Driver;
  password?: string;
}): Promise<void> => {
  console.log('Starting onboarding with passkey enrollment');

  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    optedIn: false,
    needNavigateToNewPage: true,
    dataCollectionForMarketing: false,
  });
  await assertTermsOfUsageAndPrivacyLinksOnCreateLoginOptions(
    startOnboardingPage,
  );
  await startOnboardingPage.clickCreateWithSrpButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  const setupPasskeyPage = new SetupPasskeyPage(driver);
  await setupPasskeyPage.checkPageIsLoaded();
  await setupPasskeyPage.clickSetUpPasskey();
  await setupPasskeyPage.waitForEnrollmentSteps();
  await setupPasskeyPage.waitForEnrollmentSuccess();

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();
  await secureWalletPage.revealAndConfirmSRP();

  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    await onboardingMetricsFlow(driver);
  }

  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();

  await handleSidepanelPostOnboarding(driver);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForLoadingOverlayToDisappear();
};

/**
 * Complete import SRP onboarding flow with passkey enrollment.
 * Uses the real WebAuthn enrollment flow (requires a virtual authenticator
 * to be attached to the browser before calling this).
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.seedPhrase] - The seed phrase to import. Defaults to E2E_SRP.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 */
export const completeImportSRPOnboardingWithPasskey = async ({
  driver,
  seedPhrase = E2E_SRP,
  password = WALLET_PASSWORD,
}: {
  driver: Driver;
  seedPhrase?: string;
  password?: string;
}): Promise<void> => {
  console.log('Starting import SRP onboarding with passkey enrollment');

  const startOnboardingPage = await goToOnboardingWelcomeLoginPage({
    driver,
    optedIn: false,
    needNavigateToNewPage: true,
    dataCollectionForMarketing: false,
  });
  await assertTermsOfUsageAndPrivacyLinksOnImportLoginOptions(
    startOnboardingPage,
  );
  await startOnboardingPage.clickImportWithSrpButton();

  const onboardingSrpPage = new OnboardingSrpPage(driver);
  await onboardingSrpPage.checkPageIsLoaded();
  await onboardingSrpPage.fillSrp(seedPhrase);
  await onboardingSrpPage.clickConfirmButton();

  const onboardingPasswordPage = new OnboardingPasswordPage(driver);
  await onboardingPasswordPage.checkPageIsLoaded();
  await onboardingPasswordPage.createWalletPassword(password);

  const setupPasskeyPage = new SetupPasskeyPage(driver);
  await setupPasskeyPage.checkPageIsLoaded();
  await setupPasskeyPage.clickSetUpPasskey();
  await setupPasskeyPage.waitForEnrollmentSteps();
  await setupPasskeyPage.waitForEnrollmentSuccess();

  if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
    await onboardingMetricsFlow(driver);
  }

  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
  await onboardingCompletePage.completeOnboarding();

  await handleSidepanelPostOnboarding(driver);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForLoadingOverlayToDisappear();
};

/**
 * Complete import SRP onboarding flow
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param [options.seedPhrase] - The seed phrase to import. Defaults to E2E_SRP.
 * @param [options.password] - The password to use. Defaults to WALLET_PASSWORD.
 * @param [options.fillSrpWordByWord] - Whether to fill the SRP word by word. Defaults to false.
 * @param [options.optedIn] - Whether the user has opted in to MetaMetrics. Defaults to false.
 * @param [options.dataCollectionForMarketing] - Whether to enable data collection for marketing. Defaults to false.
 * @param [options.needNavigateToNewPage] - Whether to navigate to a new page before starting. Defaults to true.
 * @returns A promise that resolves when the onboarding flow is complete.
 */
export const completeImportSRPOnboardingFlow = async ({
  driver,
  seedPhrase = E2E_SRP,
  password = WALLET_PASSWORD,
  fillSrpWordByWord = false,
  optedIn = false,
  dataCollectionForMarketing = false,
  needNavigateToNewPage = true,
}: {
  driver: Driver;
  seedPhrase?: string;
  password?: string;
  fillSrpWordByWord?: boolean;
  needNavigateToNewPage?: boolean;
} & OnboardingMetricsFlowOptions): Promise<void> => {
  console.log('Starting to complete import SRP onboarding flow');
  await importSRPOnboardingFlow({
    driver,
    seedPhrase,
    password,
    fillSrpWordByWord,
    optedIn,
    dataCollectionForMarketing,
    needNavigateToNewPage,
  });

  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

  await onboardingCompletePage.completeOnboarding();

  // Handle sidepanel navigation if needed
  await handleSidepanelPostOnboarding(driver);
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
  if (process.env.SELENIUM_BROWSER === Browser.CHROME) {
    // wait for the sidepanel to open
    await driver.delay(3000);
  }

  await handleSidepanelPostOnboarding(driver);
};

/**
 * Add custom network in onboarding privacy settings, then finish onboarding,
 * navigate to home, and enable “Show test networks” from Settings → Networks
 * before any later flow that switches the asset list to Localhost (e.g. wallet
 * fixture export).
 *
 * @param options - The options object.
 * @param options.driver - The WebDriver instance.
 * @param options.networkName - The name of the custom network.
 * @param options.chainId - The chain ID of the custom network.
 * @param options.currencySymbol - The currency symbol for the network.
 * @param options.networkUrl - The RPC URL for the network.
 */
export const addCustomNetworkInOnboardingPrivacySettings = async ({
  driver,
  networkName,
  chainId,
  currencySymbol,
  networkUrl,
}: {
  driver: Driver;
  networkName: string;
  chainId: number;
  currencySymbol: string;
  networkUrl: string;
}): Promise<void> => {
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
  await onboardingCompletePage.navigateToDefaultPrivacySettings();

  const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
    driver,
  );

  await onboardingPrivacySettingsPage.addCustomNetwork(
    networkName,
    chainId,
    currencySymbol,
    networkUrl,
  );

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
    optedIn: false,
    dataCollectionForMarketing: false,
  });

  const secureWalletPage = new SecureWalletPage(driver);
  await secureWalletPage.checkPageIsLoaded();
  await secureWalletPage.skipSRPBackup();

  // finish up onboarding screens
  const onboardingCompletePage = new OnboardingCompletePage(driver);
  await onboardingCompletePage.checkPageIsLoaded();
  await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();

  await onboardingCompletePage.completeOnboarding();

  await handleSidepanelPostOnboarding(driver);

  // Because our state was reset, and the flow skips the welcome screen, we now
  // need to accept the terms of use again. Must handle this BEFORE checking
  // homepage is loaded, as the modal blocks the homepage elements.
  const updateTermsOfUseModal = new TermsOfUseUpdateModal(driver);
  await updateTermsOfUseModal.checkPageIsLoaded();
  await updateTermsOfUseModal.confirmAcceptTermsOfUseUpdate();

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
};
