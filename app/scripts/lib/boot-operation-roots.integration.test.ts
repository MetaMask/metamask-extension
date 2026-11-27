import * as Sentry from '@sentry/browser';
import {
  _INTERNAL_setSpanForScope as setSpanForScope,
  getDefaultCurrentScope,
  type Event as SentryEvent,
} from '@sentry/core';
import {
  C2_DOMAIN_BLOCKLIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  METAMASK_STALELIST_URL,
} from '@metamask/phishing-controller';
import { trace, TraceName } from '../../../shared/lib/trace';
import { traceSupportedNetworksFetches } from '../messenger-client-init/assets/assets-controller-init';
import { getGeolocationApiServiceInstanceOptions } from '../wallet-init/instance-options/geolocation-api-service';
import { rampsInitTrace } from './ramps/ramps-init-trace';
import { shouldCreateSpanForRequest } from './setupSentry';
import {
  BACKEND_TRACE_PROPAGATION_TARGETS,
  consensysTracePropagationIntegration,
} from './sentry-trace-propagation';
import { updatePhishingLists } from './update-phishing-lists';

const UNRELATED_URL = 'https://client-config.api.cx.metamask.io/v1/flags';
const GEOLOCATION_URL = 'https://on-ramp.api.cx.metamask.io/geolocation';
const COUNTRIES_URL = 'https://on-ramp.api.cx.metamask.io/regions/countries';
const SUPPORTED_NETWORKS_URL =
  'https://accounts.api.cx.metamask.io/v2/supportedNetworks';

type Deferred = { promise: Promise<void>; resolve: () => void };

