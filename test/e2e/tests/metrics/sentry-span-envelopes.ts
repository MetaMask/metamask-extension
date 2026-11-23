import type { CompletedRequest } from 'mockttp';

type SerializedAttributes = Record<string, { value: unknown; type: string }>;

export type SentrySpan = {
  name: string;
  op?: string;
  isSegment: boolean;
  attributes: Record<string, unknown>;
};

// Sentry span-payload keys, not ours.
/* eslint-disable @typescript-eslint/naming-convention */
type SpanItemPayload = {
  items: {
    name: string;
    is_segment: boolean;
    attributes?: SerializedAttributes;
  }[];
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Reads the spans of a Sentry envelope body. Streamed spans travel in `span`
 * items, not a `transaction` event.
 *
 * @param body - The envelope request body.
 * @returns The spans in the envelope's `span` items.
 */
export function parseStreamedSpans(body: string): SentrySpan[] {
  const lines = body.split('\n').filter(Boolean);
  const spans: SentrySpan[] = [];

  // Line 0 is the envelope header; item headers and payloads alternate after.
  for (let index = 1; index + 1 < lines.length; index += 2) {
    const itemHeader = JSON.parse(lines[index]) as { type?: string };
    if (itemHeader.type === 'span') {
      const payload = JSON.parse(lines[index + 1]) as SpanItemPayload;
      for (const span of payload.items) {
        const attributes = Object.fromEntries(
          Object.entries(span.attributes ?? {}).map(([key, { value }]) => [
            key,
            value,
          ]),
        );
        spans.push({
          name: span.name,
          op: attributes['sentry.op'] as string | undefined,
          isSegment: span.is_segment,
          attributes,
        });
      }
    }
  }
  return spans;
}

/**
 * Reads the spans of every recorded Sentry envelope request.
 *
 * @param requests - Requests recorded by a Sentry mock endpoint.
 * @returns The streamed spans in the envelopes.
 */
export async function getStreamedSpans(
  requests: CompletedRequest[],
): Promise<SentrySpan[]> {
  const spans: SentrySpan[] = [];
  for (const request of requests) {
    const body = await request.body.getText();
    if (body) {
      spans.push(...parseStreamedSpans(body));
    }
  }
  return spans;
}

/**
 * Matches a Sentry envelope request carrying a segment span with the given
 * name.
 *
 * @param name - The segment span name.
 * @returns A mockttp request matcher.
 */
export function carriesSegmentSpan(name: string) {
  return async (request: CompletedRequest) => {
    const body = await request.body.getText();
    return (
      Boolean(body) &&
      parseStreamedSpans(body as string).some(
        (span) => span.isSegment && span.name === name,
      )
    );
  };
}
