import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  WINDOW_TITLES,
  withFixtures,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilder from '../../../fixture-builder';
import { DAPP_HOST_ADDRESS } from '../../../constants';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import EditConnectedAccountsModal from '../../../page-objects/pages/dialog/edit-connected-accounts-modal';
import HomePage from '../../../page-objects/pages/home/homepage';
import PermissionListPage from '../../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../../page-objects/pages/permission/site-permission-page';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
} from '../testHelpers';

describe('Call `wallet_createSession`, then update the accounts and/or scopes in the permissions page of the wallet for that dapp', function () {
  const INITIAL_SCOPES = ['eip155:1337', 'eip155:1338'];
  const REMOVED_SCOPE = INITIAL_SCOPES[0];
  const UPDATED_SCOPE = INITIAL_SCOPES[1];

  const CAIP_ACCOUNT_IDS = [`eip155:0:${ACCOUNT_1}`, `eip155:0:${ACCOUNT_2}`];
  const UPDATED_ACCOUNT = ACCOUNT_2;
  it('should receive a `wallet_sessionChanged` event with the full new session scopes', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder()
          .withNetworkControllerTripleNode()
          .build(),
        ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
      },
      async ({
        driver,
        extensionId,
      }: {
        driver: Driver;
        extensionId: string;
      }) => {
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes(
          INITIAL_SCOPES,
          CAIP_ACCOUNT_IDS,
        );
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.check_pageIsLoaded();
        await connectAccountConfirmation.openEditAccountsModal();

        const editConnectedAccountsModal = new EditConnectedAccountsModal(
          driver,
        );
        await editConnectedAccountsModal.check_pageIsLoaded();
        await editConnectedAccountsModal.addNewEthereumAccount();
        await connectAccountConfirmation.confirmConnect();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();

        /**
         * We make sure to update selected accounts via wallet extension UI
         */
        await homePage.headerNavbar.openPermissionsPage();
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.check_pageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.check_pageIsLoaded(DAPP_HOST_ADDRESS);
        await sitePermissionPage.editPermissionsForAccount(['Account 1']);
        await sitePermissionPage.editPermissionsForNetwork(['Localhost 8545']);

        /**
         * And also update selected scope to {@link UPDATED_SCOPE}
         */
        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        await testDapp.check_pageIsLoaded();

        const expectedScope = getExpectedSessionScope(UPDATED_SCOPE, [
          UPDATED_ACCOUNT,
        ]);

        const parsedNotificationResult = JSON.parse(
          await testDapp.get_walletSessionChangedResult(0),
        );
        const sessionChangedScope =
          parsedNotificationResult.params.sessionScopes;

        const currentScope = sessionChangedScope[UPDATED_SCOPE];
        const scopedAccounts = currentScope.accounts;

        assert.deepEqual(
          currentScope,
          expectedScope,
          `scope ${UPDATED_SCOPE} should be present in 'wallet_sessionChanged' event data`,
        );

        assert.deepEqual(
          scopedAccounts,
          expectedScope.accounts,
          `${expectedScope.accounts} does not match accounts in scope ${currentScope}`,
        );

        assert.deepEqual(
          sessionChangedScope[REMOVED_SCOPE],
          undefined,
          `scope ${REMOVED_SCOPE} should NOT be present in 'wallet_sessionChanged' event data`,
        );
      },
    );
  });
});
