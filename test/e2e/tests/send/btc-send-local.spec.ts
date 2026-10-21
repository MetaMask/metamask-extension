import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import {
  confirmBitcoinSendAndAssertPending,
  landOnBitcoinSendScreen,
  waitForBitcoinSendConfirmation,
} from '../../page-objects/flows/bitcoin-send.flow';
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

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
const SEND_AMOUNT = '0.5';

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
    ...(await mockTokensV2SupportedNetworks(mockServer)),
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
        const expectedAmount = `-${SEND_AMOUNT} BTC`;
        const bitcoinNode = localNodes.find(
          (node): node is BitcoinNode => node instanceof BitcoinNode,
        );
        if (!bitcoinNode) {
          throw new Error('Bitcoin local node was not started');
        }

        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const activityTab = await confirmBitcoinSendAndAssertPending({
          driver,
          expectedAmount,
        });
        await bitcoinNode.mineBlocks();
        await waitForBitcoinSendConfirmation({
          activityTab,
          expectedAmount,
        });
      },
    );
  });
});
