import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { WALLET_PASSWORD } from '../../e2e/constants';
import { withFixtures } from '../../e2e/helpers';
import { Driver } from '../../e2e/webdriver/driver';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../e2e/page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../e2e/page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../e2e/page-objects/pages/onboarding/onboarding-password-page';
import StartOnboardingPage from '../../e2e/page-objects/pages/onboarding/start-onboarding-page';
import OnboardingSrpPage from '../../e2e/page-objects/pages/onboarding/onboarding-srp-page';
import { ALL_POPULAR_NETWORKS } from '../../../app/scripts/fixtures/with-networks';
import HeaderNavbar from '../../e2e/page-objects/pages/header-navbar';
import AccountListPage from '../../e2e/page-objects/pages/account-list-page';
import { getCommonMocks } from '../utils/commonMocks';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import AssetListPage from '../../e2e/page-objects/pages/home/asset-list';
import { E2E_SRP } from '../../e2e/fixtures/default-fixture';
import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../e2e/page-objects/flows/onboarding.flow';

describe('MetaMask onboarding', function () {
  setupPerformanceReporting();

  it('Import an existing wallet and completes the onboarding process', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        fixtures: new FixtureBuilder({ onboarding: true })
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        testSpecificMock: async (server: Mockttp) => {
          return [...getCommonMocks(server)];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const srp = process.env.E2E_POWER_USER_SRP || E2E_SRP;

        const timerImportWalletToSocial = new TimerHelper(
          'Time since the user clicks on "Import wallet" button until "Social" screen is visible',
          { chrome: 2000, firefox: 3000 },
        );
        const timerSrpButtonToForm = new TimerHelper(
          'Time since the user clicks on "use SRP" button until "SRP" form is visible',
          { chrome: 2000, firefox: 3000 },
        );
        const timerConfirmToPassword = new TimerHelper(
          'Time since the user clicks on "Confirm" button until "Password" form is visible',
          { chrome: 3000, firefox: 4000 },
        );
        const timerPasswordToMetrics = new TimerHelper(
          'Time since the user clicks on "Continue" button on Password form until "Help improve Metamask" screen is visible',
          { chrome: 3000, firefox: 4000 },
        );
        const timerMetricsToComplete = new TimerHelper(
          'Time since the user clicks on "Continue" button until "Wallet is ready" screen is visible',
          { chrome: 3000, firefox: 4000 },
        );
        const timerDoneToHome = new TimerHelper(
          'Time since the user clicks on "Done" button until "Home" screen is visible',
          { chrome: 15000, firefox: 20000 },
        );
        const timerAccountListLoad = new TimerHelper(
          'Time since the user opens "account list" until the account list is loaded',
          { chrome: 5000, firefox: 6000 },
        );

        await driver.navigate();
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        // Measure: Import wallet button to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.importWallet(false);
        await timerImportWalletToSocial.measure(async () => {
          await startOnboardingPage.checkUserSrpButtonIsVisible();
        });
        performanceTracker.addTimer(timerImportWalletToSocial);

        // Measure: SRP button to form
        await startOnboardingPage.clickImportWithSrpButton();
        await timerSrpButtonToForm.measure(async () => {
          const onboardingSrpPage = new OnboardingSrpPage(driver);
          await onboardingSrpPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerSrpButtonToForm);

        // Measure: Confirm to Password form
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.fillSrp(srp);
        await onboardingSrpPage.clickConfirmButton();
        await timerConfirmToPassword.measure(async () => {
          const onboardingPasswordPage = new OnboardingPasswordPage(driver);
          await onboardingPasswordPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerConfirmToPassword);

        // Create password
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        // Measure: Password to Metrics (Chrome only)
        if (!isFirefox) {
          await timerPasswordToMetrics.measure(async () => {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
          });
          performanceTracker.addTimer(timerPasswordToMetrics);
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Measure: Metrics to Complete
        await timerMetricsToComplete.measure(async () => {
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerMetricsToComplete);

        // Measure: Done to Home
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        await timerDoneToHome.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.checkConversionRateDisplayed();
          await assetListPage.checkTokenExistsInList('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });
        performanceTracker.addTimer(timerDoneToHome);

        // Measure: Account list load
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();
        await timerAccountListLoad.measure(async () => {
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded(30000);
        });
        performanceTracker.addTimer(timerAccountListLoad);
      },
    );
  });
});
