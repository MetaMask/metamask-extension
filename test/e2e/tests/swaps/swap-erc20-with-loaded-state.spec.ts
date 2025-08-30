import { MockttpServer, CompletedRequest } from 'mockttp';
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
import {
  mockEmptyHistoricalPrices,
  mockEmptyPrices,
} from '../tokens/utils/mocks';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';

async function mockSwapQuotes(mockServer: MockttpServer) {
  const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

  return [
    await mockEmptyHistoricalPrices(mockServer, ETH_ADDRESS, '0x1'),
    await mockEmptyPrices(mockServer, '1'),
    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/token/1')
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
          address: WETH_ADDRESS,
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
      .forGet('https://bridge.api.cx.metamask.io/networks/1/trades')
      .thenCallback((request: CompletedRequest) => {
        const url = new URL(request.url);
        const sourceToken = url.searchParams.get('sourceToken')?.toLowerCase();
        const destinationToken = url.searchParams
          .get('destinationToken')
          ?.toLowerCase();
        const walletAddress =
          url.searchParams.get('walletAddress') || DEFAULT_FIXTURE_ACCOUNT;
        const sourceAmount = url.searchParams.get('sourceAmount');

        const isEthToWeth =
          sourceToken === ETH_ADDRESS && destinationToken === WETH_ADDRESS;

        const data = isEthToWeth
          ? '0xd0e30db0'
          : '0x2e1a7d4d0000000000000000000000000000000000000000000000008ac7230489e80000';
        const response = {
          statusCode: 200,
          json: [
            {
              trade: {
                data,
                to: WETH_ADDRESS,
                value: isEthToWeth ? sourceAmount : '0',
                from: walletAddress,
              },
              hasRoute: false,
              sourceAmount,
              destinationAmount: sourceAmount,
              error: null,
              sourceToken: sourceToken || ETH_ADDRESS,
              destinationToken: destinationToken || WETH_ADDRESS,
              maxGas: 300000,
              averageGas: 280000,
              estimatedRefund: 0,
              isGasIncludedTrade: false,
              approvalNeeded: null,
              fetchTime: 27,
              aggregator: 'wrappedNative',
              aggType: 'CONTRACT',
              fee: 0,
              quoteRefreshSeconds: 30,
              gasMultiplier: 1.1,
              sourceTokenRate: 1,
              destinationTokenRate: 1.001552079142939,
              priceSlippage: {
                ratio: 1.0005795645538318,
                calculationError: '',
                bucket: 'low',
                sourceAmountInUSD: 20705.2,
                destinationAmountInUSD: 20693.2,
                sourceAmountInNativeCurrency: 10,
                destinationAmountInNativeCurrency: 10.01552079142939,
                sourceAmountInETH: 10,
                destinationAmountInETH: 10.01552079142939,
              },
            },
          ],
        };
        return response;
      }),

    await mockServer
      .forGet('https://bridge.api.cx.metamask.io/networks/1')
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          active: true,
          networkId: 1,
          chainId: 1,
          chainName: 'Ethereum Mainnet',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
            address: ETH_ADDRESS,
          },
          iconUrl: 'https://s3.amazonaws.com/airswap-token-images/ETH.png',
          blockExplorerUrl: 'https://etherscan.io',
          networkType: 'L1',
          aggregators: [
            'airswapV3',
            'airswapV4',
            'oneInchV4',
            'oneInchV5',
            'paraswap',
            'pmm',
            'zeroEx',
            'openOcean',
            'hashFlow',
            'wrappedNative',
            'kyberSwap',
            'airSwapV4_3',
            'hashFlowV3',
          ],
          refreshRates: {
            quotes: 30,
            quotesPrefetching: 30,
            stxGetTransactions: 10,
            stxBatchStatus: 1,
            stxStatusDeadline: 160,
            stxMaxFeeMultiplier: 2,
          },
          parameters: {
            refreshRates: {
              quotes: 30,
              quotesPrefetching: 30,
              stxGetTransactions: 10,
              stxBatchStatus: 1,
            },
            stxStatusDeadline: 160,
            stxMaxFeeMultiplier: 2,
          },
        },
      })),
  ];
}

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('Swap', function () {
  const swapTestCases = [
    {
      name: 'should swap WETH to ETH',
      sourceToken: 'WETH',
      destinationToken: 'Ether',
      sourceAmount: '10',
      expectedWethBalance: '40',
      expectedEthBalance: '34.99991',
    },
    {
      name: 'should swap ETH to WETH',
      sourceToken: 'Ethereum',
      destinationToken: 'WETH',
      sourceAmount: '10',
      expectedWethBalance: '60',
      expectedEthBalance: '14.99992',
    },
  ];

  swapTestCases.forEach((testCase) => {
    it(testCase.name, async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true,
              },
            })
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
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedTokenBalanceIsDisplayed('50', 'WETH');
          await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');

          // disable smart transactions
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.checkPageIsLoaded();
          await headerNavbar.openSettingsPage();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.clickAdvancedTab();
          const advancedSettingsPage = new AdvancedSettings(driver);
          await advancedSettingsPage.checkPageIsLoaded();
          await advancedSettingsPage.toggleSmartTransactions();
          await settingsPage.closeSettingsPage();

          // Swap tokens
          const assetListPage = new AssetListPage(driver);
          await assetListPage.clickOnAsset(testCase.sourceToken);

          const tokenOverviewPage = new TokenOverviewPage(driver);
          await tokenOverviewPage.checkPageIsLoaded();
          await tokenOverviewPage.clickSwap();

          const swapPage = new SwapPage(driver);
          await swapPage.checkPageIsLoaded();
          await swapPage.enterSwapAmount(testCase.sourceAmount);
          await swapPage.selectDestinationToken(testCase.destinationToken);

          await swapPage.dismissManualTokenWarning();
          await driver.delay(1500);
          await swapPage.submitSwap();
          await swapPage.waitForTransactionToComplete();

          await homePage.checkExpectedTokenBalanceIsDisplayed(
            testCase.expectedWethBalance,
            'WETH',
          );

          // https://github.com/MetaMask/metamask-extension/issues/31427
          // await homePage.checkExpectedTokenBalanceIsDisplayed(
          //   testCase.expectedEthBalance,
          //   'ETH',
          // );
        },
      );
    });
  });
});
