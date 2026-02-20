import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { E2E_SRP } from '../../fixtures/default-fixture';
import { WALLET_PASSWORD } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HomePage from '../../page-objects/pages/home/homepage';
import LoginPage from '../../page-objects/pages/login-page';
import ResetPasswordPage from '../../page-objects/pages/reset-password-page';
import { completeCreateNewWalletOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { sendRedesignedTransactionToAddress } from '../../page-objects/flows/send-transaction.flow';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { PAGES } from '../../webdriver/driver';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

const NON_EVM_ACCOUNT_FLAG_OVERRIDES = [
  { bitcoinAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { solanaAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  { tronAccounts: { enabled: false, minimumVersion: '0.0.0' } },
  {
    enableMultichainAccounts: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
  {
    enableMultichainAccountsState2: {
      enabled: false,
      featureVersion: null,
      minimumVersion: null,
    },
  },
];

async function mockFeatureFlagsWithoutNonEvmAccounts(mockServer: Mockttp) {
  const prodFlags = getProductionRemoteFlagApiResponse();
  return [
    await mockServer
      .forGet(FEATURE_FLAGS_URL)
      .withQuery({
        client: 'extension',
        distribution: 'main',
        environment: 'dev',
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: [...prodFlags, ...NON_EVM_ACCOUNT_FLAG_OVERRIDES],
      })),
  ];
}

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
        fixtures: new FixtureBuilderV2().build(),
        driverOptions,
        testSpecificMock: mockFeatureFlagsWithoutNonEvmAccounts,
        // The password reset flow calls createNewVaultAndRestore which
        // clears snap state while preinstalled snaps (e.g. message-signing-snap)
        // may still have in-flight requests, causing them to be terminated.
        // See issues #37342 and #37498.
        ignoredConsoleErrors: [
          'unable to proceed, wallet is locked',
          'npm:@metamask/message-signing-snap was stopped and the request was cancelled. This is likely because the Snap crashed.',
          'Unable to enable notifications',
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.HOME, {
          waitForControllersTimeout: 30000,
        });

        // Click forgot password button and reset password
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.gotoResetPasswordPage();

        // Import secret recovery phrase to reset password
        const resetPasswordPage = new ResetPasswordPage(driver);
        await resetPasswordPage.checkPageIsLoaded();
        await resetPasswordPage.resetPassword(E2E_SRP, WALLET_PASSWORD);
        await resetPasswordPage.waitForPasswordInputToNotBeVisible();

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
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
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
        await driver.clickElement('[data-testid="sort-by-networks"]');
        await driver.clickElement({
          text: 'Custom',
          tag: 'button',
        });
        await driver.clickElement('[data-testid="Localhost 8545"]');

        // check confirmed transaction is displayed in activity list
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.checkTxAmountInActivity('-1 ETH');
      },
    );
  });
});
