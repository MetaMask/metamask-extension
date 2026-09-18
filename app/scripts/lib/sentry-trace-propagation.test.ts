import type { Client, Event as SentryEvent, EventHint } from '@sentry/core';
import {
  getActiveSpan,
  getCurrentScope,
  getIsolationScope,
} from '@sentry/browser';
import { addFetchInstrumentationHandler } from '@sentry/core';
import {
  buildAugmentedHeaders,
  buildConsensysBaggage,
  consensysTracePropagationIntegration,
  getCurrentConsensysRequestId,
  matchesBackendTarget,
  resetConsensysRequestIdProvider,
  setConsensysRequestIdProvider,
  stripTraceHeaders,
} from './sentry-trace-propagation';

jest.mock('@sentry/core', () => ({
  addFetchInstrumentationHandler: jest.fn(),
}));

jest.mock('@sentry/browser', () => ({
  getActiveSpan: jest.fn(),
  getCurrentScope: jest.fn(),
  getIsolationScope: jest.fn(),
}));

jest.mock('uuid', () => ({ v4: jest.fn(() => 'uuid-fixed') }));

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba902b7';
const TRACEPARENT = `00-${TRACE_ID}-${SPAN_ID}-01`;
const BACKEND_URL = 'https://accounts.api.cx.metamask.io/v1/accounts';
const CONSENSYS_BAGGAGE = `consensys-request-id=uuid-fixed,consensys-application=metamask-extension`;
// What the SDK's fetch instrumentation attaches to a `tracePropagationTargets`
// match while no span is active: the ids come from the scope propagation
// context, so the advertised parent belongs to no span.
const SDK_SENTRY_TRACE_NO_SPAN = `${TRACE_ID}-${SPAN_ID}-0`;
const SDK_TRACEPARENT_NO_SPAN = `00-${TRACE_ID}-${SPAN_ID}-00`;
const SDK_BAGGAGE_NO_SPAN = `sentry-trace_id=${TRACE_ID},sentry-sample_rate=0.005`;

const getActiveSpanMock = jest.mocked(getActiveSpan);
const getCurrentScopeMock = jest.mocked(getCurrentScope);
const getIsolationScopeMock = jest.mocked(getIsolationScope);
const addFetchInstrumentationHandlerMock = jest.mocked(
  addFetchInstrumentationHandler,
);

const emptyPropagationScope = {
  getPropagationContext: () => ({}),
} as unknown as ReturnType<typeof getCurrentScope>;

function mockActiveSpan() {
  getActiveSpanMock.mockReturnValue({
    spanContext: () => ({ traceId: TRACE_ID, spanId: SPAN_ID, traceFlags: 1 }),
  } as unknown as ReturnType<typeof getActiveSpan>);
}

beforeEach(() => {
  jest.clearAllMocks();
  resetConsensysRequestIdProvider();
  getActiveSpanMock.mockReturnValue(undefined);
  getCurrentScopeMock.mockReturnValue(emptyPropagationScope);
  getIsolationScopeMock.mockReturnValue(emptyPropagationScope);
});

describe('matchesBackendTarget', () => {
  it('matches subdomains of api.cx.metamask.io', () => {
    expect(matchesBackendTarget(BACKEND_URL)).toBe(true);
    expect(
      matchesBackendTarget('https://bridge.api.cx.metamask.io/getQuote'),
    ).toBe(true);
  });

  it('rejects unrelated and look-alike hosts', () => {
    expect(matchesBackendTarget('https://example.com/x')).toBe(false);
    expect(matchesBackendTarget('https://api.cx.metamask.io.evil.com/x')).toBe(
      false,
    );
    expect(matchesBackendTarget('http://accounts.api.cx.metamask.io/x')).toBe(
      false,
    );
  });
});

describe('buildConsensysBaggage', () => {
  it('formats the Consensys baggage segment', () => {
    expect(buildConsensysBaggage('abc')).toBe(
      'consensys-request-id=abc,consensys-application=metamask-extension',
    );
  });
});

