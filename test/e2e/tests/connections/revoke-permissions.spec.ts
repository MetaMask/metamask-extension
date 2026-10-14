import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { DAPP_HOST_ADDRESS, DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { getEditConnectedAccountsPageForHost } from '../../page-objects/flows/permissions.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import { login } from '../../page-objects/flows/login.flow';

describe('Revoke Permissions', function () {
  it('should disconnect when click on Disconnect button in connections page', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        // open the site's permissions and disconnect
        const editConnectedAccountsPage =
          await getEditConnectedAccountsPageForHost(driver, DAPP_HOST_ADDRESS);
        await editConnectedAccountsPage.disconnectAll();

        // Switch to Dapp and check the dapp is disconnected
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.checkConnectedAccounts(DEFAULT_FIXTURE_ACCOUNT, false);
      },
    );
  });
});
