import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { getEventPayloads, withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { bridgeTransaction } from '../../page-objects/flows/bridge.flow';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';

const QUOTES_REQUESTED = 'Unified SwapBridge Quotes Requested';
const QUOTES_RECEIVED = 'Unified SwapBridge Quotes Received';
const SUBMITTED = 'Unified SwapBridge Submitted';
const COMPLETED = 'Unified SwapBridge Completed';

const EXPECTED_EVENT_SEQUENCE = [
  QUOTES_REQUESTED,
  QUOTES_RECEIVED,
  SUBMITTED,
  COMPLETED,
];

describe('Swap metrics', function (this: Suite) {
  this.timeout(160000);

  it('emits the swap lifecycle events for a swap between ETH and mUSD', async function () {
    await withFixtures(
      getBridgeFixtures({
        title: this.test?.fullTitle(),
        featureFlags: {
          ...BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
          refreshRate: 30000,
        },
      }),
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver, { expectedBalance: '$225,730.11' });

        await bridgeTransaction({
          driver,
          quote: { amount: '1' },
          expectedTransactionsCount: 1,
          expectedSwapTokens: { tokenFrom: 'ETH', tokenTo: 'MUSD' },
          // Wait for the whole quote stream so the best quote is the one submitted
          submitDelay: 10000,
          expectedDestAmount: '3,839',
          expectedDetailsDestAmount: '3,839.4478',
          expectedActivityAmount: '+3,839.4478',
        });

        const swapEvents = (
          await getEventPayloads(driver, mockedEndpoints)
        ).filter((payload) => payload?.event?.startsWith('Unified SwapBridge'));

        const emittedAt = EXPECTED_EVENT_SEQUENCE.map((name) =>
          swapEvents.findIndex(
            ({ event }: { event: string }) => event === name,
          ),
        );
        EXPECTED_EVENT_SEQUENCE.forEach((name, index) => {
          assert.notEqual(emittedAt[index], -1, `${name} was not emitted`);
          if (index > 0) {
            assert.ok(
              emittedAt[index] > emittedAt[index - 1],
              `${name} was emitted before ${EXPECTED_EVENT_SEQUENCE[index - 1]}`,
            );
          }
        });

        const [quotesRequested, quotesReceived, submitted, completed] =
          emittedAt.map((position) => swapEvents[position].properties);

        assert.equal(quotesRequested.swap_type, 'single_chain');
        assert.equal(quotesRequested.chain_id_source, 'eip155:1');
        assert.equal(quotesRequested.chain_id_destination, 'eip155:1');

        assert.equal(quotesReceived.quotes_count, 4);
        assert.equal(quotesReceived.provider, '1inch_1inch');

        [submitted, completed].forEach((properties) => {
          assert.equal(properties.category, 'Unified SwapBridge');
          assert.equal(properties.action_type, 'swapbridge-v1');
          assert.equal(properties.token_symbol_source, 'ETH');
          assert.equal(properties.token_symbol_destination, 'MUSD');
        });
      },
    );
  });
});
