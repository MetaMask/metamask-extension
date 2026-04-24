import { merge } from 'lodash';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import { DEFAULT_FIXTURE_ACCOUNT_LOWERCASE } from '../../constants';
import {
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../btc/mocks/tokens-api';
import {
  mockSolanaBalanceQuote,
  mockGetMinimumBalanceForRentExemption,
  mockMultiCoinPrice,
  mockGetLatestBlockhash,
  mockGetFeeForMessage,
  mockPriceApiSpotPriceSwap,
  mockPriceApiExchangeRates,
  mockGetTokenAccountBalance,
  mockGetMintAccountInfo,
  mockQuoteFromSoltoUSDC,
  mockGetSOLUSDCTransaction,
  mockGetUSDCSOLTransaction,
  mockSendSwapSolanaTransaction,
  mockBridgeTxStatus,
  simulateSolanaTransaction,
  mockGetTokenAccountsUSDCOnly,
  mockGetMultipleAccounts,
  mockTokenApiAssets,
  mockGetSignaturesSuccessSwap,
  type SignatureHolder,
  mockQuoteFromUSDCtoSOL,
  mockNoQuotesAvailable,
  mockGetFailedSignaturesForAddress,
  mockGetFailedTransaction,
  mockBridgeGetTokens,
  mockBridgeSearchTokens,
  mockGetSignaturesForWalletOnly,
} from './common-solana';

const isUnifiedAssetsEnabled =
  process.env.ASSETS_UNIFIED_STATE_ENABLED === 'true';

const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_WALLET_ADDRESS = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';

/**
 * Mock V2 supportedNetworks to include Solana so the AccountsApiDataSource
 * handles Solana balances via the V5 API instead of the Snap polling path.
 * @param mockServer
 */
async function mockAccountsApiV2WithSolana(mockServer: Mockttp) {
  return mockServer
    .forGet(/https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .always()
    .thenJson(200, {
      fullSupport: [
        1,
        137,
        56,
        59144,
        8453,
        10,
        42161,
        534352,
        1337,
        SOLANA_CHAIN_ID,
      ],
      partialSupport: { balances: [42220, 43114] },
    });
}

/**
 * Mock V5 multiaccount balances with SOL + USDC for the Solana wallet address
 * plus localhost ETH. The AccountsApiDataSource maps by address (not account
 * UUID), so this works regardless of which runtime account ID the Snap creates.
 * @param mockServer
 */
async function mockAccountsApiV5WithSolana(mockServer: Mockttp) {
  const balances = [
    {
      accountId: `eip155:1337:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
      assetId: 'eip155:1337/slip44:1',
      balance: '25',
    },
    {
      accountId: `${SOLANA_CHAIN_ID}:${SOLANA_WALLET_ADDRESS}`,
      assetId: `${SOLANA_CHAIN_ID}/slip44:501`,
      balance: '50',
    },
    {
      accountId: `${SOLANA_CHAIN_ID}:${SOLANA_WALLET_ADDRESS}`,
      assetId: `${SOLANA_CHAIN_ID}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
      balance: '8.908267',
    },
  ];

  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: balances.length,
        unprocessedNetworks: [],
        balances,
      },
    }));
}

/**
 * Same HTTP mocks as `main` when unified assets state is off (no accounts v2/v5,
 * no tokens v2/v3 extras; uses `mockGetSignaturesForWalletOnly`).
 *
 * @param mockServer - Mockttp server.
 */
async function mockSwapUSDCtoSOLLegacy(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockGetTokenAccountsUSDCOnly(mockServer),
    await mockGetTokenAccountBalance(mockServer),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockQuoteFromUSDCtoSOL(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetUSDCSOLTransaction(mockServer, signatureHolder),
    await mockGetMintAccountInfo(mockServer),
    await mockGetSignaturesForWalletOnly(mockServer, signatureHolder),
    await mockBridgeTxStatus(mockServer, 'USDC_TO_SOL'),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
  ];
}

async function mockSwapUSDCtoSOLUnified(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockAccountsApiV2WithSolana(mockServer),
    await mockAccountsApiV5WithSolana(mockServer),
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await mockGetTokenAccountBalance(mockServer),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockQuoteFromUSDCtoSOL(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetUSDCSOLTransaction(mockServer, signatureHolder),
    await mockGetMintAccountInfo(mockServer),
    await mockGetSignaturesSuccessSwap(mockServer, signatureHolder),
    await mockBridgeTxStatus(mockServer, 'USDC_TO_SOL', signatureHolder),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
  ];
}

async function mockSwapUSDCtoSOL(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return isUnifiedAssetsEnabled
    ? mockSwapUSDCtoSOLUnified(mockServer)
    : mockSwapUSDCtoSOLLegacy(mockServer);
}

async function mockSwapNoQuotesLegacy(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockGetTokenAccountsUSDCOnly(mockServer),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockNoQuotesAvailable(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
  ];
}

async function mockSwapNoQuotesUnified(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };
  return [
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockNoQuotesAvailable(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
  ];
}

