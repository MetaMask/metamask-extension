import type { Envelope, Integration } from '@sentry/core';

const NAME = 'SpanUserAgentInference';

type SpanContainer = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ingest_settings?: { infer_ip?: string; infer_user_agent?: string };
};

/**
 * Lets Relay derive `browser.name`, `os.name` and the rest of the browser
 * context for streamed spans from the request's user agent, as it did for
 * transaction events. The SDK sets `infer_user_agent` to `never` while
 * `sendDefaultPii` is off, which leaves every dashboard filtering on those
 * fields empty.
 *
 * Only the user agent is opened up: `infer_ip` is left as the SDK set it
 * (`never`), because `auto` makes Relay store the client address on every
 * span, which transaction events never carried. The user agent is already
 * sent with every request, and is the value the SDK itself puts on segment
 * spans as `http.request.header.user_agent`.
 *
 * @returns The integration.
 */
export function spanUserAgentInferenceIntegration(): Integration {
  return {
    name: NAME,
    setup(client) {
      client.on('beforeEnvelope', (envelope: Envelope) => {
        for (const [header, payload] of envelope[1]) {
          if (header.type !== 'span') {
            continue;
          }
          const container = payload as SpanContainer;
          container.ingest_settings = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            infer_ip: container.ingest_settings?.infer_ip ?? 'never',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            infer_user_agent: 'auto',
          };
        }
      });
    },
  };
}
