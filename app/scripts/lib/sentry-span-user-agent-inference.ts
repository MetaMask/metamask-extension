import type { Envelope, Integration, StreamedSpanJSON } from '@sentry/core';

const NAME = 'SpanUserAgentInference';

type SpanContainer = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ingest_settings?: { infer_ip?: string; infer_user_agent?: string };
};

// First match wins: Android, iOS and Ubuntu user agents also say `Linux` or
// `Mac OS X`.
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
 * Lets Relay derive `browser.name` and `user.geo.*` for streamed spans, which
 * the SDK otherwise disables while `sendDefaultPii` is off. Also sets
 * `sentry.os.name` on the segment span: Sentry reads `os.name` from that key,
 * not from a bare `os.name` attribute.
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
