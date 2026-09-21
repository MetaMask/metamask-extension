import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  DAPP_HOST_ADDRESS,
  WINDOW_TITLES,
} from '../../../constants';
import { toEvmCaipAccountId } from '../../../../../shared/lib/multichain/scope-utils';
import { withFixtures } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/connect-account-confirmation';
import EditConnectedAccountsPage from '../../../page-objects/pages/permission/edit-connected-accounts-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { login } from '../../../page-objects/flows/login.flow';
import { getEditConnectedAccountsPageForHost } from '../../../page-objects/flows/permissions.flow';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
} from '../testHelpers';

describe('Call `wallet_createSession`, then update the accounts in the permissions page of the wallet for that dapp', function () {
  const INITIAL_SCOPES = ['eip155:1337', 'eip155:1338'];

  const CAIP_ACCOUNT_IDS = [
    toEvmCaipAccountId(ACCOUNT_1),
    toEvmCaipAccountId(ACCOUNT_2),
  ];
  const RETAINED_ACCOUNT = ACCOUNT_2;
  it('should receive a `wallet_sessionChanged` event with the full new session scopes', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilderV2()
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
        await login(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);
        await testDapp.initCreateSessionScopes(
          INITIAL_SCOPES,
          CAIP_ACCOUNT_IDS,
        );
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );
        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.openEditAccountsModal();

        const editConnectedAccountsPage = new EditConnectedAccountsPage(driver);
        await editConnectedAccountsPage.checkPageIsLoaded();
        await editConnectedAccountsPage.addNewAccount();
        await connectAccountConfirmation.confirmConnect();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();

        /**
         * We make sure to update selected accounts via wallet extension UI
         */
        const sitePermissionsEditor = await getEditConnectedAccountsPageForHost(
          driver,
          DAPP_HOST_ADDRESS,
        );
        await sitePermissionsEditor.editPermissionsForAccount(['Account 1']);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.MultichainTestDApp);
        await testDapp.checkPageIsLoaded();

        const parsedNotificationResult = JSON.parse(
          await testDapp.getWalletSessionChangedResult(0),
        );
        const sessionChangedScope =
          parsedNotificationResult.params.sessionScopes;

        for (const scope of INITIAL_SCOPES) {
          const expectedScope = getExpectedSessionScope(scope, [
            RETAINED_ACCOUNT,
          ]);

          assert.deepEqual(
            sessionChangedScope[scope],
            expectedScope,
            `scope ${scope} should be present in 'wallet_sessionChanged' event data with only the retained account`,
          );
        }
      },
    );
  });
});
