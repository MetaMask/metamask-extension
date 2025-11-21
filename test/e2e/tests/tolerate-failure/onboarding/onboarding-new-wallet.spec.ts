import { Mockttp } from 'mockttp';
import { WALLET_PASSWORD, withFixtures } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';

import SecureWalletPage from '../../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';

import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilder from '../../../fixture-builder';
import { getCommonMocks } from '../utils/commonMocks.js';
import { setupTimerReporting } from '../utils/testSetup.js';
import Timers from '../../../../timers/Timers.js';

describe('MetaMask onboarding', function () {
  // Setup timer reporting for all tests in this describe block
  setupTimerReporting();
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
        fixtures: new FixtureBuilder({ onboarding: true })
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        testSpecificMock: async (server: Mockttp) => {
          return [...getCommonMocks(server)];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const timer1 = Timers.createTimer(
          'Time since the user clicks on "Create new wallet" button until "Social sign up" is visible',
        );
        const timer2 = Timers.createTimer(
          'Time since the user clicks on "use SRP" button until "Metamask password" form is visible',
        );
        const timer3 = Timers.createTimer(
          'Time since the user clicks on "Create password" button until "Recovery Phrase" screen is visible',
        );
        const timer4 = Timers.createTimer(
          'Time since the user clicks on "Skip" button until "Metrics" screen is visible',
        );
        const timer5 = Timers.createTimer(
          'Time since the user clicks on "I agree" button until "Onboarding Success" screen is visible',
        );
        const timer6 = Timers.createTimer(
          'Time since the user clicks on "Done" button until "Home" screen is visible',
        );

        await driver.navigate();
        const startOnboardingPage = new StartOnboardingPage(driver);
        const metrics = await driver.collectMetrics();
        console.log('Metrics:', metrics);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp(false);
        timer1.startTimer();
        await startOnboardingPage.checkSocialSignUpFormIsVisible();
        timer1.stopTimer();

        await startOnboardingPage.clickCreateWithSrpButton();
        timer2.startTimer();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timer2.stopTimer();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        timer3.startTimer();
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();
        timer3.stopTimer();
        await secureWalletPage.skipSRPBackup();
        timer4.startTimer();
        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        await onboardingMetricsPage.checkPageIsLoaded();
        timer4.stopTimer();
        await onboardingMetricsPage.clickOnContinueButton();
        timer5.startTimer();
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        timer5.stopTimer();
        await onboardingCompletePage.completeOnboarding();
        timer6.startTimer();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkTokenListIsDisplayed();
        timer6.stopTimer();
        await homePage.clickBackupRemindMeLaterButton();
        await driver.delay(1000);
        await homePage.checkPageIsLoaded();
        await homePage.checkTokenListIsDisplayed();
        await homePage.checkTokenListPricesAreDisplayed();
        await homePage.checkAssetIsDisplayed('Ethereum');
        await homePage.checkAssetIsDisplayed('Solana');
      },
    );
  });
});
