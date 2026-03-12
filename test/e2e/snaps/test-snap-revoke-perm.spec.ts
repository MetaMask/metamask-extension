import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HomePage from '../page-objects/pages/home/homepage';
import SnapListPage from '../page-objects/pages/snap-list-page';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { approveAccount } from '../page-objects/flows/snap-permission.flow';
import { withFixtures } from '../helpers';
import { mockEthereumProviderSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';

const ETHEREUM_PROVIDER_SNAP_NAME = 'Ethereum Provider Example Snap';
const CAIP25_PERMISSION_TEST_ID = 'endowment:caip25';
const EXPECTED_ACCOUNT_RESULT = '"0x5cfe73b6021e818b776b421b1c4db2474086a7e1"';

describe('Test Snap revoke permission', function () {
  it('can revoke a permission', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockEthereumProviderSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'ethereumProviderConnectButton',
        );
        await testSnaps.checkInstallationComplete(
          'ethereumProviderConnectButton',
          'Reconnect to Ethereum Provider Snap',
        );

        await testSnaps.scrollToButton('getAccountsButton');
        await testSnaps.clickButton('getAccountsButton');
        await approveAccount(driver);
        await testSnaps.checkMessageResultSpan(
          'addressResultSpan',
          EXPECTED_ACCOUNT_RESULT,
        );

        const homePage = new HomePage(driver);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.delay(1000);
        await homePage.headerNavbar.openSnapListPage();

        const snapListPage = new SnapListPage(driver);
        await snapListPage.openSnapByName(ETHEREUM_PROVIDER_SNAP_NAME);
        await snapListPage.clickPermissionOptionsMenu(
          CAIP25_PERMISSION_TEST_ID,
        );
        await snapListPage.clickRevokePermission();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.scrollToButton('getAccountsButton');
        await testSnaps.clickButton('getAccountsButton');
        await approveAccount(driver);
        await testSnaps.checkMessageResultSpan(
          'addressResultSpan',
          EXPECTED_ACCOUNT_RESULT,
        );
      },
    );
  });
});
