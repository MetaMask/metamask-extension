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
  mockSendSwapSolanaTransaction,
  mockBridgeTxStatus,
  simulateSolanaTransaction,
  type SignatureHolder,
} from './common-solana';

const SOLANA_URL_REGEX = /^https:\/\/solana-(mainnet|devnet)\.infura\.io\/v3*/u;

/**
 * Returns only the USDC token account for SPL Token program queries,
 * and empty for Token-2022 queries. This gives the snap enough metadata
 * to display "USDC" without flooding getSignaturesForAddress.
 *
 * @param mockServer - The mockttp server instance.
 * @param signatureHolder - Shared holder; USDC is only returned after swap submission.
 */
async function mockGetTokenAccountsUSDCOnly(
  mockServer: Mockttp,
  signatureHolder: SignatureHolder,
) {
  const usdcAccount = {
    account: {
      data: {
        parsed: {
          info: {
            isNative: false,
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            owner: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
            state: 'initialized',
            tokenAmount: {
              amount: '8908267',
              decimals: 6,
              uiAmount: 8.908267,
              uiAmountString: '8.908267',
            },
          },
          type: 'account',
        },
        program: 'spl-token',
        space: 165,
      },
      executable: false,
      lamports: 2039280,
      owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      rentEpoch: 18446744073709552000,
      space: 165,
    },
    pubkey: 'F77xG4vz2CJeMxxAmFW8pvPx2c5Uk75pksr6Wwx6HFhV',
  };

  const SPL_TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withJsonBodyIncluding({ method: 'getTokenAccountsByOwner' })
    .thenCallback(async (req) => {
      const body = (await req.body.getText()) ?? '';
      const isSplToken = body.includes(SPL_TOKEN_PROGRAM);
      const swapSubmitted = signatureHolder.value !== '';
      return {
        statusCode: 200,
        json: {
          id: '1337',
          jsonrpc: '2.0',
          result: {
            context: { apiVersion: '2.2.14', slot: 343229969 },
            value: isSplToken && swapSubmitted ? [usdcAccount] : [],
          },
        },
      };
    });
}

const USDC_CAIP19 =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

/**
 * Mocks the Token API /v3/assets endpoint so the snap can resolve
 * USDC metadata (symbol, name, decimals) for the swap transaction display.
 *
 * @param mockServer - The mockttp server instance.
 */
async function mockTokenApiAssets(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://tokens.api.cx.metamask.io/v3/assets')
    .thenCallback(() => ({
      statusCode: 200,
      json: [
        {
          assetId: USDC_CAIP19,
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
        },
      ],
    }));
}

const WALLET_ADDRESS = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';

/**
 * Only returns swap signatures for the wallet address.
 * Returns empty for token account addresses to prevent the snap
 * from processing redundant transactions during asset discovery.
 *
 * @param mockServer - The mockttp server instance.
 * @param signatureHolder - Shared holder for the dynamic signature.
 */
async function mockGetSignaturesForWalletOnly(
  mockServer: Mockttp,
  signatureHolder: SignatureHolder,
) {
  return await mockServer
    .forPost(SOLANA_URL_REGEX)
    .withBodyIncluding('getSignaturesForAddress')
    .thenCallback(async (req) => {
      const body = (await req.body.getText()) ?? '';
      const isWalletAddress = body.includes(WALLET_ADDRESS);
      const swapSubmitted = signatureHolder.value !== '';

      if (!isWalletAddress || !swapSubmitted) {
        return {
          statusCode: 200,
          json: { id: '1337', jsonrpc: '2.0', result: [] },
        };
      }

      const signature = signatureHolder.value;
      return {
        statusCode: 200,
        json: {
          result: [
            {
              blockTime: 1748363309,
              confirmationStatus: 'finalized',
              err: null,
              memo: null,
              signature,
              slot: 342840492,
            },
          ],
        },
      };
    });
}

async function mockSwapSOLtoUSDC(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  // Shared holder so sendTransaction, getSignaturesForAddress, and
  // getTransaction all use the same (actual) signature.
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote(mockServer, false),
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
  ];
}

describe('Swap on Solana', function () {
  it('Completes a Swap between SOL and USDC', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
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
        await swapPage.createSolanaSwap({
          amount: 1,
          swapTo: 'USDC',
          swapFrom: 'SOL',
        });

        // Check quotes
        await swapPage.clickOnMoreQuotes();

        await swapPage.checkQuote({
          amount: '$32.00',
          totalCost: '$168.88',
          receivedAmount: '136.9 USDC',
          estimatedTime: '< 1 min',
          provider: 'Dflow Via Li Fi',
        });
        await swapPage.checkQuote({
          amount: '$32.00',
          totalCost: '$168.88',
          receivedAmount: '136.9 USDC',
          estimatedTime: '< 1 min',
          provider: 'Humidi Fi',
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
        await driver.delay(10000);
        await activityListPage.checkTransactionActivityByText(
          'Swap SOL to USDC',
        );
      },
    );
  });
});