function defer(): Deferred {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function traceparentIds(header: string | undefined) {
  const [, traceId, spanId] = (header ?? '').split('-');
  return { traceId, spanId };
}

// A real client, as the service worker configures it, with every trace sampled
// and each sent transaction recorded.
describe('boot-time operation roots (real SDK)', () => {
  const requests: { url: string; headers: Record<string, string> }[] = [];
  const transactions: SentryEvent[] = [];
  const originalFetch = globalThis.fetch;

  // One client for the file: each init adds fetch handlers that outlive it.
  beforeAll(() => {
    // Wrapped once per process by the SDK, so installed before the init.
    globalThis.fetch = jest.fn(async (input, init?: RequestInit) => {
      requests.push({
        url: String(input),
        headers: Object.fromEntries(new Headers(init?.headers)),
      });
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
    // Lets `Sentry.init` run in jsdom, which it takes for an embedded extension.
    (globalThis as { nw?: object }).nw = {};
    performance.getEntriesByType ??= () => [];
    (globalThis as { sentry?: unknown }).sentry = Sentry;
    Sentry.init({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({ send: async () => ({}), flush: async () => true }),
      tracesSampleRate: 1,
      tracePropagationTargets: BACKEND_TRACE_PROPAGATION_TARGETS,
      propagateTraceparent: true,
      beforeSendTransaction: (event) => {
        transactions.push(event);
        return null;
      },
      integrations: [
        Sentry.browserTracingIntegration({
          instrumentPageLoad: false,
          instrumentNavigation: false,
          shouldCreateSpanForRequest,
        }),
        consensysTracePropagationIntegration({ log: () => undefined }),
      ],
    });
  });

  afterAll(async () => {
    await Sentry.close();
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    requests.length = 0;
    transactions.length = 0;
  });

  // Starts a phishing list refresh that stays pending until `finish` is
  // called; `run` executes inside the refresh after its first `await`.
  function startPhishingRefresh(
    run: () => Promise<unknown> = async () => undefined,
  ) {
    const pending = defer();
    let traceId = '';
    const done = updatePhishingLists({
      isStalelistOutOfDate: () => true,
      isHotlistOutOfDate: () => false,
      isC2DomainBlocklistOutOfDate: () => false,
      maybeUpdateState: async () => {
        traceId = (Sentry.getActiveSpan() as Sentry.Span).spanContext().traceId;
        await Promise.resolve();
        await run();
        await pending.promise;
      },
    });
    return { done, finish: pending.resolve, traceId: () => traceId };
  }

  function sentTransaction(name: string): SentryEvent {
    const event = transactions.find(({ transaction }) => transaction === name);
    if (!event) {
      throw new Error(`No ${name} transaction was sent`);
    }
    return event;
  }

  // Whether the traceparent names a span the transaction holds.
  function namesSpanIn(header: string | undefined, event: SentryEvent) {
    const { traceId, spanId } = traceparentIds(header);
    const spanIds = [
      event.contexts?.trace?.span_id,
      ...(event.spans ?? []).map(({ span_id: id }) => id),
    ];
    return (
      traceId === event.contexts?.trace?.trace_id && spanIds.includes(spanId)
    );
  }

  it('roots a geolocation fetch started while another operation runs', async () => {
    const phishing = startPhishingRefresh();
    await Promise.resolve();

    await getGeolocationApiServiceInstanceOptions().fetch?.(GEOLOCATION_URL);
    phishing.finish();
    await phishing.done;
    await Sentry.flush();

    const geolocation = sentTransaction(TraceName.GeolocationFetch);
    expect(requests).toHaveLength(1);
    expect(traceparentIds(requests[0].headers.traceparent).traceId).not.toBe(
      phishing.traceId(),
    );
    expect(namesSpanIn(requests[0].headers.traceparent, geolocation)).toBe(
      true,
    );
  });

  it('keeps an unrelated request out of a running operation', async () => {
    const phishing = startPhishingRefresh();
    await Promise.resolve();

    await fetch(UNRELATED_URL);
    phishing.finish();
    await phishing.done;

    expect(requests).toHaveLength(1);
    expect(requests[0].headers.traceparent ?? '').not.toContain(
      phishing.traceId(),
    );
  });

  it('leaves no span active when two operations end out of order', async () => {
    const first = startPhishingRefresh();
    const second = startPhishingRefresh();
    await Promise.resolve();

    first.finish();
    await first.done;
    expect(Sentry.getActiveSpan()).toBeUndefined();
    await fetch(UNRELATED_URL);

    second.finish();
    await second.done;
    expect(Sentry.getActiveSpan()).toBeUndefined();

    expect(first.traceId()).not.toBe(second.traceId());
    for (const traceId of [first.traceId(), second.traceId()]) {
      expect(requests[0].headers.traceparent ?? '').not.toContain(traceId);
    }
  });

  it('keeps the phishing list requests sent after an await in the refresh', async () => {
    const phishing = startPhishingRefresh(async () => {
      await fetch(METAMASK_STALELIST_URL);
      await fetch(`${METAMASK_HOTLIST_DIFF_URL}/1700000000`);
      await fetch(`${C2_DOMAIN_BLOCKLIST_URL}?timestamp=1700000000`);
    });
    phishing.finish();
    await phishing.done;
    await Sentry.flush();

    const update = sentTransaction(TraceName.PhishingListsUpdate);
    expect(requests).toHaveLength(3);
    for (const { headers } of requests) {
      expect(namesSpanIn(headers.traceparent, update)).toBe(true);
    }
  });

  it('keeps a phishing list request out of a running pageload', async () => {
    // The pageload sits on the base scope, below every operation's scope.
    const pageload = Sentry.startInactiveSpan({
      name: '/service-worker.js',
      forceTransaction: true,
    });
    setSpanForScope(getDefaultCurrentScope(), pageload);
    try {
      const phishing = startPhishingRefresh(() =>
        fetch(`${METAMASK_HOTLIST_DIFF_URL}/1700000000`),
      );
      phishing.finish();
      await phishing.done;
    } finally {
      setSpanForScope(getDefaultCurrentScope(), undefined);
      pageload.end();
    }
    await Sentry.flush();

    expect(requests).toHaveLength(1);
    expect(
      namesSpanIn(
        requests[0].headers.traceparent,
        sentTransaction(TraceName.PhishingListsUpdate),
      ),
    ).toBe(true);
    expect(sentTransaction('/service-worker.js').spans ?? []).toHaveLength(0);
  });

  it('keeps the supported-networks request sent after an await in its root', async () => {
    const accounts = {
      // The client awaits its bearer token before it fetches.
      fetchV2SupportedNetworks: async () => {
        await Promise.resolve();
        return fetch(SUPPORTED_NETWORKS_URL);
      },
    };
    traceSupportedNetworksFetches(accounts);
    const phishing = startPhishingRefresh();
    await Promise.resolve();

    await accounts.fetchV2SupportedNetworks();
    phishing.finish();
    await phishing.done;
    await Sentry.flush();

    expect(requests).toHaveLength(1);
    expect(
      namesSpanIn(
        requests[0].headers.traceparent,
        sentTransaction(TraceName.AccountsApiSupportedNetworksFetch),
      ),
    ).toBe(true);
  });

  it('keeps a ramps request sent after an await in Ramps Init', async () => {
    const rampsFetch = rampsInitTrace.bindFetch(fetch);

    await rampsInitTrace.run(async () => {
      await Promise.resolve();
      await rampsFetch(COUNTRIES_URL);
    });
    await rampsFetch(COUNTRIES_URL);
    await Sentry.flush();

    const rampsInit = sentTransaction(TraceName.RampsInit);
    expect(requests).toHaveLength(2);
    expect(namesSpanIn(requests[0].headers.traceparent, rampsInit)).toBe(true);
    expect(requests[1].headers.traceparent).toBeUndefined();
  });

  it('lets a ramps request join a later parent once a sampled-out Ramps Init settles', async () => {
    const options = Sentry.getClient()?.getOptions() as {
      tracesSampleRate?: number;
    };
    const rampsFetch = rampsInitTrace.bindFetch(fetch);

    options.tracesSampleRate = 0;
    try {
      await rampsInitTrace.run(async () => {
        await Promise.resolve();
      });
    } finally {
      options.tracesSampleRate = 1;
    }
    const laterTraceId = await Sentry.startSpan(
      { name: 'later parent', forceTransaction: true },
      async (span) => {
        await rampsFetch(COUNTRIES_URL);
        return span.spanContext().traceId;
      },
    );

    expect(requests).toHaveLength(1);
    expect(traceparentIds(requests[0].headers.traceparent).traceId).toBe(
      laterTraceId,
    );
  });

  it('lets a ramps request join a later parent once Ramps Init settles with tracing disabled', async () => {
    const options = Sentry.getClient()?.getOptions() as {
      tracesSampleRate?: number;
    };
    const rampsFetch = rampsInitTrace.bindFetch(fetch);

    options.tracesSampleRate = undefined;
    try {
      await rampsInitTrace.run(async () => {
        await Promise.resolve();
      });
    } finally {
      options.tracesSampleRate = 1;
    }
    const laterTraceId = await Sentry.startSpan(
      { name: 'later parent', forceTransaction: true },
      async (span) => {
        await rampsFetch(COUNTRIES_URL);
        return span.spanContext().traceId;
      },
    );

    expect(requests).toHaveLength(1);
    expect(traceparentIds(requests[0].headers.traceparent).traceId).toBe(
      laterTraceId,
    );
  });

  it('keeps an explicit parent while an operation runs', async () => {
    const phishing = startPhishingRefresh();
    await Promise.resolve();
    const parent = Sentry.startInactiveSpan({ name: 'parent' });

    const parentSpanId = trace(
      { name: TraceName.GeolocationFetch, parentContext: parent },
      () => Sentry.spanToJSON(Sentry.getActiveSpan() as Sentry.Span),
    ).parent_span_id;
    parent.end();
    phishing.finish();
    await phishing.done;

    expect(parentSpanId).toBe(parent.spanContext().spanId);
  });
});
