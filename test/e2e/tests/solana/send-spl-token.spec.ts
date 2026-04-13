import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { merge } from 'lodash';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import {
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
} from '../../constants';
import NetworkManager from '../../page-objects/pages/network-manager';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import {
  commonSolanaAddress,
  mockGetFeeForMessage,
  mockGetLatestBlockhash,
  mockGetMinimumBalanceForRentExemption,
  mockGetMintAccountInfo,
  mockGetMultipleAccounts,
  mockGetSuccessSignaturesForAddress,
  mockGetSuccessSplTokenTransaction,
  mockGetFailedSignaturesForAddress,
  mockGetFailedTransaction,
  mockGetTokenAccountsUSDCOnly,
  mockGetTokenAccountBalance,
  mockMultiCoinPrice,
  mockPriceApiExchangeRates,
  mockPriceApiSpotPriceSwap,
  mockSendSolanaTransaction,
  mockSolanaBalanceQuote,
  mockTokenApiAssets,
  simulateSolanaTransaction,
} from './common-solana';

const SOL_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';
const SOL_CAIP_ASSET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const SOL_PRICE = 168.88;
const SOLANA_CHAIN_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOLANA_WALLET_ADDRESS = '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer';

async function mockAccountsApiV2WithSolana(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u,
    )
    .always()
    .thenJson(200, {
      fullSupport: [1, 137, 56, 59144, 8453, 10, 42161, 534352, 1337, SOLANA_CHAIN_ID],
      partialSupport: { balances: [42220, 43114] },
    });
}

async function mockAccountsApiV5WithSolana(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  const balances = [
    {
      accountId: `eip155:1337:${DEFAULT_FIXTURE_ACCOUNT_LOWERCASE}`,
      assetId: 'eip155:1337/slip44:60',
      balance: '25',
    },
    {
      accountId: `${SOLANA_CHAIN_ID}:${SOLANA_WALLET_ADDRESS}`,
      assetId: SOL_CAIP_ASSET,
      balance: '50',
    },
  ];
  return mockServer
    .forGet(
      /https:\/\/accounts\.api\.cx\.metamask\.io\/v5\/multiaccount\/balances/u,
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: { count: balances.length, unprocessedNetworks: [], balances },
    }));
}

const SOLANA_SPL_ASSETS_CONTROLLER_FIXTURE = {
  assetsBalance: {
    [SOL_ACCOUNT_ID]: {
      [SOL_CAIP_ASSET]: { amount: '50' },
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
  },
  assetsPrice: {
    [SOL_CAIP_ASSET]: {
      assetPriceType: 'fungible',
      id: 'solana',
      price: SOL_PRICE,
      usdPrice: SOL_PRICE,
    },
  },
};

async function mockSendWithUSDCVisible(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockAccountsApiV2WithSolana(mockServer),
    await mockAccountsApiV5WithSolana(mockServer),
    await mockGetTokenAccountsUSDCOnly(mockServer),
    await mockGetTokenAccountBalance(mockServer),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSolanaTransaction(mockServer),
    await mockGetSuccessSignaturesForAddress(mockServer),
    await mockGetSuccessSplTokenTransaction(mockServer),
    await mockGetMintAccountInfo(mockServer),
    await mockTokenApiAssets(mockServer),
  ];
}

async function mockSendSPLTokenFailed(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await mockAccountsApiV2WithSolana(mockServer),
    await mockAccountsApiV5WithSolana(mockServer),
    await mockGetTokenAccountsUSDCOnly(mockServer),
    await mockGetTokenAccountBalance(mockServer),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote({ mockServer }),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSolanaTransaction(mockServer),
    await mockGetFailedSignaturesForAddress(mockServer),
    await mockGetFailedTransaction(mockServer),
    await mockGetMintAccountInfo(mockServer),
    await mockTokenApiAssets(mockServer),
  ];
}

describe('Send flow - SPL Token', function (this: Suite) {
  it('user with more than 1 token in the token list', async function () {
    await withFixtures(
      {
        fixtures: (() => {
          const fixture = new FixtureBuilderV2()
            .withAssetsController(SOLANA_SPL_ASSETS_CONTROLLER_FIXTURE)
            .build();
          merge(fixture.data, {
            MultichainRatesController: {
              conversionRates: {
                [SOL_CAIP_ASSET]: {
                  conversionTime: 1770832998.066,
                  rate: String(SOL_PRICE),
                },
              },
            },
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendWithUSDCVisible,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new NonEvmHomepage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'USDC',
        );

        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendPage.fillRecipient(commonSolanaAddress);
        await sendPage.fillAmount('0.1');
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue button should be enabled',
        );

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAction({ action: 'Sent' });
        await activityList.checkTxAmountInActivity('-0.1 USDC', 1);
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  it('and send transaction fails', async function () {
    await withFixtures(
      {
        fixtures: (() => {
          const fixture = new FixtureBuilderV2()
            .withAssetsController(SOLANA_SPL_ASSETS_CONTROLLER_FIXTURE)
            .build();
          merge(fixture.data, {
            MultichainRatesController: {
              conversionRates: {
                [SOL_CAIP_ASSET]: {
                  conversionTime: 1770832998.066,
                  rate: String(SOL_PRICE),
                },
              },
            },
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendSPLTokenFailed,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new NonEvmHomepage(driver);
        await homePage.waitForNonEvmAccountsLoaded();
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'USDC',
        );

        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendPage.fillRecipient(commonSolanaAddress);
        await sendPage.fillAmount('0.1');
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue button should be enabled',
        );

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkFailedTxNumberDisplayedInActivity();
        await activityList.checkTxAction({
          action: 'Interaction',
          confirmedTx: 0,
        });
      },
    );
  });
});
