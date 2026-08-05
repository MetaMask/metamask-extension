/**
 * Regression coverage for MetaMask-planning#7523: concurrent trace() calls
 * can corrupt each other's Sentry async-context state in the service
 * worker, because @sentry/browser has no async-context strategy other than
 * a single, shared, mutable stack per JS realm (no AsyncLocalStorage/Zone
 * equivalent exists in a browser/service-worker environment -- see
 * node_modules/@sentry/core/.../asyncContext/stackStrategy.js).
 *
 * This file specifically covers getCurrentTraceId()'s effect on the
 * `consensys-request-id` correlation: when an operation's own outbound
 * fetch runs while a logically unrelated, concurrently-pending operation's
 * span is still on top of the shared stack, the outbound request gets
 * correlated with the WRONG operation's trace id. See
 * shared/lib/trace.test.ts's "concurrent trace() calls" describe block for
 * the sibling span-parenting defect (same root cause, different symptom).
 *
 * Kept in a separate file from sentry-trace-propagation.test.ts rather than
 * added as a new describe block there: that file does a file-wide
 * `jest.mock('@sentry/browser')` / `jest.mock('@sentry/core')` (both fully
 * mocked, hoisted for the whole file), which is incompatible with what
 * these tests need -- the REAL SDK end-to-end (a real BrowserClient, the
 * real AsyncContextStack, the real fetch instrumentation). The module under
 * test (sentry-trace-propagation.ts) binds its `getActiveSpan` /
 * `getCurrentScope` / `getIsolationScope` imports at its own first load, so
 * partially un-mocking `@sentry/browser` within that file wouldn't change
 * what the module itself sees.
 */
import * as Sentry from '@sentry/browser';
import type { Client } from '@sentry/core';
import { trace, TraceName } from '../../../shared/lib/trace';
import { consensysTracePropagationIntegration } from './sentry-trace-propagation';

const BACKEND_URL = 'https://accounts.api.cx.metamask.io/v1/accounts';

// Genuinely distinct, fixed, valid-format (32-hex / 16-hex) distributed
// trace ids for two unrelated logical operations. Using explicit distinct
// ids (rather than letting both operations fall back to whatever ambient
// trace id the SDK assigns a plain root span) rules out a separate,
// already-tracked, non-buggy SDK behavior: root spans with no explicit
// parent share one ambient/baseline trace id for the life of the JS realm
// in the browser's stack-based async-context strategy (the "mega-trace"
// behavior targeted by parent epic MetaMask-planning#7354). That baseline
// sharing happens with or without interleaving, so it cannot by itself
// demonstrate a concurrency-specific defect. Two explicit, distinct ids
// (the same shape real cross-boundary UI->background RPC calls carry via
// shared/lib/trace.ts's hasDistributedTraceIds/sentryContinueTrace path)
// remove that confound: any cross-correlation observed below can only come
// from the shared, interleaving-sensitive AsyncContextStack.
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

  // @sentry/core's fetch instrumentation (instrument/fetch.js) marks
  // 'fetch' as instrumented process-wide the first time
  // addFetchInstrumentationHandler runs, and does not re-wrap on
  // subsequent calls -- and that registration is additive, not idempotent,
  // so calling it once per test accumulates N handlers on the same 'fetch'
  // event, each minting its own request id and racing to record it, which
  // the module's own dedup logic (correctly) treats as ambiguous and
  // suppresses. So `global.fetch` and the integration are both installed
  // exactly once, here, for the whole file; each test only swaps out what
  // the stable delegate forwards to.
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
    return (processed as { tags?: Record<string, unknown> } | undefined)
      ?.tags?.consensysRequestId;
  }

  describe('when no trace() is in flight', () => {
    it('attaches a consensys-request-id to an untraced outbound request', async () => {
      await fetch(BACKEND_URL);

      expect(capturedBaggage()).toContain('consensys-request-id=');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('when a second, unrelated trace() call is still pending', () => {
    // Bug confirmed via this harness; not yet fixed -- see
    // MetaMask-planning#7523. Skipped (rather than left red) so CI doesn't
    // fail with no explanation. Remove `.skip` to see it fail today: A's own
    // outbound request correlates with B's trace id (or with neither),
    // instead of with A's own. Once a fix lands, remove `.skip` -- if it's
    // still red at that point, the fix is incomplete.
    it.skip(
      'correlates an operation’s own outbound request with its own trace id, not a concurrently-pending unrelated operation’s',
      async () => {
        const aGate = deferred<void>();
        const bGate = deferred<void>();
        let fetchResponse: Response | undefined;

        // Operation A: continues a distributed trace with an explicit,
        // fixed trace id (as real cross-boundary UI->background RPC calls
        // do). A pauses once, then -- after resuming -- makes its own
        // outbound backend fetch as part of its own logic.
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

        try {
          // Operation B: a logically unrelated concurrent operation
          // continuing a DIFFERENT, explicit distributed trace, started
          // and still pending while A is paused. B's stack layers push on
          // top of A's and stay there.
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

          bGate.resolve();
          await bPromise;
        } finally {
          await aPromise;
        }
      },
    );

    it('correlates correctly once the concurrent operation has already resolved (discriminating control)', async () => {
      // Structurally identical to the test above, except B fully resolves
      // (and its layers pop off the shared stack) BEFORE A resumes and
      // fetches. Same assertions, only the interleaving itself is removed
      // -- this is the control that shows the failure above is driven by
      // the overlap, not by something else in the harness.
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
