import { Suite } from 'mocha';
import { Mockttp, MockedEndpoint } from 'mockttp';
import { merge } from 'lodash';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import NetworkManager from '../../page-objects/pages/network-manager';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import {
  mockAccountsApiV2SupportedNetworks,
  mockAccountsApiV5MultiaccountBalances,
} from './mocks/accounts-api';
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

const isUnifiedAssetsEnabled = true;

const SOL_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';
const SOL_CAIP_ASSET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const USDC_CAIP_ASSET =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const SOL_PRICE = 168.88;
const USDC_PRICE = 0.999761;
const USDC_BALANCE_HUMAN = '8.908267';

// --- Unified-assets-only helpers ---

const SOLANA_SPL_ASSETS_CONTROLLER_FIXTURE = {
  assetsBalance: {
    [SOL_ACCOUNT_ID]: {
      [SOL_CAIP_ASSET]: {
        amount: '50',
      },
      [USDC_CAIP_ASSET]: {
        amount: USDC_BALANCE_HUMAN,
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

const MULTICHAIN_ASSETS_CONTROLLER_USDC_PATCH = {
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
        units: [{ decimals: 6, name: 'USD Coin', symbol: 'USDC' }],
      },
    },
  },
};

async function mockSolanaTokenApiAssets(mockServer: Mockttp) {
  const solanaAssets: Record<
    string,
    {
      name: string;
      symbol: string;
      decimals: number;
      iconUrl?: string;
      coingeckoId?: string;
    }
  > = {
    [SOL_CAIP_ASSET]: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
      coingeckoId: 'solana',
    },
    [USDC_CAIP_ASSET]: {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
      coingeckoId: 'usd-coin',
    },
  };

  // Only intercept v3/assets requests that contain Solana asset IDs.
  // EVM-only and Tron-only requests fall through to mockTokenApiMainnetTest.
  return await mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets.*solana/u)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const assetIdsParam = url.searchParams.getAll('assetIds').join(',');
      const ids = assetIdsParam
        ? assetIdsParam
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : [];
      const results = ids
        .filter((id) => solanaAssets[id])
        .map((id) => ({ assetId: id, ...solanaAssets[id] }));
      return { statusCode: 200, json: results };
    });
}

// --- Mock builders ---

const mockSendWithUSDCVisible = async (
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> => [
  ...(isUnifiedAssetsEnabled
    ? [
        await mockAccountsApiV2SupportedNetworks(mockServer),
        await mockAccountsApiV5MultiaccountBalances(mockServer),
      ]
    : []),
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
  await mockGetTokenAccountBalance(mockServer),
  await mockGetSuccessSplTokenTransaction(mockServer),
  await mockGetMintAccountInfo(mockServer),

  isUnifiedAssetsEnabled
    ? await mockSolanaTokenApiAssets(mockServer)
    : await mockTokenApiAssets(mockServer),
];

async function mockSendSPLTokenFailed(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    ...(isUnifiedAssetsEnabled
      ? [
          await mockAccountsApiV2SupportedNetworks(mockServer),
          await mockAccountsApiV5MultiaccountBalances(mockServer),
        ]
      : []),
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
    isUnifiedAssetsEnabled
      ? await mockSolanaTokenApiAssets(mockServer)
      : await mockTokenApiAssets(mockServer),
  ];
}

describe('Send flow - SPL Token', function (this: Suite) {
  it('user with more than 1 token in the token list', async function () {
    await withFixtures(
      {
        fixtures: (() => {
          if (!isUnifiedAssetsEnabled) {
            return new FixtureBuilderV2().build();
          }
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
                [USDC_CAIP_ASSET]: {
                  conversionTime: 1770832998.066,
                  rate: String(USDC_PRICE),
                },
              },
            },
            ...MULTICHAIN_ASSETS_CONTROLLER_USDC_PATCH,
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendWithUSDCVisible,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        if (isUnifiedAssetsEnabled) {
          await homePage.waitForNonEvmAccountsLoaded();
        }

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('50');
        await homePage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'USDC',
        );

        await sendPage.checkContinueButton({ state: 'disabled' });
        await sendPage.fillRecipient({ recipientAddress: commonSolanaAddress });
        await sendPage.fillAmount('0.1');
        await sendPage.checkContinueButton({ state: 'enabled' });

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkTxAction({ action: 'Sent USDC' });

        if (isUnifiedAssetsEnabled) {
          await driver.waitForSelector({
            css: '[data-testid="transaction-list-item-primary-currency"]',
            text: '0.1',
          });
        } else {
          await activityTab.checkTxAmountInActivity('-0.1 USDC', 1);
        }

        await activityTab.checkNoFailedTransactions();
      },
    );
  });

  it('and send transaction fails', async function () {
    await withFixtures(
      {
        fixtures: (() => {
          if (!isUnifiedAssetsEnabled) {
            return new FixtureBuilderV2().build();
          }
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
                [USDC_CAIP_ASSET]: {
                  conversionTime: 1770832998.066,
                  rate: String(USDC_PRICE),
                },
              },
            },
            ...MULTICHAIN_ASSETS_CONTROLLER_USDC_PATCH,
          });
          return fixture;
        })(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSendSPLTokenFailed,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        if (isUnifiedAssetsEnabled) {
          await homePage.waitForNonEvmAccountsLoaded();
        }

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Solana');

        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('50');
        await homePage.clickOnSendButton();

        const sendPage = new SendPage(driver);
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'USDC',
        );

        await sendPage.checkContinueButton({ state: 'disabled' });
        await sendPage.fillRecipient({ recipientAddress: commonSolanaAddress });
        await sendPage.fillAmount('0.1');
        await sendPage.checkContinueButton({ state: 'enabled' });

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityTab = new ActivityTab(driver);
        await activityTab.checkFailedTxNumberDisplayedInActivity();
        await activityTab.checkTxAction({
          action: 'Interaction failed',
          confirmedTx: 0,
        });
      },
    );
  });
});
