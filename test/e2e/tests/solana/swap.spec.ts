import { merge } from 'lodash';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import {
  mockSolanaBalanceQuote,
  mockGetMinimumBalanceForRentExemption,
  mockMultiCoinPrice,
  mockGetLatestBlockhash,
  mockGetFeeForMessage,
  mockPriceApiSpotPriceSwap,
  mockPriceApiExchangeRates,
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
  mockGetSignaturesForWalletOnly,
  mockGetSignaturesSuccessSwap,
  mockGetTokenAccountBalance,
  type SignatureHolder,
  mockQuoteFromUSDCtoSOL,
  mockNoQuotesAvailable,
  mockGetFailedSignaturesForAddress,
  mockGetFailedTransaction,
  mockBridgeGetTokens,
  mockBridgeSearchTokens,
  mockTokensV3Assets,
} from './common-solana';
import { mockTokensV2SupportedNetworks } from '../btc/mocks/tokens-api';

async function mockSwapUSDCtoSOL(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
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

async function mockSwapNoQuotes(
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

async function mockSwapSOLtoUSDCFailed(
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

async function mockSwapSOLtoUSDC(
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
    await mockGetSignaturesSuccessSwap(mockServer, signatureHolder),
    await mockBridgeTxStatus(mockServer, 'SOL_TO_USDC', signatureHolder),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
  ];
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
  assetsPrice: {
    [SOL_CAIP_ASSET]: {
      assetPriceType: 'fungible',
      id: 'solana',
      price: SOL_PRICE,
      usdPrice: SOL_PRICE,
    },
    [USDC_CAIP_ASSET]: {
      assetPriceType: 'fungible',
      id: 'usd-coin',
      price: USDC_PRICE,
      usdPrice: USDC_PRICE,
    },
  },
};

describe('Swap on Solana', function () {
  it('Completes a Swap between SOL and USDC', async function () {
    await withFixtures(
      {
        fixtures: (() => {
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
            RemoteFeatureFlagController: {
              remoteFeatureFlags: {
                assetsUnifyState: { enabled: true, featureVersion: '1' },
              },
            },
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDC,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

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

        // await driver.delay(15000);

        await homePage.goToActivityList();
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTxAmountInActivity('-0.001 SOL', 1);
        await activityListPage.checkWaitForTransactionStatus('confirmed');
        // BUG: The activity list is not showing the correct text under unified state
        await activityListPage.checkTransactionActivityByText(
          'Swap SOL to',
        );
      },
    );
  });
  it('Completes a Swap between USDC and SOL', async function () {
    await withFixtures(
      {
        fixtures: (() => {
          const fixture = new FixtureBuilderV2()
            .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
            .build();
          merge(fixture.data, {
            MultichainAssetsController: {
              accountsAssets: {
                [SOL_ACCOUNT_ID]: [SOL_CAIP_ASSET, USDC_CAIP_ASSET],
              },
            },
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
            RemoteFeatureFlagController: {
              remoteFeatureFlags: {
                assetsUnifyState: { enabled: true, featureVersion: '1' },
              },
            },
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapUSDCtoSOL,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

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
          'Swap USDC to',
        );
      },
    );
  });

  it('Swap has no quotes available', async function () {
    await withFixtures(
      {
        fixtures: (() => {
          const fixture = new FixtureBuilderV2()
            .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
            .build();
          merge(fixture.data, {
            RemoteFeatureFlagController: {
              remoteFeatureFlags: {
                assetsUnifyState: { enabled: true, featureVersion: '1' },
              },
            },
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapNoQuotes,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

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
        fixtures: (() => {
          const fixture = new FixtureBuilderV2()
            .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
            .build();
          merge(fixture.data, {
            RemoteFeatureFlagController: {
              remoteFeatureFlags: {
                assetsUnifyState: { enabled: true, featureVersion: '1' },
              },
            },
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDCFailed,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

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
