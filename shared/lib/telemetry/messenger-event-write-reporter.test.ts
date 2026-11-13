import type * as Sentry from '@sentry/browser';
import { TraceName, TraceOperation } from '../trace';
import {
  trackMessengerEventWrite,
  type MessengerEventWrite,
} from './messenger-event-write-reporter';

const MEASUREMENT: MessengerEventWrite = {
  event: 'TransactionController:transactionStatusUpdated',
  patchesDrained: 4,
  subscriberCount: 2,
  payloadBytes: 512,
  msSinceLastWrite: 18,
  sampleRate: 0.01,
};

function stubSentry() {
  const startSpan = jest.fn((_options, callback) => callback(null));
  globalThis.sentry = {
    getActiveSpan: jest.fn(() => undefined),
    startSpan,
    withIsolationScope: jest.fn((callback) => callback({ setTag: jest.fn() })),
  } as unknown as typeof Sentry;
  return startSpan;
}

describe('trackMessengerEventWrite', () => {
  const originalSentry = globalThis.sentry;

  afterEach(() => {
    globalThis.sentry = originalSentry;
  });

  it('does nothing when Sentry is unavailable', () => {
    globalThis.sentry = undefined;

    expect(() => trackMessengerEventWrite(MEASUREMENT)).not.toThrow();
  });

  it('reports the write via trace()', () => {
    const startSpan = stubSentry();

    trackMessengerEventWrite(MEASUREMENT);

    expect(startSpan).toHaveBeenCalledWith(
      {
        attributes: {
          'messenger.write.event':
            'TransactionController:transactionStatusUpdated',
          'messenger.write.ms_since_last_write': 18,
          'messenger.write.patches_drained': 4,
          'messenger.write.payload_bytes': 512,
          'messenger.write.sample_rate': 0.01,
          'messenger.write.stale_window_open': true,
          'messenger.write.subscriber_count': 2,
        },
        forceTransaction: undefined,
        name: TraceName.MessengerEventWrite,
        op: TraceOperation.MessengerEventWrite,
        parentSpan: null,
        startTime: undefined,
      },
      expect.any(Function),
    );
  });

  it('reports the stale-read window as closed when the drain carried nothing', () => {
    // A drain of zero is the case where the event had no state behind it, which
    // is the half of the channel's volume that costs a subscriber nothing.
    const startSpan = stubSentry();

    trackMessengerEventWrite({ ...MEASUREMENT, patchesDrained: 0 });

    expect(startSpan.mock.calls[0][0].attributes).toMatchObject({
      'messenger.write.patches_drained': 0,
      'messenger.write.stale_window_open': false,
    });
  });

  it('omits the optional keys when they were not measured', () => {
    const startSpan = stubSentry();

    trackMessengerEventWrite({
      event: 'AccountsController:accountTransactionsUpdated',
      patchesDrained: 0,
      subscriberCount: 1,
      sampleRate: 1,
    });

    const { attributes } = startSpan.mock.calls[0][0];
    expect(attributes).not.toHaveProperty('messenger.write.payload_bytes');
    expect(attributes).not.toHaveProperty(
      'messenger.write.ms_since_last_write',
    );
  });

  it('carries no payload values', () => {
    const startSpan = stubSentry();

    trackMessengerEventWrite(MEASUREMENT);

    expect(Object.keys(startSpan.mock.calls[0][0].attributes)).toStrictEqual([
      'messenger.write.event',
      'messenger.write.patches_drained',
      'messenger.write.stale_window_open',
      'messenger.write.subscriber_count',
      'messenger.write.sample_rate',
      'messenger.write.payload_bytes',
      'messenger.write.ms_since_last_write',
    ]);
  });
});
