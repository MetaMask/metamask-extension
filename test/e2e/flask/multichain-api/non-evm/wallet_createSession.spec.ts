import { withFixtures } from '../../../helpers';
import { SOLANA_MAINNET_SCOPE } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { login } from '../../../page-objects/flows/login.flow';
import { addAccount } from '../../../page-objects/flows/add-account.flow';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsModal from '../../../page-objects/pages/dialog/edit-connected-accounts-modal';
import NetworkPermissionSelectModal from '../../../page-objects/pages/dialog/network-permission-select-modal';
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
          const networksToRequest = Object.values(requestScopesToNetworkMap);

          const testDapp = new TestDappMultichain(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await testDapp.connectExternallyConnectable(extensionId);
          await testDapp.initCreateSessionScopes(requestScopes);

          const connectAccountConfirmation = new ConnectAccountConfirmation(
            driver,
          );
          await connectAccountConfirmation.checkPageIsLoaded();
          await connectAccountConfirmation.goToPermissionsTab();
          await connectAccountConfirmation.openEditNetworksModal();

          const networkPermissionSelectModal = new NetworkPermissionSelectModal(
            driver,
          );
          await networkPermissionSelectModal.checkPageIsLoaded();
          await networkPermissionSelectModal.checkNetworkStatus(
            networksToRequest,
          );
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

          const editConnectedAccountsModal = new EditConnectedAccountsModal(
            driver,
          );
          await editConnectedAccountsModal.checkPageIsLoaded();

          await editConnectedAccountsModal.waitForAccountSelectedStatus({
            accountIndex: 1,
            status: 'selected',
          });
        },
      );
    });
  });
});
