import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';

type CapturedTxn = { transaction: string; traceId: string };

const captured: CapturedTxn[] = [];

/**
 * Extract `{ transaction, trace_id }` from a Sentry envelope body (newline-
 * delimited JSON; transaction payloads carry `contexts.trace.trace_id`).
 *
 * @param body - Raw envelope POST body.
 */
function parseTransactions(body: string): CapturedTxn[] {
  const out: CapturedTxn[] = [];
  for (const line of body.split('\n')) {
    if (!line.trim()) {
      continue;
    }
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    const transaction = obj.transaction as string | undefined;
    const trace = (obj.contexts as { trace?: Record<string, unknown> })?.trace;
    const traceId = trace?.trace_id;
    if (typeof transaction === 'string' && typeof traceId === 'string') {
      out.push({ transaction, traceId });
    }
  }
  return out;
}

async function captureSentryTransactions(mockServer: Mockttp) {
  return [
    await mockServer.forPost(/sentry/u).thenCallback(async (request) => {
      try {
        const body = await request.body.getText();
        for (const txn of parseTransactions(body ?? '')) {
          captured.push(txn);
          // eslint-disable-next-line no-console
          console.log(
            `CAPTURED-TXN ${txn.traceId} ${JSON.stringify(txn.transaction)}`,
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('CAPTURE-ERR', String(error));
      }
      return { statusCode: 200, json: {} };
    }),
  ];
}

describe('Bridge quote-fetch trace-root evidence (#43928)', function (this: Suite) {
  it('roots each quote-fetch round in its own trace id (PR manual-testing steps 2-3)', async function () {
    this.timeout(300000);
    captured.length = 0;

    const base = getBridgeFixtures({
      title: this.test?.fullTitle(),
      featureFlags: BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED,
    }) as Record<string, unknown>;

    const baseMock = base.testSpecificMock as (s: Mockttp) => Promise<unknown>;
    base.testSpecificMock = async (server: Mockttp) => {
      const result = await baseMock(server);
      await captureSentryTransactions(server);
      return result;
    };
    const mf = (base.manifestFlags ?? {}) as Record<string, unknown>;
    base.manifestFlags = {
      ...mf,
      sentry: { forceEnable: true, tracesSampleRate: 1 },
    };

    await withFixtures(base, async ({ driver }) => {
      await login(driver, { expectedBalance: '$225,730.11' });

      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.startSwapFlow();

      const bridgePage = new BridgeQuotePage(driver);
      await bridgePage.checkAssetsAreSelected('ETH', 'mUSD');

      // Round 1: DAI (Ethereum) -> ETH (Linea), amount 25.
      await bridgePage.enterBridgeQuote({
        amount: '25',
        tokenFrom: 'DAI',
        tokenTo: 'ETH',
        fromChain: 'Ethereum',
        toChain: 'Linea',
      });
      await bridgePage.waitForQuote();

      // Rounds 2-3: edit the amount so a fresh `* Quotes Fetched`
      // operation fires each time (PR manual-testing step 2).
      for (const amount of ['10', '5']) {
        await driver.delay(2000);
        await bridgePage.enterBridgeQuote({ amount });
        await bridgePage.waitForQuote();
      }

      // Let the background flush transaction envelopes.
      await driver.delay(15000);

      const quoteRounds = captured.filter((t) =>
        t.transaction.endsWith('Quotes Fetched'),
      );
      const distinct = [...new Set(quoteRounds.map((t) => t.traceId))];
      const swIds = new Set(
        captured
          .filter((t) => t.transaction === '/service-worker.js')
          .map((t) => t.traceId),
      );
      const sharingSw = quoteRounds.filter((t) => swIds.has(t.traceId)).length;
      const nonQuoteBridge = captured.filter(
        (t) =>
          t.transaction.startsWith('Bridge') &&
          !t.transaction.endsWith('Quotes Fetched'),
      );

      // eslint-disable-next-line no-console
      console.log(
        `EVIDENCE captured=${captured.length} quoteRounds=${quoteRounds.length} distinctTraceIds=${distinct.length} sharingSwPageload=${sharingSw}`,
      );
      // eslint-disable-next-line no-console
      console.log(`EVIDENCE-QUOTE-ROUNDS ${JSON.stringify(quoteRounds)}`);
      // eslint-disable-next-line no-console
      console.log(`EVIDENCE-SW-IDS ${JSON.stringify([...swIds])}`);
      // eslint-disable-next-line no-console
      console.log(`EVIDENCE-NON-QUOTE ${JSON.stringify(nonQuoteBridge)}`);

      // The PR's claim (manual-testing step 3): each `* Quotes Fetched`
      // round is its OWN trace (distinct trace_id) instead of all rounds
      // sharing one. Assert full pairwise distinctness — ids X, X, Y must
      // fail — and that no round sits on the SW pageload trace.
      assert.ok(
        quoteRounds.length >= 2,
        `expected at least 2 quote-fetch rounds to compare trace ids, got ${quoteRounds.length}: ${JSON.stringify(captured)}`,
      );
      assert.equal(
        distinct.length,
        quoteRounds.length,
        `expected one distinct trace id per quote-fetch round, got ${distinct.length} distinct across ${quoteRounds.length} rounds: ${JSON.stringify(quoteRounds)}`,
      );
      assert.equal(
        sharingSw,
        0,
        `expected no quote-fetch round on the /service-worker.js pageload trace, got ${sharingSw}`,
      );
    });
  });
});
