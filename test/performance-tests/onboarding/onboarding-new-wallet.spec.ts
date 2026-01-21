import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { WALLET_PASSWORD } from '../../e2e/constants';
import { withFixtures } from '../../e2e/helpers';
import { Driver } from '../../e2e/webdriver/driver';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../e2e/page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../e2e/page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../e2e/page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../e2e/page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../e2e/page-objects/pages/onboarding/start-onboarding-page';
import { ALL_POPULAR_NETWORKS } from '../../../app/scripts/fixtures/with-networks';
import { getCommonMocks } from '../utils/commonMocks';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import AssetListPage from '../../e2e/page-objects/pages/home/asset-list';
import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../e2e/page-objects/flows/onboarding.flow';

describe('MetaMask onboarding', function () {
  setupPerformanceReporting();

  it('Creates a new wallet, sets up a secure password, and completes the onboarding process', async function () {
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
        const timerCreateWalletToSocial = new TimerHelper(
          'Time since the user clicks on "Create new wallet" button until "Social sign up" is visible',
          2000,
        );
        const timerSrpButtonToPassword = new TimerHelper(
          'Time since the user clicks on "use SRP" button until "Metamask password" form is visible',
          2000,
        );
        const timerPasswordToRecovery = new TimerHelper(
          'Time since the user clicks on "Create password" button until "Recovery Phrase" screen is visible',
          3000,
        );
        const timerSkipToMetrics = new TimerHelper(
          'Time since the user clicks on "Skip" button until "Metrics" screen is visible',
          3000,
        );
        const timerAgreeToComplete = new TimerHelper(
          'Time since the user clicks on "I agree" button until "Onboarding Success" screen is visible',
          3000,
        );
        const timerDoneToAssetList = new TimerHelper(
          'Time since the user clicks on "Done" button until asset list is loaded',
          15000,
        );

        await driver.navigate();
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        // Measure: Create wallet to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp(false);
        await timerCreateWalletToSocial.measure(async () => {
          await startOnboardingPage.checkSocialSignUpFormIsVisible();
        });
        performanceTracker.addTimer(timerCreateWalletToSocial);

        // Measure: SRP button to Password form
        await startOnboardingPage.clickCreateWithSrpButton();
        await timerSrpButtonToPassword.measure(async () => {
          const onboardingPasswordPage = new OnboardingPasswordPage(driver);
          await onboardingPasswordPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerSrpButtonToPassword);

        // Measure: Password to Recovery
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        await timerPasswordToRecovery.measure(async () => {
          const secureWalletPage = new SecureWalletPage(driver);
          await secureWalletPage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerPasswordToRecovery);

        // Skip recovery backup
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.skipSRPBackup();

        // Measure: Skip to Metrics (Chrome only)
        if (!isFirefox) {
          await timerSkipToMetrics.measure(async () => {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
          });
          performanceTracker.addTimer(timerSkipToMetrics);
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Measure: Agree to Complete
        await timerAgreeToComplete.measure(async () => {
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerAgreeToComplete);

        // Measure: Done to Asset list
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        await timerDoneToAssetList.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.checkConversionRateDisplayed();
          await assetListPage.waitForTokenToBeDisplayed('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });
        performanceTracker.addTimer(timerDoneToAssetList);
      },
    );
  });
});
