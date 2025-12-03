import { Mockttp } from 'mockttp';
import { WALLET_PASSWORD, withFixtures } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';

import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';

import OnboardingSrpPage from '../../../page-objects/pages/onboarding/onboarding-srp-page';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';

import HeaderNavbar from '../../../page-objects/pages/header-navbar';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import { getCommonMocks } from '../utils/commonMocks';
import { setupTimerReporting } from '../utils/testSetup';
import Timers from '../../../../timers/Timers';

import AssetListPage from '../../../page-objects/pages/home/asset-list';

import { E2E_SRP } from '../../../fixtures/default-fixture';
import FixtureBuilder from '../../../fixtures/fixture-builder';

describe('MetaMask onboarding', function () {
  // Setup timer reporting for all tests in this describe block
  setupTimerReporting();
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
        fixtures: new FixtureBuilder({ onboarding: true })
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        testSpecificMock: async (server: Mockttp) => {
          return [...getCommonMocks(server)];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        const srp = process.env.E2E_POWER_USER_SRP || E2E_SRP;
        const timer1 = Timers.createTimer(
          'Time since the user clicks on "Import wallet" button until "Social" screen is visible',
        );
        const timer2 = Timers.createTimer(
          'Time since the user clicks on "use SRP" button until "SRP" form is visible',
        );
        const timer3 = Timers.createTimer(
          'Time since the user clicks on "Confirm" button until "Password" form is visible',
        );
        const timer4 = Timers.createTimer(
          'Time since the user clicks on "Continue" button on Password form until "Help improve Metamask" screen is visible',
        );
        const timer5 = Timers.createTimer(
          'Time since the user clicks on "Continue" button until "Wallet is ready" screen is visible',
        );
        const timer6 = Timers.createTimer(
          'Time since the user clicks on "Done" button until "Home" screen is visible',
        );
        const timer7 = Timers.createTimer(
          'Time since the user opens "account list" until the account list is loaded',
        );
        await driver.navigate();
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.importWallet(false);
        timer1.startTimer();
        await startOnboardingPage.checkUserSrpButtonIsVisible();
        timer1.stopTimer();
        await startOnboardingPage.clickImportWithSrpButton();
        timer2.startTimer();
        const onboardingSrpPage = new OnboardingSrpPage(driver);
        await onboardingSrpPage.checkPageIsLoaded();
        timer2.stopTimer();
        await onboardingSrpPage.fillSrp(srp);
        await onboardingSrpPage.clickConfirmButton();
        timer3.startTimer();
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        timer3.stopTimer();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
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
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();
        await assetListPage.checkConversionRateDisplayed();
        await assetListPage.checkTokenExistsInList('Ethereum');
        await assetListPage.waitForTokenToBeDisplayed('Solana');
        // await assetListPage.waitForTokenToBeDisplayed('Bitcoin');
        // await assetListPage.checkTokenExistsInList('Tron'); // https://consensyssoftware.atlassian.net/browse/MMQA-1191
        timer6.stopTimer();
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountsPage();
        timer7.startTimer();
        const accountList = new AccountListPage(driver);
        await accountList.checkPageIsLoaded({
          isMultichainAccountsState2Enabled: true,
        });
        timer7.stopTimer();
      },
    );
  });
});
