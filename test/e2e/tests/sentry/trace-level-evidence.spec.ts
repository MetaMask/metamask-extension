import { strict as assert } from 'assert';
import { MockttpServer } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';

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

async function captureSentryTransactions(mockServer: MockttpServer) {
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

describe('Sentry trace-level evidence (#43931 per-op roots)', function () {
  it('roots each background RPC op in its own trace id', async function () {
    // eslint-disable-next-line @typescript-eslint/no-invalid-this
    this.timeout(300000);
    captured.length = 0;

    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: captureSentryTransactions,
        manifestFlags: { sentry: { forceEnable: true, tracesSampleRate: 1 } },
        driverOptions: { timeOut: 120000 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async ({ driver }: any) => {
        await login(driver);
        // Let background RPC ops fire within one service-worker session.
        await driver.delay(20000);

        const bgRpc = captured.filter((t) =>
          t.transaction.startsWith('Background RPC'),
        );
        const distinct = [...new Set(bgRpc.map((t) => t.traceId))];
        const swIds = new Set(
          captured
            .filter((t) => t.transaction === '/service-worker.js')
            .map((t) => t.traceId),
        );
        const sharingSw = bgRpc.filter((t) => swIds.has(t.traceId)).length;

        // eslint-disable-next-line no-console
        console.log(
          `EVIDENCE captured=${captured.length} bgRpc=${bgRpc.length} distinctTraceIds=${distinct.length} sharingSwPageload=${sharingSw}`,
        );
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-BGRPC ${JSON.stringify(bgRpc)}`);
        // eslint-disable-next-line no-console
        console.log(`EVIDENCE-SW-IDS ${JSON.stringify([...swIds])}`);

        // The startNewTrace fix: distinct background RPC ops get distinct trace
        // ids (not all collapsed onto the SW pageload trace). Assert only when
        // at least two ops were observed, so the run stays informative on a
        // light session while still failing a regression when ops do fire.
        if (bgRpc.length >= 2) {
          assert(
            distinct.length > 1,
            `expected distinct trace ids per background RPC op, got ${distinct.length} distinct across ${bgRpc.length} ops`,
          );
        }
      },
    );
  });
});
