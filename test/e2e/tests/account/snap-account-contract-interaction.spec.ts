import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  ACCOUNT_2,
  DAPP_PATH,
  DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC,
  PRIVATE_KEY_TWO,
  WINDOW_TITLES,
} from '../../constants';
import { Anvil } from '../../seeder/anvil';
import ContractAddressRegistry from '../../seeder/contract-address-registry';
import { withFixtures } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/transaction-confirmation';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { login } from '../../page-objects/flows/login.flow';
import { mockSnapSimpleKeyringAndSite } from './snap-keyring-site-mocks';

/** ~25 ETH on local Anvil; matches default-fixture.json AccountTracker on 0x539. */
const LOCAL_ANVIL_ACCOUNT_TRACKER_BALANCE_HEX = '0x15af1d78b58c40000';

/**
 * Unified assets only mock v5 balances for the default (and hardware) accounts.
 * Snap keyring imports get new account IDs, so seed localhost native ETH for every
 * requested eip155:1337 account in this test.
 *
 * @param mockServer - Mockttp server for this test run.
 * @param nativeBalanceHuman - Human-readable ETH balance for localhost accounts.
 */
async function mockSnapAccountLocalhostBalances(
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

      const balances = accountIds
        .filter((id) => id.split(':')[1] === '1337')
        .map((id) => ({
          accountId: id,
          assetId: 'eip155:1337/slip44:1',
          balance: nativeBalanceHuman,
        }));

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

describe('Snap Account Contract interaction', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;
  it('deposits to piggybank contract', async function () {
    await withFixtures(
      {
        dappOptions: {
          numberOfTestDapps: 1,
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .withPermissionControllerConnectedToTestDapp({
            account: ACCOUNT_2,
          })
          .withAccountTracker({
            accountsByChainId: {
              '0x539': {
                [ACCOUNT_2]: {
                  balance: LOCAL_ANVIL_ACCOUNT_TRACKER_BALANCE_HEX,
                  stakedBalance: '0x0',
                },
              },
            },
          })
          .build(),
        smartContract,
        testSpecificMock: async (mockServer: Mockttp) => {
          await mockSnapAccountLocalhostBalances(mockServer);
          const snapMocks = await mockSnapSimpleKeyringAndSite(
            mockServer,
            8081,
          );
          return snapMocks;
        },
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        contractRegistry,
        localNodes,
      }: {
        driver: Driver;
        contractRegistry: ContractAddressRegistry;
        localNodes: Anvil[] | undefined[];
      }) => {
        await login(driver, { localNode: localNodes[0] });
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // Import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(
          PRIVATE_KEY_TWO,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        // BUG #37591 - With BIP44 the account mame is not retained.
        await headerNavbar.checkAccountLabel('Snap Account 1');

        // Open Dapp with contract
        const testDapp = new TestDapp(driver);
        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(smartContract);
        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.checkPageIsLoaded();
        await testDapp.createDepositTransaction();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.clickFooterConfirmButton();

        // Confirm the transaction in activity list on MetaMask
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkConfirmedTxNumberDisplayedInActivity();
        await activityTab.checkTxAmountInActivity('-4 ETH');
      },
    );
  });
});
