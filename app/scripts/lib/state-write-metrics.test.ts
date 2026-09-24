import type * as Sentry from '@sentry/browser';
import type { SplitStateWriteEvent } from '../../../shared/lib/stores/persistence-manager';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { trackSplitStateWrite } from './state-write-metrics';

const EVENT: SplitStateWriteEvent = {
  bytesByController: new Map([
    ['BarController', 21],
    ['FooController', 13],
  ]),
  coalescedUpdates: 3,
  controllerKeys: ['BarController', 'FooController'],
  idleStatus: 'idle',
  measurementDurationMs: 0.25,
  sampleRate: 0.01,
  totalBytes: 67,
  writeDurationMs: 4.5,
};

describe('trackSplitStateWrite', () => {
  const originalSentry = globalThis.sentry;

  afterEach(() => {
    globalThis.sentry = originalSentry;
  });

  it('does nothing when Sentry is unavailable', () => {
    globalThis.sentry = undefined;

    expect(() => trackSplitStateWrite(EVENT)).not.toThrow();
  });

  it('reports value-free write measurements via trace()', () => {
    const startSpan = jest.fn((_options, callback) => callback(null));
    const withIsolationScope = jest.fn((callback) =>
      callback({ setTag: jest.fn() }),
    );
    const getActiveSpan = jest.fn(() => undefined);
    globalThis.sentry = {
      getActiveSpan,
      startSpan,
      withIsolationScope,
    } as unknown as typeof Sentry;

    trackSplitStateWrite(EVENT);

    expect(startSpan).toHaveBeenCalledWith(
      {
        attributes: {
          'state.write.bytes.BarController': 21,
          'state.write.bytes.FooController': 13,
          'state.write.coalesced_updates': 3,
          'state.write.controller_count': 2,
          'state.write.controllers': 'BarController,FooController',
          'state.write.idle_status': 'idle',
          'state.write.measurement_duration_ms': 0.25,
          'state.write.sample_rate': 0.01,
          'state.write.total_bytes': 67,
          'state.write.write_duration_ms': 4.5,
        },
        forceTransaction: undefined,
        name: TraceName.StatePersist,
        op: TraceOperation.StateWrite,
        parentSpan: null,
        startTime: undefined,
      },
      expect.any(Function),
    );
    expect(JSON.stringify(startSpan.mock.calls)).not.toContain(
      'controller state value',
    );
  });

  it('forces a transaction when an ambient active span exists', () => {
    const activeSpan = { spanContext: jest.fn() };
    const startSpan = jest.fn((_options, callback) => callback(null));
    globalThis.sentry = {
      getActiveSpan: jest.fn(() => activeSpan),
      startSpan,
      withIsolationScope: jest.fn((callback) =>
        callback({ setTag: jest.fn() }),
      ),
    } as unknown as typeof Sentry;

    trackSplitStateWrite(EVENT);

    expect(startSpan).toHaveBeenCalledWith(
      expect.objectContaining({
        forceTransaction: true,
        name: TraceName.StatePersist,
        parentSpan: activeSpan,
      }),
      expect.any(Function),
    );
  });
});