describe('buildAugmentedHeaders', () => {
  it('appends baggage to a plain-object header init, preserving SDK headers', () => {
    const args = [
      BACKEND_URL,
      {
        headers: {
          'sentry-trace': `${TRACE_ID}-${SPAN_ID}-1`,
          traceparent: TRACEPARENT,
          baggage: 'sentry-environment=dev',
        },
      },
    ];

    const headers = buildAugmentedHeaders(args, { requestId: 'uuid-fixed' });

    // The SDK-injected `sentry-trace` / `traceparent` are seeded through, not removed.
    expect(headers.get('sentry-trace')).toBe(`${TRACE_ID}-${SPAN_ID}-1`);
    expect(headers.get('traceparent')).toBe(TRACEPARENT);
    const baggage = headers.get('baggage');
    expect(baggage).toContain('sentry-environment=dev');
    expect(baggage).toContain(CONSENSYS_BAGGAGE);
  });

  it('augments an existing Headers instance', () => {
    const existing = new Headers({ baggage: 'sentry-environment=dev' });
    const headers = buildAugmentedHeaders(
      [BACKEND_URL, { headers: existing }],
      {
        requestId: 'uuid-fixed',
      },
    );

    expect(headers.get('baggage')).toContain(CONSENSYS_BAGGAGE);
    expect(headers.get('baggage')).toContain('sentry-environment=dev');
  });

  it('augments an array-of-pairs header init', () => {
    const headers = buildAugmentedHeaders(
      [BACKEND_URL, { headers: [['x-test', '1']] }],
      { requestId: 'uuid-fixed' },
    );

    expect(headers.get('x-test')).toBe('1');
    expect(headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
  });

  it('seeds from a Request when no init headers are present', () => {
    const request = new Request(BACKEND_URL, {
      headers: { 'x-from-request': 'yes' },
    });
    const headers = buildAugmentedHeaders([request], {
      requestId: 'uuid-fixed',
    });

    expect(headers.get('x-from-request')).toBe('yes');
    expect(headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
  });

  it('preserves Request headers and lets init headers override duplicate keys', () => {
    const request = new Request(BACKEND_URL, {
      headers: { 'x-from-request': 'yes', 'x-override': 'from-request' },
    });
    const headers = buildAugmentedHeaders(
      [
        request,
        {
          headers: { 'x-from-init': 'init', 'x-override': 'from-init' },
        },
      ],
      { requestId: 'uuid-fixed' },
    );

    expect(headers.get('x-from-init')).toBe('init');
    expect(headers.get('x-from-request')).toBe('yes');
    expect(headers.get('x-override')).toBe('from-init');
    expect(headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
  });

  it('preserves an SDK-injected traceparent header through augmentation', () => {
    const headers = buildAugmentedHeaders(
      [BACKEND_URL, { headers: { traceparent: TRACEPARENT } }],
      { requestId: 'uuid-fixed' },
    );

    expect(headers.get('traceparent')).toBe(TRACEPARENT);
    expect(headers.get('baggage')).toContain(CONSENSYS_BAGGAGE);
  });

  it('does not inject a traceparent of its own', () => {
    const headers = buildAugmentedHeaders([BACKEND_URL], {
      requestId: 'uuid-fixed',
    });

    expect(headers.get('traceparent')).toBeNull();
    expect(headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
  });
});

describe('stripTraceHeaders', () => {
  it('removes sentry-trace, traceparent and the Sentry baggage entries', () => {
    const headers = stripTraceHeaders([
      BACKEND_URL,
      {
        headers: {
          'sentry-trace': SDK_SENTRY_TRACE_NO_SPAN,
          traceparent: SDK_TRACEPARENT_NO_SPAN,
          baggage: SDK_BAGGAGE_NO_SPAN,
          'x-caller': 'kept',
        },
      },
    ]) as Headers;

    expect(headers.get('sentry-trace')).toBeNull();
    expect(headers.get('traceparent')).toBeNull();
    expect(headers.get('baggage')).toBeNull();
    expect(headers.get('x-caller')).toBe('kept');
  });

  it('keeps non-Sentry baggage entries', () => {
    const headers = stripTraceHeaders([
      BACKEND_URL,
      {
        headers: {
          'sentry-trace': SDK_SENTRY_TRACE_NO_SPAN,
          baggage: `${SDK_BAGGAGE_NO_SPAN},vendor-key=vendor-value`,
        },
      },
    ]) as Headers;

    expect(headers.get('baggage')).toBe('vendor-key=vendor-value');
  });

  it('strips headers seeded from a Request', () => {
    const request = new Request(BACKEND_URL, {
      headers: {
        traceparent: SDK_TRACEPARENT_NO_SPAN,
        'x-from-request': 'yes',
      },
    });

    const headers = stripTraceHeaders([request]) as Headers;

    expect(headers.get('traceparent')).toBeNull();
    expect(headers.get('x-from-request')).toBe('yes');
  });

  it('returns undefined when the request carries no trace headers', () => {
    expect(
      stripTraceHeaders([BACKEND_URL, { headers: { 'x-caller': 'kept' } }]),
    ).toBeUndefined();
    expect(stripTraceHeaders([BACKEND_URL])).toBeUndefined();
  });
});

describe('consensysTracePropagationIntegration', () => {
  const log = jest.fn();

  function getFetchHandler() {
    const integration = consensysTracePropagationIntegration({ log });
    integration.afterAllSetup?.({} as Client);
    expect(addFetchInstrumentationHandlerMock).toHaveBeenCalledTimes(1);
    return addFetchInstrumentationHandlerMock.mock.calls[0][0];
  }

  it('appends baggage on a matched outbound request, leaving traceparent to the SDK', () => {
    mockActiveSpan();
    const handler = getFetchHandler();
    const handlerData = {
      fetchData: { url: BACKEND_URL, method: 'GET' },
      args: [BACKEND_URL, undefined],
    } as unknown as Parameters<typeof handler>[0];

    handler(handlerData);

    const init = handlerData.args[1] as { headers: Headers };
    expect(init.headers.get('traceparent')).toBeNull();
    expect(init.headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
    expect(getCurrentConsensysRequestId()).toBe('uuid-fixed');
  });

  describe('no active span (outbound invariant)', () => {
    // `beforeEach` leaves `getActiveSpan` returning undefined, so these cases
    // exercise a matched backend host with no span — the combination that must
    // never emit a trace header.

    it('attaches nothing to a matched backend request that carries no headers', () => {
      const handler = getFetchHandler();
      const handlerData = {
        fetchData: { url: BACKEND_URL, method: 'GET' },
        args: [BACKEND_URL, undefined],
      } as unknown as Parameters<typeof handler>[0];

      handler(handlerData);

      expect(handlerData.args[1]).toBeUndefined();
      expect(getCurrentConsensysRequestId()).toBeUndefined();
    });

    it('strips the SDK trace headers and withholds the Consensys baggage', () => {
      const handler = getFetchHandler();
      const handlerData = {
        fetchData: { url: BACKEND_URL, method: 'GET' },
        args: [
          BACKEND_URL,
          {
            headers: {
              'sentry-trace': SDK_SENTRY_TRACE_NO_SPAN,
              traceparent: SDK_TRACEPARENT_NO_SPAN,
              baggage: SDK_BAGGAGE_NO_SPAN,
              'x-caller': 'kept',
            },
          },
        ],
      } as unknown as Parameters<typeof handler>[0];

      handler(handlerData);

      const init = handlerData.args[1] as { headers: Headers };
      expect(init.headers.get('sentry-trace')).toBeNull();
      expect(init.headers.get('traceparent')).toBeNull();
      expect(init.headers.get('baggage')).toBeNull();
      expect(init.headers.get('x-caller')).toBe('kept');
      expect(getCurrentConsensysRequestId()).toBeUndefined();
    });

    it('leaves non-Sentry baggage on the stripped request', () => {
      const handler = getFetchHandler();
      const handlerData = {
        fetchData: { url: BACKEND_URL, method: 'GET' },
        args: [
          BACKEND_URL,
          {
            headers: {
              traceparent: SDK_TRACEPARENT_NO_SPAN,
              baggage: `${SDK_BAGGAGE_NO_SPAN},vendor-key=vendor-value`,
            },
          },
        ],
      } as unknown as Parameters<typeof handler>[0];

      handler(handlerData);

      const init = handlerData.args[1] as { headers: Headers };
      expect(init.headers.get('traceparent')).toBeNull();
      expect(init.headers.get('baggage')).toBe('vendor-key=vendor-value');
      expect(init.headers.get('baggage')).not.toContain(CONSENSYS_BAGGAGE);
    });

    it('records no request id for the trace, so events are not tagged', () => {
      // A scope propagation context is present, so without the gate the handler
      // would mint a request id and bind it to this trace id.
      getCurrentScopeMock.mockReturnValue({
        getPropagationContext: () => ({ traceId: TRACE_ID }),
      } as unknown as ReturnType<typeof getCurrentScope>);
      const handler = getFetchHandler();
      handler({
        fetchData: { url: BACKEND_URL, method: 'GET' },
        args: [BACKEND_URL, undefined],
      } as unknown as Parameters<typeof handler>[0]);

      const integration = consensysTracePropagationIntegration({ log });
      const event = integration.processEvent?.(
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry event-payload key.
        { contexts: { trace: { trace_id: TRACE_ID } } } as SentryEvent,
        {} as EventHint,
        {} as Client,
      ) as SentryEvent;

      expect(event.tags?.otelTraceId).toBe(TRACE_ID);
      expect(event.tags?.consensysRequestId).toBeUndefined();
    });
  });

  it('does not touch requests to non-backend hosts', () => {
    const handler = getFetchHandler();
    const handlerData = {
      fetchData: { url: 'https://example.com/x', method: 'GET' },
      args: ['https://example.com/x', undefined],
    } as unknown as Parameters<typeof handler>[0];

    handler(handlerData);

    expect(handlerData.args[1]).toBeUndefined();
  });

  it('ignores the response phase (endTimestamp present)', () => {
    const handler = getFetchHandler();
    const handlerData = {
      fetchData: { url: BACKEND_URL, method: 'GET' },
      args: [BACKEND_URL, undefined],
      endTimestamp: 123,
    } as unknown as Parameters<typeof handler>[0];

    handler(handlerData);

    expect(handlerData.args[1]).toBeUndefined();
  });

  it('uses a custom request-id provider when set', () => {
    mockActiveSpan();
    setConsensysRequestIdProvider(() => 'operation-id');
    const handler = getFetchHandler();
    const handlerData = {
      fetchData: { url: BACKEND_URL, method: 'GET' },
      args: [BACKEND_URL, undefined],
    } as unknown as Parameters<typeof handler>[0];

    handler(handlerData);

    const init = handlerData.args[1] as { headers: Headers };
    expect(init.headers.get('baggage')).toContain(
      'consensys-request-id=operation-id',
    );
    expect(getCurrentConsensysRequestId()).toBe('operation-id');
  });

  // `trace_id` is the Sentry event-payload key, not ours.
  /* eslint-disable @typescript-eslint/naming-convention */
  describe('processEvent', () => {
    function enrich(event: SentryEvent) {
      const integration = consensysTracePropagationIntegration({ log });
      return integration.processEvent?.(event, {} as EventHint, {} as Client);
    }

    it('tags events with otelTraceId from the trace context', () => {
      const event = enrich({
        contexts: { trace: { trace_id: TRACE_ID } },
      } as SentryEvent) as SentryEvent;

      expect(event.tags?.otelTraceId).toBe(TRACE_ID);
    });

    it('tags events with the current consensysRequestId once a request has run', () => {
      mockActiveSpan();
      const handler = getFetchHandler();
      handler({
        fetchData: { url: BACKEND_URL, method: 'GET' },
        args: [BACKEND_URL, undefined],
      } as unknown as Parameters<typeof handler>[0]);

      const event = enrich({
        contexts: { trace: { trace_id: TRACE_ID } },
      } as SentryEvent) as SentryEvent;

      expect(event.tags?.consensysRequestId).toBe('uuid-fixed');
    });

    it('does not tag consensysRequestId for a different trace id', () => {
      mockActiveSpan();
      const handler = getFetchHandler();
      handler({
        fetchData: { url: BACKEND_URL, method: 'GET' },
        args: [BACKEND_URL, undefined],
      } as unknown as Parameters<typeof handler>[0]);

      const event = enrich({
        contexts: {
          trace: { trace_id: '11111111111111111111111111111111' },
        },
      } as SentryEvent) as SentryEvent;

      expect(event.tags?.otelTraceId).toBe('11111111111111111111111111111111');
      expect(event.tags?.consensysRequestId).toBeUndefined();
    });

    it('leaves events untouched when no trace context or request id exists', () => {
      const event = enrich({ message: 'err' } as SentryEvent) as SentryEvent;
      expect(event.tags).toBeUndefined();
    });
  });
  /* eslint-enable @typescript-eslint/naming-convention */
});
