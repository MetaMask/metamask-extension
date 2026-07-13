import type { Client, Event as SentryEvent, EventHint } from '@sentry/types';
import {
  getActiveSpan,
  getCurrentScope,
  getIsolationScope,
} from '@sentry/browser';
import { addFetchInstrumentationHandler } from '@sentry/utils';
import {
  buildAugmentedHeaders,
  buildConsensysBaggage,
  consensysTracePropagationIntegration,
  getCurrentConsensysRequestId,
  getCurrentTraceparent,
  matchesBackendTarget,
  resetConsensysRequestIdProvider,
  setConsensysRequestIdProvider,
} from './sentry-trace-propagation';

jest.mock('@sentry/utils', () => ({
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

const getActiveSpanMock = jest.mocked(getActiveSpan);
const getCurrentScopeMock = jest.mocked(getCurrentScope);
const getIsolationScopeMock = jest.mocked(getIsolationScope);
const addFetchInstrumentationHandlerMock = jest.mocked(
  addFetchInstrumentationHandler,
);

const emptyPropagationScope = {
  getPropagationContext: () => ({}),
} as unknown as ReturnType<typeof getCurrentScope>;

function mockActiveSpan(traceFlags = 1) {
  getActiveSpanMock.mockReturnValue({
    spanContext: () => ({ traceId: TRACE_ID, spanId: SPAN_ID, traceFlags }),
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
  it('formats the RAPID baggage segment', () => {
    expect(buildConsensysBaggage('abc')).toBe(
      'consensys-request-id=abc,consensys-application=metamask-extension',
    );
  });
});

describe('getCurrentTraceparent', () => {
  it('builds a sampled traceparent from the active span', () => {
    mockActiveSpan(1);
    expect(getCurrentTraceparent()).toBe(TRACEPARENT);
  });

  it('encodes an unsampled active span with `00` flags', () => {
    mockActiveSpan(0);
    expect(getCurrentTraceparent()).toBe(`00-${TRACE_ID}-${SPAN_ID}-00`);
  });

  it('falls back to the merged scope propagation context', () => {
    getActiveSpanMock.mockReturnValue(undefined);
    getIsolationScopeMock.mockReturnValue(emptyPropagationScope);
    getCurrentScopeMock.mockReturnValue({
      getPropagationContext: () => ({
        traceId: TRACE_ID,
        spanId: SPAN_ID,
        sampled: false,
      }),
    } as unknown as ReturnType<typeof getCurrentScope>);

    expect(getCurrentTraceparent()).toBe(`00-${TRACE_ID}-${SPAN_ID}-00`);
  });

  it('returns undefined when no trace id is available', () => {
    getActiveSpanMock.mockReturnValue(undefined);
    expect(getCurrentTraceparent()).toBeUndefined();
  });
});

describe('buildAugmentedHeaders', () => {
  it('appends traceparent and baggage to a plain-object header init, preserving sentry headers', () => {
    const args = [
      BACKEND_URL,
      {
        headers: {
          'sentry-trace': `${TRACE_ID}-${SPAN_ID}-1`,
          baggage: 'sentry-environment=dev',
        },
      },
    ];

    const headers = buildAugmentedHeaders(args, {
      traceparent: TRACEPARENT,
      requestId: 'uuid-fixed',
    });

    expect(headers.get('traceparent')).toBe(TRACEPARENT);
    expect(headers.get('sentry-trace')).toBe(`${TRACE_ID}-${SPAN_ID}-1`);
    const baggage = headers.get('baggage');
    expect(baggage).toContain('sentry-environment=dev');
    expect(baggage).toContain(CONSENSYS_BAGGAGE);
  });

  it('augments an existing Headers instance', () => {
    const existing = new Headers({ baggage: 'sentry-environment=dev' });
    const headers = buildAugmentedHeaders(
      [BACKEND_URL, { headers: existing }],
      {
        traceparent: TRACEPARENT,
        requestId: 'uuid-fixed',
      },
    );

    expect(headers.get('traceparent')).toBe(TRACEPARENT);
    expect(headers.get('baggage')).toContain(CONSENSYS_BAGGAGE);
    expect(headers.get('baggage')).toContain('sentry-environment=dev');
  });

  it('augments an array-of-pairs header init', () => {
    const headers = buildAugmentedHeaders(
      [BACKEND_URL, { headers: [['x-test', '1']] }],
      { traceparent: TRACEPARENT, requestId: 'uuid-fixed' },
    );

    expect(headers.get('x-test')).toBe('1');
    expect(headers.get('traceparent')).toBe(TRACEPARENT);
    expect(headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
  });

  it('seeds from a Request when no init headers are present', () => {
    const request = new Request(BACKEND_URL, {
      headers: { 'x-from-request': 'yes' },
    });
    const headers = buildAugmentedHeaders([request], {
      traceparent: TRACEPARENT,
      requestId: 'uuid-fixed',
    });

    expect(headers.get('x-from-request')).toBe('yes');
    expect(headers.get('traceparent')).toBe(TRACEPARENT);
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
      { traceparent: TRACEPARENT, requestId: 'uuid-fixed' },
    );

    expect(headers.get('x-from-init')).toBe('init');
    expect(headers.get('x-from-request')).toBe('yes');
    expect(headers.get('x-override')).toBe('from-init');
    expect(headers.get('traceparent')).toBe(TRACEPARENT);
    expect(headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
  });

  it('does not overwrite an existing traceparent header', () => {
    const headers = buildAugmentedHeaders(
      [
        BACKEND_URL,
        {
          headers: {
            traceparent: `00-${TRACE_ID}-${SPAN_ID}-00`,
          },
        },
      ],
      { traceparent: TRACEPARENT, requestId: 'uuid-fixed' },
    );

    expect(headers.get('traceparent')).toBe(`00-${TRACE_ID}-${SPAN_ID}-00`);
    expect(headers.get('baggage')).toContain(CONSENSYS_BAGGAGE);
  });

  it('omits traceparent when none is available but still adds baggage', () => {
    const headers = buildAugmentedHeaders([BACKEND_URL], {
      traceparent: undefined,
      requestId: 'uuid-fixed',
    });

    expect(headers.get('traceparent')).toBeNull();
    expect(headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
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

  it('injects traceparent and baggage on a matched outbound request', () => {
    mockActiveSpan(1);
    const handler = getFetchHandler();
    const handlerData = {
      fetchData: { url: BACKEND_URL, method: 'GET' },
      args: [BACKEND_URL, undefined],
    } as unknown as Parameters<typeof handler>[0];

    handler(handlerData);

    const init = handlerData.args[1] as { headers: Headers };
    expect(init.headers.get('traceparent')).toBe(TRACEPARENT);
    expect(init.headers.get('baggage')).toBe(CONSENSYS_BAGGAGE);
    expect(getCurrentConsensysRequestId()).toBe('uuid-fixed');
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
    mockActiveSpan(1);
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
      mockActiveSpan(1);
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
      mockActiveSpan(1);
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
