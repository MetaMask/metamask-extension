import type { Envelope, Integration, StreamedSpanJSON } from '@sentry/core';

const NAME = 'SpanUserAgentInference';

type SpanContainer = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ingest_settings?: { infer_ip?: string; infer_user_agent?: string };
};

// First match wins: an Android user agent also says `Linux`, an iOS one also
// says `Mac OS X`, and a Firefox-on-Ubuntu one also says `Linux`. The names are
// the `os.name` values transaction events carried.
const OS_PATTERNS: [RegExp, string][] = [
  [/Android/u, 'Android'],
  [/iPhone|iPad|iPod/u, 'iOS'],
  [/CrOS/u, 'Chrome OS'],
  [/Windows/u, 'Windows'],
  [/Macintosh|Mac OS X/u, 'Mac OS X'],
  [/Ubuntu/u, 'Ubuntu'],
  [/Linux|X11/u, 'Linux'],
];

function getOsName(userAgent: unknown): string | undefined {
  if (typeof userAgent !== 'string') {
    return undefined;
  }
  return OS_PATTERNS.find(([pattern]) => pattern.test(userAgent))?.[1];
}

/**
 * Lets Relay derive `browser.name` and `user.geo.*` for streamed spans, as it
 * did for transaction events. The SDK sets `infer_ip` and `infer_user_agent`
 * to `never` while `sendDefaultPii` is off, which leaves every dashboard and
 * detector filtering on those fields empty.
 *
 * The client sends no address: Relay takes the browser from the request's
 * user agent and the geo from the connection IP. It derives the geo before the
 * org's IP scrubbing removes the address, so no `client.address` is stored.
 *
 * Relay derives no OS for a span, so the segment span also carries
 * `sentry.os.name`, parsed from the user agent the SDK already puts on it.
 * Sentry reads the `os.name` field from that key; a bare `os.name` attribute
 * is stored as a tag the field does not read.
 *
 * @returns The integration.
 */
export function spanUserAgentInferenceIntegration(): Integration {
  return {
    name: NAME,
    processSegmentSpan(span: StreamedSpanJSON) {
      const osName = getOsName(
        span.attributes?.['http.request.header.user_agent'],
      );
      if (osName) {
        span.attributes = { ...span.attributes, 'sentry.os.name': osName };
      }
    },
    setup(client) {
      client.on('beforeEnvelope', (envelope: Envelope) => {
        for (const [header, payload] of envelope[1]) {
          if (header.type !== 'span') {
            continue;
          }
          const container = payload as SpanContainer;
          container.ingest_settings = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            infer_ip: 'auto',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            infer_user_agent: 'auto',
          };
        }
      });
    },
  };
}
