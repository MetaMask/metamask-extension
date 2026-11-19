import type { Envelope, Integration } from '@sentry/core';

const NAME = 'SpanUserAgentInference';

type SpanContainer = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ingest_settings?: { infer_ip?: string; infer_user_agent?: string };
};

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
            infer_ip: 'auto',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            infer_user_agent: 'auto',
          };
        }
      });
    },
  };
}
