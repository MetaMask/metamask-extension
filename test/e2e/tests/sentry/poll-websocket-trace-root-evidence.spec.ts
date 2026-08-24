import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { BRIDGE_FEATURE_FLAGS_WITH_SSE_ENABLED } from '../bridge/constants';
import { getBridgeFixtures } from '../bridge/bridge-test-utils';
import { mockIdentityServices } from '../identity/mocks';

// Literals for TraceName.BackgroundPoll and the core-backend websocket
// connection trace — the ops this PR roots via `traceBackgroundPoll` /
// `rootTrace`.
const BACKGROUND_POLL = 'Background Poll';
const WEBSOCKET_CONNECTION = 'BackendWebSocketService Connection';

type CapturedTxn = {
  transaction: string;
  traceId: string;
  tags?: Record<string, unknown>;
};

const captured: CapturedTxn[] = [];

/**
 * Extract `{ transaction, trace_id, tags }` from a Sentry envelope body
 * (newline-delimited JSON; transaction payloads carry
 * `contexts.trace.trace_id`).
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
      out.push({
        transaction,
        traceId,
        tags: obj.tags as Record<string, unknown> | undefined,
      });
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
            `CAPTURED-TXN ${txn.traceId} ${JSON.stringify(txn.transaction)} tags=${JSON.stringify(txn.tags ?? {})}`,
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

describe('Sentry poll/websocket trace-root evidence (#43930)', function (this: Suite) {
  it('roots each background poll cycle in its own trace id during bridge quote rounds', async function () {
    // Local evidence-capture harness, not a CI regression test: the bridge
    // quote flow's interactive timing is not reliably reachable on CI
    // runners, and the regression falsifiers for this PR live in the unit
    // suites (`shared/lib/trace.test.ts`, `bridge-controller-init.test.ts`,
    // `bridge-status-controller-init.test.ts`). Run locally per the PR's
    // Validation Run instructions to reproduce the captured evidence log.
    if (process.env.CI) {
      this.skip();
    }
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

      // Rounds 2-3: edit the amount so `BridgeController._executePoll`
      // schedules a fresh poll cycle each time.
      for (const amount of ['10', '5']) {
        await driver.delay(2000);
        await bridgePage.enterBridgeQuote({ amount });
        await bridgePage.waitForQuote();
      }

      // Let the background flush transaction envelopes.
      await driver.delay(15000);

      const pollCycles = captured.filter(
        (t) => t.transaction === BACKGROUND_POLL,
      );
      const distinct = [...new Set(pollCycles.map((t) => t.traceId))];
      const swIds = new Set(
        captured
          .filter((t) => t.transaction === '/service-worker.js')
          .map((t) => t.traceId),
      );
      const sharingSw = pollCycles.filter((t) => swIds.has(t.traceId)).length;
      const controllers = [
        ...new Set(pollCycles.map((t) => t.tags?.controller)),
      ];

      // eslint-disable-next-line no-console
      console.log(
        `EVIDENCE captured=${captured.length} pollCycles=${pollCycles.length} distinctTraceIds=${distinct.length} sharingSwPageload=${sharingSw} controllers=${JSON.stringify(controllers)}`,
      );
      // eslint-disable-next-line no-console
      console.log(`EVIDENCE-POLL-CYCLES ${JSON.stringify(pollCycles)}`);
      // eslint-disable-next-line no-console
      console.log(`EVIDENCE-SW-IDS ${JSON.stringify([...swIds])}`);
      // eslint-disable-next-line no-console
      console.log(`EVIDENCE-ALL ${JSON.stringify(captured)}`);

      // The PR's claim: `traceBackgroundPoll` roots EVERY scheduled poll
      // cycle (`Background Poll`, op `background.poll`, tagged with the
      // controller) in its own trace id instead of accumulating into the SW
      // `/service-worker.js` pageload mega-trace. Assert full pairwise
      // distinctness — ids X, X, Y must fail — and that no cycle sits on
      // the SW pageload trace.
      assert.ok(
        pollCycles.length >= 2,
        `expected at least 2 background poll cycles to compare trace ids, got ${pollCycles.length}: ${JSON.stringify(captured)}`,
      );
      assert.equal(
        distinct.length,
        pollCycles.length,
        `expected one distinct trace id per background poll cycle, got ${distinct.length} distinct across ${pollCycles.length} cycles: ${JSON.stringify(pollCycles)}`,
      );
      assert.equal(
        sharingSw,
        0,
        `expected no background poll cycle on the /service-worker.js pageload trace, got ${sharingSw}`,
      );
    });
  });

  it('roots the websocket connection trace off the service-worker pageload trace', async function () {
    // Local evidence-capture harness, not a CI regression test (see above);
    // the websocket falsifier lives in
    // `backend-websocket-service-init.test.ts`.
    if (process.env.CI) {
      this.skip();
    }
    this.timeout(300000);
    captured.length = 0;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .withRemoteFeatureFlagController({
            remoteFeatureFlags: {
              backendWebSocketConnection: { value: true },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (server: Mockttp) => {
          await mockIdentityServices(server);
          return captureSentryTransactions(server);
        },
        manifestFlags: { sentry: { forceEnable: true, tracesSampleRate: 1 } },
        driverOptions: { timeOut: 120000 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ driver }: any) => {
        await login(driver);

        // BackendWebSocketService connects post-unlock once the feature flag
        // and identity sign-in are satisfied; a failed/timed-out connection
        // attempt still ends the `BackendWebSocketService Connection` root
        // trace. Wait through the connect (and possible timeout) window.
        await driver.delay(60000);

        const wsConnections = captured.filter(
          (t) => t.transaction === WEBSOCKET_CONNECTION,
        );
        const swIds = new Set(
          captured
            .filter((t) => t.transaction === '/service-worker.js')
            .map((t) => t.traceId),
        );
        const sharingSw = wsConnections.filter((t) =>
          swIds.has(t.traceId),
        ).length;

        // eslint-disable-next-line no-console
        console.log(
          `EVIDENCE captured=${captured.length} wsConnections=${wsConnections.length} sharingSwPageload=${sharingSw}`,
        );
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-WS ${JSON.stringify(wsConnections)}`);
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-SW-IDS ${JSON.stringify([...swIds])}`);
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-ALL ${JSON.stringify(captured)}`);

        // The PR's claim: the websocket connection trace is rooted via
        // `rootTrace` so it does NOT sit on the SW pageload trace.
        assert.ok(
          wsConnections.length >= 1,
          `expected at least 1 websocket connection trace, got 0: ${JSON.stringify(captured)}`,
        );
        assert.equal(
          sharingSw,
          0,
          `expected no websocket connection trace on the /service-worker.js pageload trace, got ${sharingSw}`,
        );
      },
    );
  });
});
