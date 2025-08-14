import { Suite } from 'mocha';
import { E2E_SRP } from '../../default-fixture';
import { WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';
import { CHAIN_IDS } from '../../../../shared/constants/network';

const isGlobalNetworkSelectorRemoved = process.env.REMOVE_GNS;

describe('MetaMask Responsive UI', function (this: Suite) {
  const driverOptions = { constrainWindowSize: true };
  it('Creating a new wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        driverOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await completeCreateNewWalletOnboardingFlow({ driver });

        // assert balance
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('0');
      },
    );
  });

  it('Importing existing wallet from lock page', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        driverOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        // Click forgot password button and reset password
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.gotoResetPasswordPage();

        // Import secret recovery phrase to reset password
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();
        await resetPasswordPage.resetPassword(E2E_SRP, WALLET_PASSWORD);
        await resetPasswordPage.waitForSeedPhraseInputToNotBeVisible();

        // Check balance renders correctly
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed();
      },
    );
  });

  it('Send Transaction from responsive window', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.LOCALHOST]: true,
            },
          })
          .build(),
        driverOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // send ETH from inside MetaMask
        await sendRedesignedTransactionToAddress({
          driver,
          recipientAddress: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          amount: '1',
        });
        await new HomePage(driver).checkPageIsLoaded();

        // Network Selector
        if (isGlobalNetworkSelectorRemoved) {
          await driver.clickElement('[data-testid="sort-by-networks"]');
          await driver.clickElement({
            text: 'Custom',
            tag: 'button',
          });
          await driver.clickElement('[data-testid="Localhost 8545"]');
          await driver.clickElement(
            '[data-testid="modal-header-close-button"]',
          );
        }

        // check confirmed transaction is displayed in activity list
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAmountInActivity('-1 ETH');
      },
    );
  });
});