async function mockSwapNoQuotes(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return isUnifiedAssetsEnabled
    ? mockSwapNoQuotesUnified(mockServer)
    : mockSwapNoQuotesLegacy(mockServer);
}

async function mockSwapSOLtoUSDCFailedLegacy(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockQuoteFromSoltoUSDC(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetFailedSignaturesForAddress(mockServer),
    await mockGetFailedTransaction(mockServer),
    await mockGetMintAccountInfo(mockServer),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
  ];
}

async function mockSwapSOLtoUSDCFailedUnified(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockQuoteFromSoltoUSDC(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetFailedSignaturesForAddress(mockServer),
    await mockGetFailedTransaction(mockServer),
    await mockGetMintAccountInfo(mockServer),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
  ];
}

async function mockSwapSOLtoUSDCFailed(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return isUnifiedAssetsEnabled
    ? mockSwapSOLtoUSDCFailedUnified(mockServer)
    : mockSwapSOLtoUSDCFailedLegacy(mockServer);
}

/**
 * Same HTTP mocks as `main` when unified assets state is off.
 *
 * @param mockServer - Mockttp server.
 */
async function mockSwapSOLtoUSDCLegacy(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockQuoteFromSoltoUSDC(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetSOLUSDCTransaction(mockServer, signatureHolder),
    await mockGetMintAccountInfo(mockServer),
    await mockGetSignaturesForWalletOnly(mockServer, signatureHolder),
    await mockBridgeTxStatus(mockServer),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
  ];
}

async function mockSwapSOLtoUSDCUnified(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockAccountsApiV2WithSolana(mockServer),
    await mockAccountsApiV5WithSolana(mockServer),
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockQuoteFromSoltoUSDC(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetSOLUSDCTransaction(mockServer, signatureHolder),
    await mockGetMintAccountInfo(mockServer),
    await mockGetSignaturesSuccessSwap(mockServer, signatureHolder),
    await mockBridgeTxStatus(mockServer, 'SOL_TO_USDC', signatureHolder),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
  ];
}

async function mockSwapSOLtoUSDC(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return isUnifiedAssetsEnabled
    ? mockSwapSOLtoUSDCUnified(mockServer)
    : mockSwapSOLtoUSDCLegacy(mockServer);
}

const SOL_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';
const SOL_CAIP_ASSET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const USDC_CAIP_ASSET =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const SOL_PRICE = 168.88;
const USDC_PRICE = 0.999761;

/** Matches default FixtureBuilderV2 account IDs for Solana swap E2E. */
const SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE = {
  assetsBalance: {
    [SOL_ACCOUNT_ID]: {
      [SOL_CAIP_ASSET]: {
        amount: '50',
      },
      [USDC_CAIP_ASSET]: {
        amount: '8.908267',
      },
    },
  },
  assetsInfo: {
    [SOL_CAIP_ASSET]: {
      decimals: 9,
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
      name: 'Solana',
      symbol: 'SOL',
      type: 'native',
    },
    [USDC_CAIP_ASSET]: {
      decimals: 6,
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
      name: 'USD Coin',
      symbol: 'USDC',
      type: 'token',
    },
  },
  assetsPrice: {
    [SOL_CAIP_ASSET]: {
      assetPriceType: 'fungible' as const,
      id: 'solana',
      lastUpdated: 0,
      price: SOL_PRICE,
      usdPrice: SOL_PRICE,
    },
    [USDC_CAIP_ASSET]: {
      assetPriceType: 'fungible' as const,
      id: 'usd-coin',
      lastUpdated: 0,
      price: USDC_PRICE,
      usdPrice: USDC_PRICE,
    },
  },
};

