import {
  convertToHexValue,
  TEST_SEED_PHRASE,
  WALLET_PASSWORD,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import HomePage from '../../page-objects/pages/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import OnboardingPrivacySettingsPage from '../../page-objects/pages/onboarding/onboarding-privacy-settings-page';
import OnboardingSrpPage from '../../page-objects/pages/onboarding/onboarding-srp-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { switchToNetworkFlow } from '../../page-objects/flows/network.flow';

describe('MetaMask onboarding @no-mmi', function () {
  const ganacheOptions2 = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(10000000000000000000),
      },
    ],
  };

  it('Creates a new wallet, sets up a secure password, and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
        });
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();
      },
    );
  });

  it('Imports an existing wallet, sets up a secure password, and completes the onboarding process', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await completeImportSRPOnboardingFlow({ driver });
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedBalanceIsDisplayed();
      },
    );
  });

  it('Attempts to import a wallet with an incorrect Secret Recovery Phrase and verifies the error message', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const wrongSeedPhrase =
          'test test test test test test test test test test test test';
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
        await onboardingSrpPage.fillSrp(wrongSeedPhrase);

        // check the wrong SRP warning message is displayed
        await onboardingSrpPage.check_wrongSrpWarningMessage();
        await onboardingSrpPage.check_confirmSrpButtonIsDisabled();
      },
    );
  });

  it('Verifies the functionality of selecting different Secret Recovery Phrase word counts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
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
        await onboardingSrpPage.check_srpDropdownIterations();
      },
    );
  });

  it('Verifies error handling when entering an incorrect password during wallet creation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        const wrongTestPassword = 'test test test test';
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
        await onboardingPasswordPage.fillWalletPassword(
          WALLET_PASSWORD,
          wrongTestPassword,
        );

        // check the incorrect password warning message is displayed
        await onboardingPasswordPage.check_incorrectPasswordWarningMessageIsDisplayed();
        await onboardingPasswordPage.check_confirmPasswordButtonIsDisabled();
      },
    );
  });

  it('User can add custom network during onboarding', async function () {
    const networkName = 'Localhost 8546';
    const networkUrl = 'http://127.0.0.1:8546';
    const currencySymbol = 'ETH';
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: {
          concurrent: [{ port, chainId, ganacheOptions2 }],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver, secondaryGanacheServer }) => {
        await importSRPOnboardingFlow({
          driver,
          seedPhrase: TEST_SEED_PHRASE,
        });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
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

        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await switchToNetworkFlow(driver, networkName);
        await homePage.check_addNetworkMessageIsDisplayed(networkName);

        // Check the correct balance for the custom network is displayed
        if (secondaryGanacheServer && Array.isArray(secondaryGanacheServer)) {
          await homePage.check_localBlockchainBalanceIsDisplayed(
            secondaryGanacheServer[0],
          );
        } else {
          throw new Error('Custom network Ganache server not available');
        }
      },
    );
  });

  it('User can turn off basic functionality in default settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await importSRPOnboardingFlow({ driver });

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.check_walletReadyMessageIsDisplayed();
        await onboardingCompletePage.navigateToDefaultPrivacySettings();

        const onboardingPrivacySettingsPage = new OnboardingPrivacySettingsPage(
          driver,
        );
        await onboardingPrivacySettingsPage.toggleBasicFunctionalitySettings();
        await onboardingPrivacySettingsPage.navigateBackToOnboardingCompletePage();

        await onboardingCompletePage.check_pageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        // check the basic functionality is off warning message is displayed
        await homePage.check_basicFunctionalityOffWarnigMessageIsDisplayed();
      },
    );
  });

  it('Provides an onboarding path for a user who has restored their account from state persistence failure', async function () {
    // We don't use onboarding: true here because we want there to be a vault,
    // simulating what will happen when a user eventually restores their vault
    // during a state persistence failure. Instead, we set the
    // firstTimeFlowType to 'restore' and completedOnboarding to false. as well
    // as some other first time state options to get us into an onboarding
    // state similar to a new state tree.
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withOnboardingController({
            completedOnboarding: false,
            firstTimeFlowType: FirstTimeFlowType.restore,
            seedPhraseBackedUp: null,
          })
          .withMetaMetricsController({
            participateInMetaMetrics: null,
            metaMetricsId: null,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        // First screen we should be on is MetaMetrics
        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        await onboardingMetricsPage.check_pageIsLoaded();
        await onboardingMetricsPage.clickNoThanksButton();

        // Next screen should be Secure your wallet screen
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.check_pageIsLoaded();
      },
    );
  });
});
