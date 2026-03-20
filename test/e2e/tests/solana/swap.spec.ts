import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SwapPage from '../../page-objects/pages/swap/swap-page';
import {
  mockGetMultipleAccounts,
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
  mockGetTokenAccountBalance,
  mockTokenApiAssets,
  mockGetSignaturesForWalletOnly,
  type SignatureHolder,
  mockQuoteFromUSDCtoSOL,
  mockNoQuotesAvailable,
  mockGetFailedSignaturesForAddress,
  mockGetFailedTransaction,
  mockBridgeGetTokens,
  mockBridgeSearchTokens,
  mockTokensV3Assets,
} from './common-solana';
import { mockTokensV2SupportedNetworks } from '../btc/mocks';

async function mockSwapUSDCtoSOL(
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
    await mockTokensV3Assets(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
  ];
}

async function mockSwapNoQuotes(
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
    await mockTokensV3Assets(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
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
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetSOLUSDCTransaction(mockServer, signatureHolder),
    await mockGetMintAccountInfo(mockServer),
    await mockGetSignaturesForWalletOnly(mockServer, signatureHolder),
    await mockBridgeTxStatus(mockServer),
    await mockTokenApiAssets(mockServer),
    await mockBridgeGetTokens(mockServer),
    await mockBridgeSearchTokens(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
  ];
}

/** Matches default multichain fixture account IDs + unified AssetsController state for Solana swap E2E. */
const SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE = {
  assetsInfo: {
    'eip155:1337/slip44:60': {
      aggregators: [],
      decimals: 18,
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png',
      name: 'Ethereum',
      symbol: 'ETH',
      type: 'native',
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
      decimals: 9,
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
      name: 'Solana',
      symbol: 'SOL',
      type: 'native',
    },
  },
  assetsBalance: {
    'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
      'eip155:1337/slip44:60': {
        amount: '25',
      },
    },
    'd3d3a7c8-9a21-4606-93d9-b0e045cdaca2': {
      'tron:728126428/slip44:195': {
        amount: '0',
      },
      'tron:728126428/slip44:bandwidth': {
        amount: '0',
      },
      'tron:728126428/slip44:maximum-bandwidth': {
        amount: '0',
      },
      'tron:728126428/slip44:energy': {
        amount: '0',
      },
      'tron:728126428/slip44:maximum-energy': {
        amount: '0',
      },
    },
    'fcaabb71-a0e3-4c2c-9292-972da4be2536': {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
        amount: '50',
      },
    },
  },
};

describe('Swap on Solana', function () {
  it.only('Completes a Swap between SOL and USDC', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRates({
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              conversionTime: 1770832998.066,
              rate: '168.88',
            },
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
              {
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
          // .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDC,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        // await driver.delay(15000);

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        const homePage = new NonEvmHomepage(driver);
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

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTxAmountInActivity('-0.001 SOL', 1);
        await activityListPage.checkWaitForTransactionStatus('confirmed');
        await activityListPage.checkTransactionActivityByText(
          'Swap SOL to USDC',
        );
      },
    );
  });
  it('Completes a Swap between USDC and SOL', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapUSDCtoSOL,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        const homePage = new NonEvmHomepage(driver);
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
        fixtures: new FixtureBuilder()
          .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapNoQuotes,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        const homePage = new NonEvmHomepage(driver);
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
        fixtures: new FixtureBuilder()
          .withAssetsController(SOLANA_SWAP_ASSETS_CONTROLLER_FIXTURE)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDCFailed,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Switch to Solana network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        const homePage = new NonEvmHomepage(driver);
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
        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkFailedTxNumberDisplayedInActivity(1);
      },
    );
  });
});