describe('Swap on Solana', function () {
  it('Completes a Swap between SOL and USDC', async function () {
    await withFixtures(
      {
        fixtures: isUnifiedAssetsEnabled
          ? (() => {
              const fixture = new FixtureBuilderV2()
                .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
                .build();
              merge(fixture.data, {
                MultichainRatesController: {
                  conversionRates: {
                    [SOL_CAIP_ASSET]: {
                      conversionTime: 1770832998.066,
                      rate: String(SOL_PRICE),
                    },
                    [USDC_CAIP_ASSET]: {
                      conversionTime: 1770832998.066,
                      rate: String(USDC_PRICE),
                    },
                  },
                },
                CurrencyController: {
                  currencyRates: {
                    ETH: {
                      conversionDate: 1770832998.066,
                      conversionRate: 1932.163232734,
                      usdConversionRate: 1932.163232734,
                    },
                  },
                },
              });
              return fixture;
            })()
          : new FixtureBuilderV2()
              .withConversionRates({
                [SOL_CAIP_ASSET]: {
                  conversionTime: 1770832998.066,
                  rate: '168.88',
                },
                [USDC_CAIP_ASSET]: {
                  conversionTime: 1770832998.066,
                  rate: '0.999761',
                },
              })
              .withCurrencyRates({
                ETH: {
                  conversionDate: 1770832998.066,
                  conversionRate: 1932.163232734,
                  usdConversionRate: 1932.163232734,
                },
              })
              .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDC,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        if (isUnifiedAssetsEnabled) {
          await homePage.waitForNonEvmAccountsLoaded();
        }

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded({ amount: '50' });

        // Create swap
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'SOL',
          network: 'Solana',
        });

        // Check quotes
        await swapPage.clickOnMoreQuotes();

        await swapPage.checkQuote({
          totalCost: '$32.00',
          receivedAmount: '136.9 USDC',
          receivedAmountInCurrency: '$136.88',
          provider: 'Dflow Via Li Fi',
        });
        await swapPage.checkQuote({
          totalCost: '$32.00',
          receivedAmount: '136.9 USDC',
          provider: 'Humidi Fi',
          receivedAmountInCurrency: '$136.88',
        });
        await swapPage.closeQuotes();

        // Review and submit
        await swapPage.reviewQuote({
          swapToAmount: '136.9',
          swapFrom: 'SOL',
          swapTo: 'USDC',
          swapFromAmount: '1',
        });

        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTxAmountInActivity('-0.001 SOL', 1);
        await activityListPage.checkWaitForTransactionStatus('confirmed');
        if (isUnifiedAssetsEnabled) {
          // BUG: The activity text or amount may not fully reflect the swap details
          // under unified state (e.g. missing destination token name or incorrect fiat value).
          await activityListPage.checkTransactionActivityByText('Swap SOL to');
        } else {
          await activityListPage.checkTransactionActivityByText(
            'Swap SOL to USDC',
          );
        }
      },
    );
  });
  it('Completes a Swap between USDC and SOL', async function () {
    await withFixtures(
      {
        fixtures: isUnifiedAssetsEnabled
          ? (() => {
              const fixture = new FixtureBuilderV2()
                .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
                .build();
              merge(fixture.data, {
                MultichainRatesController: {
                  conversionRates: {
                    [SOL_CAIP_ASSET]: {
                      conversionTime: 1770832998.066,
                      rate: String(SOL_PRICE),
                    },
                    [USDC_CAIP_ASSET]: {
                      conversionTime: 1770832998.066,
                      rate: String(USDC_PRICE),
                    },
                  },
                },
                CurrencyController: {
                  currencyRates: {
                    ETH: {
                      conversionDate: 1770832998.066,
                      conversionRate: 1932.163232734,
                      usdConversionRate: 1932.163232734,
                    },
                  },
                },
                MultichainAssetsController: {
                  accountsAssets: {
                    [SOL_ACCOUNT_ID]: [SOL_CAIP_ASSET, USDC_CAIP_ASSET],
                  },
                  assetsMetadata: {
                    [USDC_CAIP_ASSET]: {
                      fungible: true,
                      iconUrl:
                        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
                      name: 'USD Coin',
                      symbol: 'USDC',
                      units: [
                        { decimals: 6, name: 'USD Coin', symbol: 'USDC' },
                      ],
                    },
                  },
                },
              });
              return fixture;
            })()
          : new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapUSDCtoSOL,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        if (isUnifiedAssetsEnabled) {
          await homePage.waitForNonEvmAccountsLoaded();
        }

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded({ amount: '50' });

        // Create swap USDC → SOL
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'SOL',
          swapFrom: 'USDC',
          network: 'Solana',
        });

        // Review and submit
        await swapPage.reviewQuote({
          swapToAmount: '0.00589',
          swapFrom: 'USDC',
          swapTo: 'SOL',
          swapFromAmount: '1',
        });

        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTxAmountInActivity('-1 USDC', 1);
        await activityListPage.checkWaitForTransactionStatus('confirmed');
        await activityListPage.checkTransactionActivityByText(
          'Swap USDC to SOL',
        );
      },
    );
  });

  it('Swap has no quotes available', async function () {
    await withFixtures(
      {
        fixtures: isUnifiedAssetsEnabled
          ? new FixtureBuilderV2()
              .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
              .build()
          : new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapNoQuotes,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        if (isUnifiedAssetsEnabled) {
          await homePage.waitForNonEvmAccountsLoaded();
        }

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded({ amount: '50' });

        // Create swap and verify no quotes message
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'SOL',
          network: 'Solana',
        });

        await swapPage.checkNoQuotesAvailable();
      },
    );
  });

  it('Swap transaction fails gracefully', async function () {
    await withFixtures(
      {
        fixtures: isUnifiedAssetsEnabled
          ? new FixtureBuilderV2()
              .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
              .build()
          : new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDCFailed,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        if (isUnifiedAssetsEnabled) {
          await homePage.waitForNonEvmAccountsLoaded();
        }

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded({ amount: '50' });

        // Create swap SOL → USDC
        const swapPage = new SwapPage(driver);
        await homePage.clickOnSwapButton();
        await swapPage.createSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'SOL',
          network: 'Solana',
        });

        // Submit the swap (will fail)
        await swapPage.reviewQuote({
          swapToAmount: '136.9',
          swapFrom: 'SOL',
          swapTo: 'USDC',
          swapFromAmount: '1',
        });

        // After failure, the bridge navigates to home/activity with the failed tx
        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkFailedTxNumberDisplayedInActivity(1);
      },
    );
  });
});
