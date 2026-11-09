import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';

type CapturedTxn = {
  transaction: string;
  traceId: string;
  parentSpanId?: string;
};

const captured: CapturedTxn[] = [];

/**
 * Extract `transaction` and `contexts.trace.trace_id` / `parent_span_id` from
 * each envelope line.
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
    const parentSpanId = trace?.parent_span_id;
    if (typeof transaction === 'string' && typeof traceId === 'string') {
      out.push({
        transaction,
        traceId,
        ...(typeof parentSpanId === 'string' && { parentSpanId }),
      });
    }
  }
  return out;
}

async function captureSentryTransactions(mockServer: MockttpServer) {
  return [
    // `always()`: the harness also mocks the fake-DSN envelope URL, and mockttp
    // hands every request after the first to that later rule otherwise.
    await mockServer
      .forPost(/sentry/u)
      .always()
      .thenCallback(async (request) => {
        try {
          const body = await request.body.getText();
          for (const txn of parseTransactions(body ?? '')) {
            captured.push(txn);
            console.log(
              `CAPTURED-TXN ${txn.traceId} ${JSON.stringify(txn.transaction)}`,
            );
          }
        } catch (error) {
          console.log('CAPTURE-ERR', String(error));
        }
        return { statusCode: 200, json: {} };
      }),
  ];
}

// Roots only: a call carrying UI trace context continues the UI's trace, so it
// has a parent span and shares that trace id by design.
const backgroundRpcRoots = () =>
  captured.filter(
    (t) => t.transaction.startsWith('Background RPC') && !t.parentSpanId,
  );

describe('Sentry trace-level evidence (#43931 per-op roots)', function () {
  it('roots each background RPC op in its own trace id', async function () {
    // Evidence capture, not a regression test: which background RPC calls run
    // after login, and when their envelopes flush, varies on CI runners, so CI
    // skips it.
    if (process.env.CI) {
      this.skip();
    }
    this.timeout(300000);
    captured.length = 0;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withAnalyticsController({
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: captureSentryTransactions,
        manifestFlags: {
          sentry: { forceEnable: true, tracesSampleRate: 1 },
          // Root every dispatch, so the run never depends on the 0.5% default.
          remoteFeatureFlags: { sentry: { wrapperSampleRate: 1 } },
        },
        driverOptions: { timeOut: 120000 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ driver }: any) => {
        await login(driver);
        await driver.waitUntil(async () => backgroundRpcRoots().length >= 2, {
          interval: 500,
          timeout: 60000,
        });

        const bgRpc = backgroundRpcRoots();
        const distinct = [...new Set(bgRpc.map((t) => t.traceId))];
        const swIds = new Set(
          captured
            .filter((t) => t.transaction === '/service-worker.js')
            .map((t) => t.traceId),
        );
        const sharingSw = bgRpc.filter((t) => swIds.has(t.traceId)).length;

        console.log(
          `EVIDENCE captured=${captured.length} bgRpc=${bgRpc.length} distinctTraceIds=${distinct.length} sharingSwPageload=${sharingSw}`,
        );
        console.log(`EVIDENCE-BGRPC ${JSON.stringify(bgRpc)}`);
        console.log(`EVIDENCE-SW-IDS ${JSON.stringify([...swIds])}`);

        // One trace id per op, none shared with the `/service-worker.js` trace.
        assert.equal(
          distinct.length,
          bgRpc.length,
          `expected one distinct trace id per background RPC op, got ${distinct.length} distinct across ${bgRpc.length} ops: ${JSON.stringify(bgRpc)}`,
        );
        assert.equal(
          sharingSw,
          0,
          `expected no background RPC op on the /service-worker.js pageload trace, got ${sharingSw}`,
        );
      },
    );
  });
});
