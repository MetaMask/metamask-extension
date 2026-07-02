import {
  parseSentryEnvelope,
  parseSentryEnvelopes,
  stripVolatile,
  itemSignature,
  summarizeCoverage,
  diffCoverage,
} from './sentry-coverage';

// A realistic error envelope: header line, item-header line, payload line.
const ERROR_ENVELOPE = [
  '{"event_id":"aaaa","sent_at":"2024-01-01T00:00:00.000Z","sdk":{"name":"sentry.javascript.browser","version":"10.38.0"}}',
  '{"type":"event"}',
  '{"event_id":"aaaa","level":"error","exception":{"values":[{"type":"TypeError","value":"boom"}]},"tags":{"otelTraceId":"t1","release":"13.0.0"},"timestamp":1700000000}',
].join('\n');

const TRANSACTION_ENVELOPE = [
  '{"event_id":"bbbb","sent_at":"2024-01-01T00:00:01.000Z","trace":{"trace_id":"t2","public_key":"k"}}',
  '{"type":"transaction"}',
  '{"type":"transaction","transaction":"UI Startup","start_timestamp":1,"timestamp":2,"contexts":{"trace":{"trace_id":"t2","span_id":"s1","op":"pageload"}},"tags":{"release":"13.0.0"}}',
].join('\n');

describe('sentry-coverage harness', () => {
  describe('parseSentryEnvelope', () => {
    it('parses an error envelope into a typed item', () => {
      const items = parseSentryEnvelope(ERROR_ENVELOPE);
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('event');
      expect(items[0].payload.level).toBe('error');
    });

    it('parses a transaction envelope', () => {
      const items = parseSentryEnvelope(TRANSACTION_ENVELOPE);
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('transaction');
      expect(items[0].payload.transaction).toBe('UI Startup');
    });

    it('skips malformed lines instead of throwing', () => {
      expect(
        parseSentryEnvelope('not json\n{"type":"event"}\nalso not json'),
      ).toStrictEqual([]);
      expect(parseSentryEnvelope('')).toStrictEqual([]);
    });

    it('flattens multiple envelope bodies', () => {
      const items = parseSentryEnvelopes([
        ERROR_ENVELOPE,
        TRANSACTION_ENVELOPE,
      ]);
      expect(items.map((item) => item.type)).toStrictEqual([
        'event',
        'transaction',
      ]);
    });
  });

  describe('stripVolatile', () => {
    it('recursively removes run-specific ids and timestamps', () => {
      /* eslint-disable @typescript-eslint/naming-convention -- real Sentry payload field names are snake_case */
      const cleaned = stripVolatile({
        event_id: 'x',
        level: 'error',
        contexts: { trace: { trace_id: 't', span_id: 's', op: 'pageload' } },
        spans: [{ span_id: 's2', description: 'db' }],
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      expect(cleaned).toStrictEqual({
        level: 'error',
        contexts: { trace: { op: 'pageload' } },
        spans: [{ description: 'db' }],
      });
    });
  });

  describe('itemSignature', () => {
    it('keys errors on exception type+value, transactions on name', () => {
      const [errItem] = parseSentryEnvelope(ERROR_ENVELOPE);
      const [txItem] = parseSentryEnvelope(TRANSACTION_ENVELOPE);
      expect(itemSignature(errItem)).toBe('event:TypeError:boom');
      expect(itemSignature(txItem)).toBe('transaction:UI Startup');
    });
  });

  describe('diffCoverage', () => {
    const baselineItems = parseSentryEnvelopes([
      ERROR_ENVELOPE,
      TRANSACTION_ENVELOPE,
    ]);

    it('reports equivalence for the same capture modulo volatile fields', () => {
      // Same payloads, different ids/timestamps — must still be equivalent.
      const drifted = parseSentryEnvelopes([
        ERROR_ENVELOPE.replace('aaaa', 'zzzz').replace(
          '1700000000',
          '1800000000',
        ),
        TRANSACTION_ENVELOPE.replace('bbbb', 'yyyy').replace('"t2"', '"t9"'),
      ]);
      const diff = diffCoverage(
        summarizeCoverage(baselineItems),
        summarizeCoverage(drifted),
      );
      expect(diff.equivalent).toBe(true);
    });

    it('detects a removed envelope item (lost coverage)', () => {
      const diff = diffCoverage(
        summarizeCoverage(baselineItems),
        summarizeCoverage(parseSentryEnvelope(ERROR_ENVELOPE)),
      );
      expect(diff.equivalent).toBe(false);
      expect(diff.removedSignatures).toContain('transaction:UI Startup');
      expect(diff.countDeltas).toContainEqual({
        type: 'transaction',
        baseline: 1,
        current: 0,
      });
    });

    it('detects a dropped correlation tag (e.g. otelTraceId regression)', () => {
      const withoutTag = ERROR_ENVELOPE.replace(
        '"tags":{"otelTraceId":"t1","release":"13.0.0"}',
        '"tags":{"release":"13.0.0"}',
      );
      const diff = diffCoverage(
        summarizeCoverage(parseSentryEnvelope(ERROR_ENVELOPE)),
        summarizeCoverage(parseSentryEnvelope(withoutTag)),
      );
      expect(diff.equivalent).toBe(false);
      expect(diff.tagChanges).toContainEqual({
        signature: 'event:TypeError:boom',
        added: [],
        removed: ['otelTraceId'],
      });
    });

    it('detects a new envelope type / volume increase', () => {
      const sessionEnvelope = [
        '{"sent_at":"2024-01-01T00:00:02.000Z"}',
        '{"type":"session"}',
        '{"sid":"s","status":"ok","started":"2024-01-01T00:00:00.000Z"}',
      ].join('\n');
      const diff = diffCoverage(
        summarizeCoverage(baselineItems),
        summarizeCoverage(
          parseSentryEnvelopes([
            ERROR_ENVELOPE,
            TRANSACTION_ENVELOPE,
            sessionEnvelope,
          ]),
        ),
      );
      expect(diff.equivalent).toBe(false);
      expect(diff.addedSignatures).toContain('session');
      expect(diff.countDeltas).toContainEqual({
        type: 'session',
        baseline: 0,
        current: 1,
      });
    });
  });
});
