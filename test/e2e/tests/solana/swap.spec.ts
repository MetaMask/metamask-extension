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
} from './common-solana';

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
  ];
}

describe('Swap on Solana', function () {
  it('Completes a Swap between SOL and USDC', async function () {
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
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDC,
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
        fixtures: new FixtureBuilder().build(),
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
        fixtures: new FixtureBuilder().build(),
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
        fixtures: new FixtureBuilder().build(),
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
