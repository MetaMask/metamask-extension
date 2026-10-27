import type * as Sentry from '@sentry/browser';
import type { SplitStateWriteEvent } from '../stores/persistence-manager';
import { TraceName, TraceOperation } from '../trace';
import { StartupPhase } from './startup-phase';
import { trackSplitStateWrite } from './state-write-reporter';

const EVENT: SplitStateWriteEvent = {
  currentActivity: {
    fullscreenCount: 0,
    notificationIsOpen: true,
    popupCount: 2,
    sidePanelCount: 0,
    startupPhase: StartupPhase.Initialized,
  },
  bytesByController: new Map([
    ['BarController', 21],
    ['FooController', 13],
  ]),
  coalescedUpdates: 3,
  environmentType: 'popup',
  idleStatus: 'idle',
  measurementDurationMs: 0.25,
  sampleRate: 0.01,
  sizeMeasurementSource: 'storage_get_bytes_in_use',
  totalBytes: 34,
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
          'state.write.environment_type': 'popup',
          'state.write.idle_status': 'idle',
          'state.write.measurement_duration_ms': 0.25,
          'state.write.sample_rate': 0.01,
          'state.write.size_measurement_source': 'storage_get_bytes_in_use',
          'state.write.notification_is_open': true,
          'state.write.startup_phase': StartupPhase.Initialized,
          'state.write.total_bytes': 34,
          'state.write.ui_count.fullscreen': 0,
          'state.write.ui_count.popup': 2,
          'state.write.ui_count.sidepanel': 0,
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

  it('omits activity keys when the activity is empty', () => {
    const startSpan = jest.fn((_options, callback) => callback(null));
    const withIsolationScope = jest.fn((callback) =>
      callback({ setTag: jest.fn() }),
    );
    globalThis.sentry = {
      getActiveSpan: jest.fn(() => undefined),
      startSpan,
      withIsolationScope,
    } as unknown as typeof Sentry;

    trackSplitStateWrite({ ...EVENT, currentActivity: {} });

    const attributes = startSpan.mock.calls[0][0].attributes as Record<
      string,
      unknown
    >;
    expect(attributes['state.write.startup_phase']).toBeUndefined();
    expect(attributes['state.write.ui_count.popup']).toBeUndefined();
    expect(startSpan.mock.calls[0][0].attributes).not.toHaveProperty(
      'state.write.ui_count.popup',
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
