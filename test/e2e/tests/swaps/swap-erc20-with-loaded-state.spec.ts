import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import TokenOverviewPage from '../../page-objects/pages/token-overview-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import SwapPage from '../../page-objects/pages/swap/swap-page';

async function mockSwapQuotes(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/token/1')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          symbol: 'WETH',
          type: 'erc20',
          aggregators: [
            'metamask',
            'aave',
            'coinGecko',
            'oneInch',
            'pmm',
            'zerion',
            'lifi',
            'socket',
            'squid',
            'sonarwatch',
            'uniswapLabs',
            'coinmarketcap',
            'rango',
          ],
          occurrences: 13,
          iconUrl:
            'https://raw.githubusercontent.com/MetaMask/contract-metadata/master/images/weth.svg',
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          name: 'Wrapped Ether',
          decimals: 18,
        },
      })),
    await mockServer
      .forPost('https://transaction.api.cx.metamask.io/networks/1/getFees')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          blockNumber: 22017409,
          id: 'b6d9c5f3-4fee-4470-be1b-6c574fe61315',
          txs: [
            {
              cancelFees: [],
              return: '0x',
              status: 1,
              gasUsed: 188186,
              gasLimit: 241302,
              fees: [
                {
                  maxFeePerGas: 6393950816,
                  maxPriorityFeePerGas: 1000000004,
                  gas: 241302,
                  balanceNeeded: 1542873120043734,
                  currentBalance: 30009434625664560,
                  error: '',
                },
              ],
              feeEstimate: 821886724082654,
              baseFeePerGas: 3367416938,
              maxFeeEstimate: 1542873119802432,
            },
          ],
        },
      })),
    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1/trades')
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            trade: {
              data: '0x2e1a7d4d0000000000000000000000000000000000000000000000008ac7230489e80000',
              to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
              value: '0',
              from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            },
            hasRoute: false,
            sourceAmount: '10000000000000000000',
            destinationAmount: '10000000000000000000',
            error: null,
            sourceToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            destinationToken: '0x0000000000000000000000000000000000000000',
            maxGas: 300000,
            averageGas: 280000,
            estimatedRefund: 0,
            isGasIncludedTrade: false,
            approvalNeeded: null,
            fetchTime: 63,
            aggregator: 'wrappedNative',
            aggType: 'CONTRACT',
            fee: 0,
            quoteRefreshSeconds: 30,
            gasMultiplier: 1.1,
            sourceTokenRate: 0.9996738094827067,
            destinationTokenRate: 1,
            priceSlippage: {
              ratio: 0.9997007391742396,
              alculationError: '',
              bucket: 'low',
              sourceAmountInUSD: 20049.4,
              destinationAmountInUSD: 20055.4,
              sourceAmountInNativeCurrency: 9.996738094827068,
              destinationAmountInNativeCurrency: 10,
              sourceAmountInETH: 9.996738094827068,
              destinationAmountInETH: 10,
            },
          },
        ],
      })),
  ];
}

describe('Swap', function () {
  it('should swap WETH to ETH', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController({
            allTokens: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    symbol: 'WETH',
                    decimals: 18,
                    isERC721: false,
                    aggregators: [],
                  },
                ],
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapQuotes,
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              chainId: 1,
              hardfork: 'london',
              loadState:
                './test/e2e/seeder/network-states/swap-state/withSwapContracts.json',
            },
          },
        ],
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.check_expectedTokenBalanceIsDisplayed('50', 'WETH');

        // disable smart transactions
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.openSettingsPage();

        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.check_pageIsLoaded();
        await advancedSettingsPage.toggleSmartTransactions();
        await settingsPage.closeSettingsPage();

        // Swap WETH to ETH
        const assetListPage = new AssetListPage(driver);
        await assetListPage.clickOnAsset('WETH');

        const tokenOverviewPage = new TokenOverviewPage(driver);
        await tokenOverviewPage.check_pageIsLoaded();
        await tokenOverviewPage.clickSwap();

        const swapPage = new SwapPage(driver);
        await swapPage.check_pageIsLoaded();
        await swapPage.enterSwapAmount('10');
        await swapPage.selectDestinationToken('Ether');
        await swapPage.submitSwap();

        await homePage.check_expectedTokenBalanceIsDisplayed('40', 'WETH');
      },
    );
  });
});
