// Real-SDK tests for request-id correlation under overlapping trace() calls,
// kept apart from sentry-trace-propagation.test.ts, which mocks Sentry.
import * as Sentry from '@sentry/browser';
import type { Client } from '@sentry/core';
import { it } from '@jest/globals';
import { trace, TraceName } from '../../../shared/lib/trace';
import {
  consensysTracePropagationIntegration,
  resetConsensysRequestIdProvider,
} from './sentry-trace-propagation';

const BACKEND_URL = 'https://accounts.api.cx.metamask.io/v1/accounts';

// Distinct explicit trace ids: root spans share one ambient trace id with or
// without overlap, so only distinct ids isolate the overlap's effect.
const TRACE_ID_A = 'a'.repeat(32);
const SPAN_ID_A = 'a'.repeat(16);
const TRACE_ID_B = 'b'.repeat(32);
const SPAN_ID_B = 'b'.repeat(16);

function deferred<Value = void>() {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function tick(times = 1) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

function initRealSentryClient(): void {
  const client = new Sentry.BrowserClient({
    dsn: 'https://public@example.ingest.sentry.io/1',
    transport: () => ({
      send: () => Promise.resolve({}),
      flush: () => Promise.resolve(true),
    }),
    stackParser: Sentry.defaultStackParser,
    integrations: [],
    tracesSampleRate: 1,
  });
  Sentry.getCurrentScope().setClient(client);
  client.init();
}

describe('getCurrentTraceId() under concurrent trace() calls (MetaMask-planning#7523)', () => {
  let fetchMock: jest.Mock;

  // Each integration setup adds a fetch handler, and competing handlers
  // suppress the request id, so install once per file; tests swap `fetchMock`.
  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = (...args: unknown[]) => fetchMock(...args);

    const integration = consensysTracePropagationIntegration({
      log: () => {
        // Intentionally empty.
      },
    });
    integration.afterAllSetup?.(
      undefined as unknown as Parameters<
        NonNullable<typeof integration.afterAllSetup>
      >[0],
    );
  });

  beforeEach(() => {
    initRealSentryClient();
    globalThis.sentry = { ...Sentry } as typeof globalThis.sentry;
    fetchMock = jest
      .fn()
      .mockResolvedValue(new Response('{}', { status: 200 }));
  });

  afterEach(() => {
    Sentry.getCurrentScope().clear();
    // Request-id state persists across tests; the control must start clean.
    resetConsensysRequestIdProvider();
  });

  function capturedBaggage(callIndex = 0): string | undefined {
    const [, init] = fetchMock.mock.calls[callIndex] as [
      unknown,
      { headers?: Headers },
    ];
    return init?.headers?.get('baggage') ?? undefined;
  }

  function requestIdFromBaggage(baggage: string | undefined): string {
    const match = baggage?.match(/consensys-request-id=([^,]+)/u);
    expect(match).toBeTruthy();
    return match?.[1] as string;
  }

  function correlatedRequestId(traceId: string): unknown {
    const integration = consensysTracePropagationIntegration({
      log: () => {
        // Intentionally empty.
      },
    });
    const fakeEvent = {
      // trace_id matches Sentry's own event.contexts.trace shape.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      contexts: { trace: { trace_id: traceId } },
    } as unknown as Sentry.Event;
    const processed = integration.processEvent?.(
      fakeEvent,
      {},
      Sentry.getClient() as unknown as Client,
    );
    return (processed as { tags?: Record<string, unknown> } | undefined)?.tags
      ?.consensysRequestId;
  }

  describe('when no trace() is in flight', () => {
    it('attaches a consensys-request-id to an untraced outbound request', async () => {
      await fetch(BACKEND_URL);

      expect(capturedBaggage()).toContain('consensys-request-id=');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a second, unrelated trace() call is still pending', () => {
    // The assertions fail until overlapping calls are isolated; then use `it`.
    it.failing(
      'correlates an operation’s own outbound request with its own trace id, not a concurrently-pending unrelated operation’s',
      async () => {
        const aGate = deferred<void>();
        const bGate = deferred<void>();
        let fetchResponse: Response | undefined;

        // A continues its own distributed trace, pauses, then fetches.
        const aPromise = trace(
          {
            name: TraceName.Transaction,
            id: 'A-distributed',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            parentContext: { _traceId: TRACE_ID_A, _spanId: SPAN_ID_A },
          },
          async () => {
            await aGate.promise; // A's pending window.
            fetchResponse = await fetch(BACKEND_URL);
            return fetchResponse;
          },
        );

        await tick(2);

        // B continues another trace and stays pending above A on the stack.
        const bPromise = trace(
          {
            name: TraceName.Transaction,
            id: 'B-distributed-concurrent',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            parentContext: { _traceId: TRACE_ID_B, _spanId: SPAN_ID_B },
          },
          async () => {
            await bGate.promise;
          },
        );
        try {
          await tick(2);

          // Resolve only A's gate. B is still pending (its layers are
          // still on top of the shared stack) when A's continuation runs
          // its own fetch() call.
          aGate.resolve();
          await tick(10);
          expect(fetchResponse).toBeDefined();

          const requestId = requestIdFromBaggage(capturedBaggage());

          expect(correlatedRequestId(TRACE_ID_A)).toBe(requestId);
          expect(correlatedRequestId(TRACE_ID_B)).not.toBe(requestId);
        } finally {
          // The assertions throw under `it.failing`, so settle B here or its
          // layers stay on the stack for the next test.
          bGate.resolve();
          await bPromise;
          await aPromise;
        }
      },
    );

    it('correlates correctly once the concurrent operation has already resolved (discriminating control)', async () => {
      // Same as above except B resolves before A resumes, so only the overlap
      // differs.
      const aGate = deferred<void>();
      const bGate = deferred<void>();
      let fetchResponse: Response | undefined;

      const aPromise = trace(
        {
          name: TraceName.Transaction,
          id: 'A-distributed-2',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          parentContext: { _traceId: TRACE_ID_A, _spanId: SPAN_ID_A },
        },
        async () => {
          await aGate.promise;
          fetchResponse = await fetch(BACKEND_URL);
          return fetchResponse;
        },
      );

      await tick(2);

      const bPromise = trace(
        {
          name: TraceName.Transaction,
          id: 'B-distributed-2',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          parentContext: { _traceId: TRACE_ID_B, _spanId: SPAN_ID_B },
        },
        async () => {
          await bGate.promise;
        },
      );

      await tick(2);

      bGate.resolve();
      await bPromise;

      aGate.resolve();
      await tick(10);
      expect(fetchResponse).toBeDefined();

      const requestId = requestIdFromBaggage(capturedBaggage());

      expect(correlatedRequestId(TRACE_ID_A)).toBe(requestId);
      expect(correlatedRequestId(TRACE_ID_B)).not.toBe(requestId);

      await aPromise;
    });
  });
});
