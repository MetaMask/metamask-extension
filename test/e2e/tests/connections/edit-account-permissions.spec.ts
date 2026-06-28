import { Mockttp } from 'mockttp';
import {
  DAPP_HOST_ADDRESS,
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import { openPermissionsPageFlow } from '../../page-objects/flows/permissions.flow';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import SitePermissionPage from '../../page-objects/pages/permission/site-permission-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { login } from '../../page-objects/flows/login.flow';
import { connectAccountToTestDapp } from '../../page-objects/flows/test-dapp.flow';

const accountLabel1 = 'Account 1';
const accountLabel2 = 'Account 2';
const accountLabel3 = 'Account 3';

/**
 * Default v5 mock only balances the primary fixture account. This test creates
 * Account 2 and Account 3, which need native balances or the homepage never renders
 * `overview__primary-currency`.
 *
 * @param mockServer - Mockttp server for this test run.
 * @param nativeBalanceHuman - Human-readable native ETH balance per chain/account.
 */
async function mockAllMultichainAccountBalances(
  mockServer: Mockttp,
  nativeBalanceHuman: string = DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC,
) {
  await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v5/multiaccount/balances')
    .asPriority(99)
    .thenCallback((req) => {
      const accountIds =
        new URL(req.url).searchParams
          .get('accountIds')
          ?.split(',')
          .filter(Boolean) ?? [];

      const balances = accountIds.map((id) => {
        const chainRef = id.split(':')[1] ?? '1';
        const slip44 = chainRef === '1337' ? '1' : '60';
        return {
          accountId: id,
          assetId: `eip155:${chainRef}/slip44:${slip44}`,
          balance: nativeBalanceHuman,
        };
      });

      return {
        statusCode: 200,
        json: {
          count: balances.length,
          balances,
          unprocessedNetworks: [],
        },
      };
    });
}

describe('Edit Accounts Permissions', function () {
  it('should be able to edit accounts', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2().build(),
        testSpecificMock: mockAllMultichainAccountBalances,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await connectAccountToTestDapp(driver, {
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
        });
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new Homepage(driver).checkPageIsLoaded();
        new HeaderNavbar(driver).openAccountMenu();

        // create second account with custom label
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(accountLabel2);
        await accountListPage.selectAccount(accountLabel2);

        // ensure non EVM accounts are loaded for Account 2
        const homepage = new Homepage(driver);
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.waitForNonEvmAccountsLoaded();

        // create third account with custom label
        await homepage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addMultichainAccount();
        await accountListPage.checkAccountDisplayedInAccountList(accountLabel3);
        await accountListPage.selectAccount(accountLabel3);

        // ensure non EVM accounts are loaded for Account 3
        await homepage.checkExpectedBalanceIsDisplayed();
        await homepage.waitForNonEvmAccountsLoaded();

        // select back Account 1
        await homepage.headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.selectAccount(accountLabel1);

        // go to connections permissions page
        await openPermissionsPageFlow(driver);
        const permissionListPage = new PermissionListPage(driver);
        await permissionListPage.checkPageIsLoaded();
        await permissionListPage.openPermissionPageForSite(DAPP_HOST_ADDRESS);
        const sitePermissionPage = new SitePermissionPage(driver);
        await sitePermissionPage.checkPageIsLoaded(DAPP_HOST_ADDRESS);
        await sitePermissionPage.editPermissionsForAccount([
          accountLabel2,
          accountLabel3,
        ]);
        await sitePermissionPage.checkConnectedAccountsNumber(3);
      },
    );
  });
});
