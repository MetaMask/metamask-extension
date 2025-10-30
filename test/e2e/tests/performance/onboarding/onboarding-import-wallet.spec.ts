import {
  WALLET_PASSWORD,
  withFixtures,
} from '../../../helpers';
import { Driver, PAGES } from '../../../webdriver/driver';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';

import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';

import TimerHelper from '../utils/TimersHelper';
import OnboardingSrpPage from '../../../page-objects/pages/onboarding/onboarding-srp-page';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilder from '../../../fixture-builder';
import { Mockttp } from 'mockttp';
import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { getCommonMocks } from '../utils/commonMocks';


describe('MetaMask onboarding', function () {
  it('Import an existing wallet and completes the onboarding process', async function () {
    this.timeout(120000); // Increased timeout to 120 seconds for performance test
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
        testSpecificMock: async (server: Mockttp) => {
          return [...getCommonMocks(server)];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const timer1 = new TimerHelper('Time since the user clicks on "Import wallet" button until "Social" screen is visible');
        const timer2 = new TimerHelper('Time since the user clicks on "use SRP" button until "SRP" form is visible');
        const timer3 = new TimerHelper('Time since the user clicks on "Confirm" button until "Password" form is visible');
        const timer4 = new TimerHelper('Time since the user clicks on "Continue" button until "Onboarding Success" screen is visible');
        const timer5 = new TimerHelper('Time since the user clicks on "Done" button until "Home" screen is visible');
        const timer6 = new TimerHelper('Time since the user opens "account list" until the account list is loaded');
        await driver.navigate();
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.importWallet();
        timer1.start();
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.checkPageIsLoaded();
        timer1.stop();
        const seedPhrase = process.env.E2E_POWER_USER_SRP ? process.env.E2E_POWER_USER_SRP : "srp test phrase";
        await onboardingSrpPage.fillSrp(seedPhrase);
        await onboardingSrpPage.clickConfirmButton();
        timer2.start();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timer2.stop();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        timer3.start();
        const onboardingMetricsPage = new OnboardingMetricsPage(driver);
        await onboardingMetricsPage.checkPageIsLoaded();
        timer3.stop();

        await onboardingMetricsPage.clickOnContinueButton();
        timer4.start();
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        timer4.stop();
        await onboardingCompletePage.completeOnboarding();
        timer5.start();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkTokenListIsDisplayed();
        await homePage.checkTokenListPricesAreDisplayed();
        timer5.stop();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountsPage();
        timer6.start()
        const accountList = new AccountListPage(driver);
        await accountList.checkListIsCompletelyLoaded();
        timer6.stop();
        console.log(`Timer 1:  ${timer1.getDurationInSeconds()} s`);
        console.log(`Timer 2:  ${timer2.getDurationInSeconds()} s`);
        console.log(`Timer 3:  ${timer3.getDurationInSeconds()} s`);
        console.log(`Timer 4:  ${timer4.getDurationInSeconds()} s`);
        console.log(`Timer 5:  ${timer5.getDurationInSeconds()} s`);
        console.log(`Timer 6:  ${timer6.getDurationInSeconds()} s`);
      },
    );
  });

});
