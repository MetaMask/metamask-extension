import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
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
  localNodes: unknown[],
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
    // Captured in afterLocalNodesStart (which runs before the network mocks
    // are set up) so the mock builder can proxy calls to the local node.
    // testSpecificMock itself keeps its single-argument contract.
    let localNodes: unknown[] = [];
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
        afterLocalNodesStart: (nodeContext: { localNodes: unknown[] }) => {
          localNodes = nodeContext.localNodes;
        },
        testSpecificMock: (mockServer: Mockttp) =>
          mockBtcSendLocalMocks(mockServer, localNodes),
      },
      async ({ driver }) => {
        await login(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Bitcoin');
        // Refresh re-hydrates the UI from background state so the
        // asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        const sendPage = new SendPage(driver);
        await homePage.startSendFlow();
        await sendPage.selectToken(BITCOIN_CHAIN_ID, 'BTC');
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount('0.5');
        await sendPage.checkContinueButtonEnabled();
        await sendPage.pressContinueButton();

        const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
        await bitcoinReviewTxPage.checkPageIsLoaded();
        await bitcoinReviewTxPage.clickConfirmButton();

        // Wait for the transaction to appear in the activity list.
        // Note: the transaction shows as "Pending" immediately after
        // broadcast; the BTC snap stores it as "Unconfirmed".
        const activityTab = new ActivityTab(driver);
        await activityTab.checkTransactionActivityByText('Sending');
        await activityTab.checkWaitForTransactionStatus('pending');
      },
    );
  });
});
