import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../page-objects/pages/send/send-page';
import {
  mockAccountsApiV2WithBtc,
  mockAccountsApiV5WithBtc,
  mockBtcSpotPrices,
  mockExchangeRates,
  mockCurrencyExchangeRates,
  mockFiatExchangeRates,
  mockInitialFullScan,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
} from '../btc/mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../btc/mocks/min-api';

const isUnifiedAssetsEnabled = true;

const BTC_CHAIN_CAIP_ID = 'bip122:000000000019d6689c085ae165831e93';
const BTC_CAIP_ASSET_ID = `${BTC_CHAIN_CAIP_ID}/slip44:0`;

const BTC_V3_ASSET_ENTRY = {
  assetId: BTC_CAIP_ASSET_ID,
  name: 'Bitcoin',
  symbol: 'BTC',
  decimals: 8,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
  coingeckoId: 'bitcoin',
  type: 'native',
};

/**
 * Overrides global mock-e2e `supportedNetworks` (registered after testSpecificMock)
 * so TokenDataSource treats Bitcoin as supported and fetches BTC metadata.
 * @param mockServer
 */
function mockBtcSendTokensSupportedNetworks(mockServer: Mockttp) {
  return mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .asPriority(99)
    .always()
    .thenJson(200, {
      fullSupport: [
        BTC_CHAIN_CAIP_ID,
        'eip155:1',
        'eip155:1337',
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      ],
      partialSupport: [],
    });
}

/**
 * Overrides global mock-e2e `/v3/assets` so BTC metadata is always available
 * for unified-assets token list rendering on the Bitcoin network.
 * @param mockServer
 */
function mockBtcSendTokensV3Assets(mockServer: Mockttp) {
  return mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
    .asPriority(99)
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: [BTC_V3_ASSET_ENTRY],
    }));
}

const BTC_SEND_ASSETS_CONTROLLER_FIXTURE = {
  assetsInfo: {
    [BTC_CAIP_ASSET_ID]: {
      decimals: 8,
      image:
        'https://static.cx.metamask.io/api/v1/tokenIcons/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
      name: 'Bitcoin',
      symbol: 'BTC',
      type: 'native',
    },
  },
};

function buildBtcSendFixtures() {
  if (!isUnifiedAssetsEnabled) {
    return new FixtureBuilderV2().build();
  }
  return new FixtureBuilderV2()
    .withAssetsController(BTC_SEND_ASSETS_CONTROLLER_FIXTURE)
    .build();
}

async function mockBtcSendMocks(mockServer: Mockttp) {
  return [
    ...(isUnifiedAssetsEnabled
      ? [
          mockAccountsApiV2WithBtc(mockServer),
          mockAccountsApiV5WithBtc(mockServer),
        ]
      : []),
    await mockInitialFullScan(mockServer),
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    mockBtcSendTokensSupportedNetworks(mockServer),
    mockBtcSendTokensV3Assets(mockServer),
    await mockBtcSpotPrices(mockServer),
  ];
}

describe('BTC Account - Send', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
  const bitcoinChainId = 'bip122:000000000019d6689c085ae165831e93';

  it('fields validation', async function () {
    await withFixtures(
      {
        fixtures: buildBtcSendFixtures(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(bitcoinChainId, 'BTC');

        await sendPage.fillRecipient('invalidBTCAddress');
        await sendPage.checkInvalidAddressError();
      },
    );
  });

  it('amount validation', async function () {
    await withFixtures(
      {
        fixtures: buildBtcSendFixtures(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(bitcoinChainId, 'BTC');

        await sendPage.fillRecipient(recipientAddress);

        await sendPage.fillAmount('5');
        await sendPage.checkInsufficientFundsError();
      },
    );
  });

  it('can complete the send flow', async function () {
    const sendAmount = '0.5';
    const expectedFee = '0.00000281';
    const expectedTotal = '53381.50';

    await withFixtures(
      {
        fixtures: buildBtcSendFixtures(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        testSpecificMock: mockBtcSendMocks,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        const sendPage = new SendPage(driver);
        const activityTab = new ActivityTab(driver);

        await homePage.startSendFlow();

        await sendPage.selectToken(bitcoinChainId, 'BTC');
        await sendPage.fillRecipient(recipientAddress);
        await sendPage.fillAmount(sendAmount);
        await sendPage.isContinueButtonEnabled();
        await sendPage.pressContinueButton();

        // From here, we have moved to the confirmation screen
        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.checkPageIsLoaded();
        await bitcoinReviewTxPage.checkNetworkFeeIsDisplayed(expectedFee);
        await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(expectedTotal);
        await bitcoinReviewTxPage.clickConfirmButton();

        // Wait for the transaction to appear in the activity list
        await activityTab.checkTransactionActivityByText('Sending');

        // Note: Transaction shows as "Pending" immediately after broadcast.
        // The BTC snap stores it with "Unconfirmed" status when broadcast.
        await activityTab.checkWaitForTransactionStatus('pending');
      },
    );
  });
});
