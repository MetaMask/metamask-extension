import * as Sentry from '@sentry/browser';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { getTraceContext, trace, TraceName } from '../../../shared/lib/trace';
import createTracingMiddleware from './createTracingMiddleware';

const REQUEST_MOCK = {
  id: 'testId',
  method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const RESPONSE_MOCK = {};
const NEXT_MOCK = jest.fn();

describe('createTracingMiddleware', () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let request: any;

  beforeEach(() => {
    jest.resetAllMocks();

    request = { ...REQUEST_MOCK };

    globalThis.sentry = {
      withIsolationScope: jest.fn().mockReturnValue({}),
    };
  });

  it('adds trace context to request if method is send transaction', async () => {
    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(request.traceContext).toBeDefined();
  });

  it('does not add trace context to request if method not supported', async () => {
    request.method = 'unsupportedMethod';

    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(request.traceContext).toBeUndefined();
  });

  it('calls next', async () => {
    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(NEXT_MOCK).toHaveBeenCalledTimes(1);
  });
});

// Real SDK, not mocks: the assertions read Sentry's own trace and parent ids.
describe('createTracingMiddleware trace roots (real SDK)', () => {
  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampleRate: 1,
      integrations: [],
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
  });

  beforeEach(() => {
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  it.each([
    [MESSAGE_TYPE.ETH_SEND_TRANSACTION, TraceName.Transaction],
    [MESSAGE_TYPE.PERSONAL_SIGN, TraceName.Signature],
  ])(
    'starts a new trace for %s instead of joining the active span',
    async (method, traceName) => {
      const req = { id: `${method}-id`, method } as {
        id: string;
        method: string;
        traceContext?: Sentry.Span;
      };

      const activeTraceId = await trace(
        { name: TraceName.BackgroundPoll },
        async (span) => {
          await createTracingMiddleware()(req, {}, jest.fn());
          return (span as Sentry.Span).spanContext().traceId;
        },
      );

      const json = Sentry.spanToJSON(req.traceContext as Sentry.Span);
      expect(json.description).toBe(traceName);
      expect(json.trace_id).not.toBe(activeTraceId);
      expect(json.parent_span_id).toBeUndefined();

      // The middleware span stays a child of the request's own root.
      const middleware = Sentry.spanToJSON(
        getTraceContext({
          name: TraceName.Middleware,
          id: req.id,
        }) as Sentry.Span,
      );
      expect(middleware.trace_id).toBe(json.trace_id);
      expect(middleware.parent_span_id).toBe(json.span_id);
    },
  );
});
