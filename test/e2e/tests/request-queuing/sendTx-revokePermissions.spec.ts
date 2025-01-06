import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { Ganache } from '../../seeder/ganache';
import { Driver } from '../../webdriver/driver';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import {
  withFixtures,
  defaultGanacheOptions,
  WINDOW_TITLES,
} from '../../helpers';

describe('Request Queuing', function () {
  // TODO: add a new spec which checks that after revoking and connecting again
  // a pending tx is still closed when using revokePermissions.
  // To be done once this bug is fixed: #29272
  it('should clear tx confirmation when revokePermission is called from origin dapp', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
        },
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);

        // Open test dapp
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_connectedAccounts(DEFAULT_FIXTURE_ACCOUNT);

        // Trigger a tx
        await testDapp.clickSimpleSendButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.check_dappInitiatedHeadingTitle();

        // wallet_revokePermissions request
        const revokePermissionsRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_revokePermissions',
          params: [
            {
              eth_accounts: {},
            },
          ],
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.executeScript(
          `return window.ethereum.request(${revokePermissionsRequest})`,
        );

        // Should have cleared the tx confirmation
        await driver.waitUntilXWindowHandles(2);

        // Cleared eth_accounts account label
        await testDapp.check_connectedAccounts(DEFAULT_FIXTURE_ACCOUNT, false);
      },
    );
  });
});
