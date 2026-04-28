import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../page-objects/pages/send/send-page';
import { BitcoinNode } from '../../seeder/bitcoin/node';
import {
  mockCurrencyExchangeRates,
  mockExchangeRates,
  mockFiatExchangeRates,
  mockSolanaSpotPrices,
  mockSupportedVsCurrencies,
  mockTokensV2SupportedNetworks,
  mockTokensV3Assets,
} from '../btc/mocks';
import { proxyBitcoinBlockchainCalls } from '../btc/mocks/local-bitcoin-node-mocks';
import { mockPriceMulti, mockPriceMultiBtcAndSol } from '../btc/mocks/min-api';

const BITCOIN_CHAIN_ID = 'bip122:000000000019d6689c085ae165831e93';
const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';

async function mockBtcSendLocalMocks(
  mockServer: Mockttp,
  { localNodes }: { localNodes: unknown[] },
) {
  const bitcoinNode = localNodes.find(
    (node): node is BitcoinNode => node instanceof BitcoinNode,
  );
  if (!bitcoinNode) {
    throw new Error('Bitcoin local node was not started');
  }

  return [
    await mockExchangeRates(mockServer),
    await mockCurrencyExchangeRates(mockServer),
    await mockFiatExchangeRates(mockServer),
    await mockSolanaSpotPrices(mockServer),
    await mockSupportedVsCurrencies(mockServer),
    await mockPriceMulti(mockServer),
    await mockPriceMultiBtcAndSol(mockServer),
    await mockTokensV2SupportedNetworks(mockServer),
    await mockTokensV3Assets(mockServer),
    ...(await proxyBitcoinBlockchainCalls(mockServer, bitcoinNode)),
  ];
}

describe('BTC Account - Send with local bitcoind', function (this: Suite) {
  this.timeout(180_000);

  it('sends BTC using a local Bitcoin regtest node', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        localNodeOptions: [
          'anvil',
          {
            type: 'bitcoin',
            options: {
              initialBalance: DEFAULT_BTC_BALANCE,
            },
          },
        ],
        testSpecificMock: mockBtcSendLocalMocks,
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new BitcoinHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        await homePage.checkPageIsLoaded();
        await homePage.checkIsExpectedBitcoinBalanceDisplayed(
          DEFAULT_BTC_BALANCE,
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(BITCOIN_CHAIN_ID, 'BTC');
        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.fillAmount('0.5');
        await sendPage.pressContinueButton();

        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.checkPageIsLoaded();
        await bitcoinReviewTxPage.checkSendAmountIsDisplayed('0.5');
        await bitcoinReviewTxPage.clickConfirmButton();

        const activityListPage = new ActivityListPage(driver);
        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkWaitForTransactionStatus('pending');
      },
    );
  });
});
