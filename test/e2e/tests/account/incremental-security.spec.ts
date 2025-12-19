import { Suite } from 'mocha';
import { Browser } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import { Anvil } from '../../seeder/anvil';
import { withFixtures, isSidePanelEnabled } from '../../helpers';
import { WALLET_PASSWORD, WINDOW_TITLES } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../page-objects/pages/onboarding/start-onboarding-page';
import TestDappSendEthWithPrivateKey from '../../page-objects/pages/test-dapp-send-eth-with-private-key';
import { handleSidepanelPostOnboarding } from '../../page-objects/flows/onboarding.flow';

async function mockSpotPrices(mockServer: Mockttp) {
  return await mockServer
    .forGet(/^https:\/\/price\.api\.cx\.metamask\.io\/v3\/spot-prices/u)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        'eip155:1/slip44:60': {
          id: 'ethereum',
          price: 1700,
          marketCap: 382623505141,
          pricePercentChange1d: 0,
        },
      },
    }));
}

describe('Incremental Security', function (this: Suite) {
  it('Back up Secret Recovery Phrase from backup reminder', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: ['./send-eth-with-private-key-test'],
        },
        fixtures: new FixtureBuilder({ onboarding: true })
          .withPreferencesControllerShowNativeTokenAsMainBalanceEnabled()
          .withEnabledNetworks({
            eip155: {
              '0x1': true,
            },
          })
          .build(),
        testSpecificMock: mockSpotPrices,

        title: this.test?.fullTitle(),
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
          await onboardingMetricsPage.skipMetricAndContinue();
        }

        // agree to terms of use and start onboarding
        const startOnboardingPage = new StartOnboardingPage(driver);
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
          await onboardingMetricsPage.skipMetricAndContinue();
        }

        // complete onboarding and pin extension
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.completeOnboarding();

        // Handle sidepanel navigation if needed
        await handleSidepanelPostOnboarding(driver);

        // Check if sidepanel - backup flow won't work with sidepanel
        const hasSidepanel = await isSidePanelEnabled();
        if (hasSidepanel) {
          console.log(
            'Skipping test for sidepanel build - backup reminder state lost after page reload',
          );
          return;
        }

        // copy the wallet address
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        // TODO: This is a temporary fix to unblock CI. Remove this once the issue is fixed.
        await homePage.clickBackupRemindMeLaterButtonSafe();
        await homePage.headerNavbar.clickAddressCopyButton();

        // switched to Dapp and send eth to the current account
        const testDapp = new TestDappSendEthWithPrivateKey(driver);
        await testDapp.openTestDappSendEthWithPrivateKey();
        await testDapp.checkPageIsLoaded();
        await testDapp.pasteAddressAndSendEthWithPrivateKey();

        // switch back to extension and check the balance is updated
        // Use URL-based switching as window titles may not be reliable after navigation
        if (hasSidepanel) {
          await driver.switchToWindowWithUrl(
            `${driver.extensionUrl}/home.html`,
          );
        } else {
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
        }

        await homePage.checkPageIsLoaded();
        // to update balance faster and avoid timeout error
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed('1', 'ETH');

        // Backup SRP flow - only for non-sidepanel builds
        // With sidepanel, appState is lost during page reload, so this flow won't work
        if (!hasSidepanel) {
          // backup reminder is displayed and it directs user to the backup SRP page
          await homePage.goToBackupSRPPage();

          // reveal and confirm the Secret Recovery Phrase on backup SRP page
          await secureWalletPage.revealAndConfirmSRP(WALLET_PASSWORD);

          // complete backup
          await onboardingCompletePage.checkPageIsLoadedBackup();
          await onboardingCompletePage.checkKeepSrpSafeMessageIsDisplayed();
          await onboardingCompletePage.completeBackup();

          // check the balance is correct after revealing and confirming the SRP
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedBalanceIsDisplayed('1', 'ETH');

          // check backup reminder is not displayed on homepage
          await homePage.checkBackupReminderIsNotDisplayed();
        }
      },
    );
  });
});
