import { mockNetworkStateOld } from '../../../stub/networks';
import { withFixtures } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import AccountListPage from '../../page-objects/pages/account-list-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import MockedPage from '../../page-objects/pages/mocked-page';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Block Explorer', function () {
  it('links to the users account on the explorer, ', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController(
            mockNetworkStateOld({
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              blockExplorerUrl: 'https://etherscan.io/',
            }),
          )
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openAccountMenu();

        // View account on explorer
        const accountListPage = new AccountListPage(driver);
        await accountListPage.checkPageIsLoaded();
        await accountListPage.viewAccountOnExplorer('Account 1');

        // Switch to block explorer
        await driver.switchToWindowWithTitle('E2E Test Page');

        // Verify block explorer
        await driver.waitForUrl({
          url: `https://etherscan.io/address/${DEFAULT_FIXTURE_ACCOUNT}#asset-multichain`,
        });
        await new MockedPage(driver).checkDisplayedMessage(
          'Empty page by MetaMask',
        );
      },
    );
  });

  it('links to the token tracker in the explorer, ', async function () {
    const smartContract = SMART_CONTRACTS.HST;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkController({
            ...mockNetworkStateOld({
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              blockExplorerUrl: 'https://etherscan.io/',
            }),
          })
          .withTokensControllerERC20()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes[0]);

        // View TST token in block explorer
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenItemNumber(2);
        await assetListPage.clickOnAsset('TST');

        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.checkPageIsLoaded();
        await tokenOverviewPage.viewAssetInExplorer();

        // Switch to block explorer
        await driver.switchToWindowWithTitle('E2E Test Page');

        // Verify block explorer
        await driver.waitForUrl({
          url: `https://etherscan.io/token/${contractAddress.toLowerCase()}`,
        });
        await new MockedPage(driver).checkDisplayedMessage(
          'Empty page by MetaMask',
        );
      },
    );
  });

  it('links to the transaction on the explorer, ', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkController({
            ...mockNetworkStateOld({
              id: 'localhost-client-id',
              chainId: '0x539',
              nickname: 'Localhost 8545',
              rpcUrl: 'http://localhost:8545',
              ticker: 'ETH',
              blockExplorerUrl: 'https://etherscan.io',
            }),
          })
          .withTransactionControllerCompletedTransaction()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // View transaction on block explorer
        await new HomePage(driver).goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkCompletedTxNumberDisplayedInActivity(1);
        await activityListPage.viewTransactionOnExplorer(1);

        // Switch to block explorer
        await driver.switchToWindowWithTitle('E2E Test Page');

        // Verify block explorer
        await driver.waitForUrl({
          url: 'https://etherscan.io/tx/0xe5e7b95690f584b8f66b33e31acc6184fea553fa6722d42486a59990d13d5fa2',
        });
        await new MockedPage(driver).checkDisplayedMessage(
          'Empty page by MetaMask',
        );
      },
    );
  });
});
