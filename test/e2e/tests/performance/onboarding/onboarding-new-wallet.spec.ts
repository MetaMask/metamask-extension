import {
  WALLET_PASSWORD,
  withFixtures,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';

import SecureWalletPage from '../../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';

import TimerHelper from '../utils/TimersHelper';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilder from '../../../fixture-builder';
import { generateWalletState } from '../../../../../app/scripts/fixtures/generate-wallet-state';
import { WITH_STATE_ONBOARDING_NEW_WALLET } from '../../../benchmarks/constants';


describe('MetaMask onboarding', function () {
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
        fixtures: new FixtureBuilder({ onboarding: true }).withEnabledNetworks(ALL_POPULAR_NETWORKS).build(),
      },
      async ({ driver }: { driver: Driver }) => {
        const timer1 = new TimerHelper('Time since the user clicks on "Create new wallet" button until "Social sign up" is visible');
        const timer2 = new TimerHelper('Time since the user clicks on "use SRP" button until "Metamask password" form is visible');
        const timer3 = new TimerHelper('Time since the user clicks on "Create password" button until "Recovery Phrase" screen is visible');
        const timer4 = new TimerHelper('Time since the user clicks on "Skip" button until "Metrics" screen is visible');
        const timer5 = new TimerHelper('Time since the user clicks on "I agree" button until "Onboarding Success" screen is visible');
        const timer6 = new TimerHelper('Time since the user clicks on "Done" button until "Home" screen is visible');

        await driver.navigate();
        const startOnboardingPage = new StartOnboardingPage(driver);
        const metrics = await driver.collectMetrics();
        console.log('Metrics:', metrics);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp(false);
        timer1.start();
        await startOnboardingPage.checkSocialSignUpFormIsVisible();
        timer1.stop();

        timer2.start();
        await startOnboardingPage.clickCreateWithSrpButton();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timer2.stop();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        timer3.start();
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();
        timer3.stop();
        await secureWalletPage.skipSRPBackup();
        timer4.start();
        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        await onboardingMetricsPage.checkPageIsLoaded();
        timer4.stop();
        await onboardingMetricsPage.clickOnContinueButton();
        timer5.start();
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        timer5.stop();
        await onboardingCompletePage.completeOnboarding();
        timer6.start();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkTokenListIsDisplayed();
        timer6.stop();
        console.log('Token list is displayed');
        console.log(`Timer 1:  ${timer1.getDuration()} ms`);
        console.log(`Timer 2:  ${timer2.getDuration()} ms`);
        console.log(`Timer 3:  ${timer3.getDuration()} ms`);
        console.log(`Timer 4:  ${timer4.getDuration()} ms`);
        console.log(`Timer 5:  ${timer5.getDuration()} ms`);
        console.log(`Timer 6:  ${timer6.getDuration()} ms`);
      },
    );
  });
});
