import { Suite } from 'mocha';
import { MockttpServer } from 'mockttp';
import {
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/home/homepage';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import { NATIVE_TOKEN_SYMBOL, SwapSendPage } from './swap-send-test-utils';

async function mockSwapQuotes(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet('https://price.api.cx.metamask.io/v2/chains/1/spot-prices')
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),

    await mockServer
      .forGet(
        'https://accounts.api.cx.metamask.io/v2/accounts/0x5cfe73b6021e818b776b421b1c4db2474086a7e1/balances',
      )
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          count: 0,
          balances: [
            {
              object: 'token',
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              name: 'Ether',
              type: 'native',
              timestamp: '2015-07-30T03:26:13.000Z',
              decimals: 18,
              chainId: 1,
              balance: '20',
            },
          ],
          unprocessedNetworks: [],
        },
      })),

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
      .forGet('https://swap.api.cx.metamask.io/v2/networks/1/quotes')
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          {
            aggregator: 'WETH',
            aggregatorType: 'CONTRACT',
            destinationToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            sourceToken: '0x0000000000000000000000000000000000000000',
            sourceAmount: '10000000000000000000',
            destinationAmount: '10000000000000000000',
            trade: {
              data: '0xd0e30db0',
              from: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
              to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
              value: '10000000000000000000',
            },
            sender: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
            recipient: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
            error: null,
            gasParams: {
              maxGas: 500000,
              averageGas: 300000,
              estimatedRefund: 0,
              gasMultiplier: 1,
            },
            fee: 0,
            approvalNeeded: null,
            priceSlippage: null,
            sourceTokenRate: 1,
            destinationTokenRate: 0.9999285710414016,
          },
        ],
      })),

    await mockServer
      .forGet('https://swap.api.cx.metamask.io/networks/1')
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
            address: '0x0000000000000000000000000000000000000000',
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

describe('Swap-Send ETH', function () {
  describe('to non-contract address with data that matches swap data signature', function (this: Suite) {
    it('submits a transaction successfully with max amount', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withNetworkControllerOnMainnet()
            .withEnabledNetworks({
              eip155: {
                '0x1': true, // Ethereum Mainnet
              },
            })
            .withPreferencesControllerSmartTransactionsOptedOut()
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
          manifestFlags: {
            testing: { disableSmartTransactionsMigration: true },
          },
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
        async ({ driver }) => {
          const swapSendPage = new SwapSendPage(driver);
          await logInWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await homePage.checkExpectedTokenBalanceIsDisplayed('50', 'WETH');
          await homePage.checkExpectedTokenBalanceIsDisplayed('25', 'ETH');

          // START SWAP AND SEND FLOW
          await openActionMenuAndStartSendFlow(driver);

          await swapSendPage.fillRecipientAddressInput(DEFAULT_FIXTURE_ACCOUNT);
          await swapSendPage.fillAmountInput('1');

          await swapSendPage.verifyMaxButtonClick(
            ['ETH', 'ETH'],
            ['24.99945808355143', '24.99945808355143'],
          );

          await swapSendPage.fillAmountInput('10');
          await swapSendPage.verifyAssetSymbolsAndAmounts(
            [NATIVE_TOKEN_SYMBOL, NATIVE_TOKEN_SYMBOL],
            ['10', '10'],
          );

          await swapSendPage.fillAmountInput('10');

          const ETH_WETH_TOKEN_INPUTS = [
            [NATIVE_TOKEN_SYMBOL, 'WETH'],
            ['10', '10'],
          ];
          const ETH_WETH_FIAT_INPUTS = [
            ['USD', 'USD'],
            ['1,700.00', '1,701.09'],
          ];

          await swapSendPage.clickOnAsset('WETH', 'dest');
          await swapSendPage.verifyAssetSymbolsAndAmounts(
            ETH_WETH_TOKEN_INPUTS[0],
            ETH_WETH_TOKEN_INPUTS[1],
          );

          await swapSendPage.verifySwitchPrimaryCurrency(
            ETH_WETH_TOKEN_INPUTS,
            ETH_WETH_FIAT_INPUTS,
          );

          await swapSendPage.verifyQuoteDisplay(
            '1 ETH = 1 WETH',
            '0.0129028 ETH',
            '≈ $21.93',
          );

          await swapSendPage.submitSwap();
          await swapSendPage.verifyHistoryEntry(
            'Sent ETH as WETH',
            'Confirmed',
            '-10 ETH',
            '',
          );

          await homePage.goToTokensTab();
          await homePage.checkExpectedTokenBalanceIsDisplayed('60', 'WETH');
          // https://github.com/MetaMask/metamask-extension/issues/31427
          // await homePage.checkExpectedTokenBalanceIsDisplayed(
          //   '14.99994',
          //   'ETH',
          // );

          driver.summarizeErrorsAndExceptions();
        },
      );
    });
  });
});
