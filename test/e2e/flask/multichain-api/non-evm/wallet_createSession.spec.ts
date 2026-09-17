import { strict as assert } from 'assert';
import { withFixtures } from '../../../helpers';
import { SOLANA_MAINNET_SCOPE, WINDOW_TITLES } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { login } from '../../../page-objects/flows/login.flow';
import { addAccount } from '../../../page-objects/flows/add-account.flow';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsPage from '../../../page-objects/pages/permission/edit-connected-accounts-page';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS } from '../testHelpers';

describe('Multichain API - Non EVM', function () {
  describe("Call `wallet_createSession` with both EVM and Solana scopes that match the user's enabled networks", function () {
    it('should only select the specified scopes requested by the user', async function () {
      await withFixtures(
        {
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver, extensionId }) => {
          await login(driver);
          const requestScopesToNetworkMap = {
            'eip155:1': 'Ethereum',
            [SOLANA_MAINNET_SCOPE]: 'Solana',
          };

          const requestScopes = Object.keys(requestScopesToNetworkMap);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes(requestScopes);

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.confirmConnect();

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );
          await testDapp.checkPageIsLoaded();

          const getSessionResult = await testDapp.getSession();
          for (const scope of requestScopes) {
            assert.ok(
              getSessionResult.sessionScopes[scope],
              `scope ${scope} should be granted`,
            );
          }
        },
      );
    });
  });

  describe('Connect wallet to the multichain dapp via `externally_connectable`, call `wallet_createSession` with Solana scope, without any accounts requested', function () {
    it('should automatically select the current active Solana account', async function () {
      await withFixtures(
        {
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver, extensionId }) => {
          await login(driver);
          await addAccount({ driver, switchToAccount: 'Account 1' });

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes([SOLANA_MAINNET_SCOPE]);

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.openEditAccountsModal();

          const editConnectedAccountsPage = new EditConnectedAccountsPage(
            driver,
          );
          await editConnectedAccountsPage.checkPageIsLoaded();

          await editConnectedAccountsPage.waitForAccountSelectedStatus({
            accountIndex: 1,
            status: 'selected',
          });
        },
      );
    });
  });
});
