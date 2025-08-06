import { Suite } from 'mocha';
import { Browser } from 'selenium-webdriver';
import { Anvil } from '../../seeder/anvil';
import { withFixtures } from '../../helpers';
import { WALLET_PASSWORD } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import TestDappSendEthWithPrivateKey from '../../page-objects/pages/test-dapp-send-eth-with-private-key';

describe('Incremental Security', function (this: Suite) {
  it('Back up Secret Recovery Phrase from backup reminder', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        dappPath: 'send-eth-with-private-key-test',
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[];
      }) => {
        // Seed Account
        await localNodes?.[0]?.setAccountBalance(
          '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3',
          '0x100000000000000000000',
        );
        await driver.navigate();

        // skip collect metametrics
        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickNoThanksButton();
        }

        // agree to terms of use and start onboarding
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkBannerPageIsLoaded();
        await startOnboardingPage.agreeToTermsOfUse();
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp();

        // create password
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.checkPageIsLoaded();
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);

        // secure wallet later
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.checkPageIsLoaded();
        await secureWalletPage.skipSRPBackup();

        // skip collect metametrics
        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickNoThanksButton();
        }

        // complete onboarding and pin extension
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // copy the wallet address
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.headerNavbar.clickAddressCopyButton();

        // switched to Dapp and send eth to the current account
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const testDapp = new TestDappSendEthWithPrivateKey(driver);
        await testDapp.openTestDappSendEthWithPrivateKey();
        await testDapp.checkPageIsLoaded();
        await testDapp.pasteAddressAndSendEthWithPrivateKey();

        // switch back to extension and check the balance is updated
        await driver.switchToWindow(extension);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('1');

        // backup reminder is displayed and it directs user to the backup SRP page
        await homePage.goToBackupSRPPage();
        await secureWalletPage.checkPageIsLoaded();

        // reveal and confirm the Secret Recovery Phrase on backup SRP page
        await secureWalletPage.revealAndConfirmSRP(WALLET_PASSWORD);

        // complete backup
        await onboardingCompletePage.checkPageIsLoaded_backup();
        await onboardingCompletePage.checkKeepSrpSafeMessageIsDisplayed();
        await onboardingCompletePage.completeBackup();

        // check the balance is correct after revealing and confirming the SRP
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('1');

        // check backup reminder is not displayed on homepage
        await homePage.checkBackupReminderIsNotDisplayed();
      },
    );
  });
});
