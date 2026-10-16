import { MetaMetricsEventName } from '../../constants/metametrics';
import {
  trackErrorAsAnalytics,
  resetTrackErrorAsAnalyticsStateForTesting,
  DEFAULT_ERROR_TRACKING_OPTIONS,
} from './track-error-as-analytics';
import type { AnalyticsEvent } from './create-event-builder';
import type { TrackErrorReporter } from './track-error-as-analytics';

const CATEGORY = 'Swaps';
const SOURCE = 'test';

describe('trackErrorAsAnalytics', () => {
  let report: jest.MockedFunction<TrackErrorReporter>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    resetTrackErrorAsAnalyticsStateForTesting();
    report = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('error normalization', () => {
    it('emits the sanitized message and no stack for an Error instance', async () => {
      const error = new Error('boom');

      await trackErrorAsAnalytics(report, error, {
        category: CATEGORY,
        source: SOURCE,
      });

      expect(report).toHaveBeenCalledTimes(1);
      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('boom');
      expect(event.properties.error_stack).toBeUndefined();
    });

    it('normalizes error message whitespace', async () => {
      await trackErrorAsAnalytics(
        report,
        new Error('failed\nwith   whitespace\taround'),
        { category: CATEGORY, source: SOURCE },
      );

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe(
        'failed with whitespace around',
      );
    });

    it('truncates messages above the 500 character cap', async () => {
      const longMessage = 'x'.repeat(600);

      await trackErrorAsAnalytics(report, new Error(longMessage), {
        category: CATEGORY,
        source: SOURCE,
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      const message = event.properties.error_message as string;
      expect(message).toHaveLength(500);
      expect(message.startsWith('x'.repeat(499))).toBe(true);
      expect(message.endsWith('…')).toBe(true);
    });

    it('sanitizes non-Error thrown values too', async () => {
      await trackErrorAsAnalytics(report, 'unexpected\n  string   value', {
        category: CATEGORY,
        source: SOURCE,
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('unexpected string value');
      expect(event.properties.error_stack).toBeUndefined();
    });

    it('stringifies non-Error thrown values', async () => {
      await trackErrorAsAnalytics(report, 'unexpected string', {
        category: CATEGORY,
        source: SOURCE,
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('unexpected string');
      expect(event.properties.error_stack).toBeUndefined();
    });

    it('resolves without throwing for null input', async () => {
      await expect(
        trackErrorAsAnalytics(report, null, {
          category: CATEGORY,
          source: SOURCE,
        }),
      ).resolves.toBeUndefined();

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('Unknown error');
    });

    it('resolves without throwing for undefined input', async () => {
      await expect(
        trackErrorAsAnalytics(report, undefined, {
          category: CATEGORY,
          source: SOURCE,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('canonical schema', () => {
    it('always includes event name, category, source, and severity', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.name).toBe(MetaMetricsEventName.ErrorOccured);
      expect(event.properties.category).toBe(CATEGORY);
      expect(event.properties.source).toBe(SOURCE);
      expect(event.properties.severity).toBe('error');
    });

    it('keeps optional caller context inside the error_context namespace', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
        context: { origin: 'swap-quote-fetch' },
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_context).toStrictEqual({
        origin: 'swap-quote-fetch',
      });
      expect(Object.keys(event.properties)).not.toContain('origin');
    });

    it('omits the context namespace entirely when no context is given', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_context).toBeUndefined();
    });

    it('keeps volume-control fields out of the emitted event options', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.25);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
        buildOptions: {
          excludeMetaMetricsId: true,
          matomoEvent: true,
        },
        volumeControls: {
          samplingRate: 0.5,
          dedupWindowMs: 12_345,
          sessionCap: 7,
        },
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.options).toStrictEqual({
        excludeMetaMetricsId: true,
        matomoEvent: true,
      });
    });
  });

  describe('fail-safe behavior', () => {
    it('resolves without throwing when the reporter rejects', async () => {
      report.mockRejectedValue(new Error('dispatch failed'));

      await expect(
        trackErrorAsAnalytics(report, new Error('boom'), {
          category: CATEGORY,
          source: SOURCE,
        }),
      ).resolves.toBeUndefined();
    });

    it('resolves without throwing when the reporter throws synchronously', async () => {
      report.mockImplementation(() => {
        throw new Error('sync dispatch failure');
      });

      await expect(
        trackErrorAsAnalytics(report, new Error('boom'), {
          category: CATEGORY,
          source: SOURCE,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('volume controls', () => {
    it('suppresses events outside the sampling rate', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.75);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { samplingRate: 0.5 },
      });

      expect(report).not.toHaveBeenCalled();
    });

    it('emits events inside the sampling rate', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.25);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { samplingRate: 0.5 },
      });

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('emits only once for a duplicate signature within the dedup window', async () => {
      jest.setSystemTime(1000);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
      });
      jest.setSystemTime(2000);
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
      });

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('emits again for the same signature after the dedup window', async () => {
      jest.setSystemTime(1000);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { dedupWindowMs: 5000 },
      });
      jest.setSystemTime(1000 + 5000 + 1);
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { dedupWindowMs: 5000 },
      });

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('treats different error messages as distinct signatures', async () => {
      jest.setSystemTime(1000);

      await trackErrorAsAnalytics(report, new Error('first'), {
        source: SOURCE,
        category: CATEGORY,
      });
      await trackErrorAsAnalytics(report, new Error('second'), {
        source: SOURCE,
        category: CATEGORY,
      });

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('emits again for the same message under a different source within the window', async () => {
      jest.setSystemTime(1000);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: 'first-source',
      });
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: 'second-source',
      });

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('emits again for the same message under a different category within the window', async () => {
      jest.setSystemTime(1000);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        source: SOURCE,
        category: 'Swaps',
      });
      await trackErrorAsAnalytics(report, new Error('boom'), {
        source: SOURCE,
        category: 'Settings',
      });

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('emits again for the same message and category under a different severity within the window', async () => {
      jest.setSystemTime(1000);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        source: SOURCE,
        category: CATEGORY,
        severity: 'error',
      });
      await trackErrorAsAnalytics(report, new Error('boom'), {
        source: SOURCE,
        category: CATEGORY,
        severity: 'warning',
      });

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('suppresses all events once the session cap is reached', async () => {
      const options = {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { sessionCap: 1 },
      };

      await trackErrorAsAnalytics(report, new Error('first'), options);
      await trackErrorAsAnalytics(report, new Error('second'), options);

      expect(report).toHaveBeenCalledTimes(1);
      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('first');
    });

    it('clamps an out-of-range sampling rate instead of failing open', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.75);

      const options = {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { samplingRate: 1.2 },
      };

      await trackErrorAsAnalytics(report, new Error('boom'), options);

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('falls back to the default sampling rate for NaN', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.99);

      const options = {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { samplingRate: Number.NaN },
      };

      await trackErrorAsAnalytics(report, new Error('boom'), options);

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('still dedupes when dedupWindowMs is NaN', async () => {
      jest.setSystemTime(1000);
      const options = {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { dedupWindowMs: Number.NaN },
      };

      await trackErrorAsAnalytics(report, new Error('boom'), options);
      jest.setSystemTime(2000);
      await trackErrorAsAnalytics(report, new Error('boom'), options);

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('still caps when sessionCap is NaN', async () => {
      const options = {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { sessionCap: Number.NaN },
      };

      await trackErrorAsAnalytics(report, new Error('first'), options);
      await trackErrorAsAnalytics(report, new Error('second'), options);

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('never emits when the sampling rate is zero, even on a zero random draw', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { samplingRate: 0 },
      });

      expect(report).not.toHaveBeenCalled();
    });

    it('clamps a caller-supplied sessionCap above the global default', async () => {
      const options = {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { sessionCap: Number.MAX_SAFE_INTEGER },
      };

      await Promise.all(
        Array.from(
          { length: DEFAULT_ERROR_TRACKING_OPTIONS.sessionCap + 1 },
          (_, index) =>
            trackErrorAsAnalytics(report, new Error(`error-${index}`), options),
        ),
      );

      expect(report).toHaveBeenCalledTimes(
        DEFAULT_ERROR_TRACKING_OPTIONS.sessionCap,
      );
    });

    it('reserves the session cap synchronously so concurrent calls cannot bypass it', async () => {
      let releaseReport: () => void = () => undefined;
      report.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            releaseReport = resolve;
          }),
      );

      const options = {
        category: CATEGORY,
        source: SOURCE,
        volumeControls: { sessionCap: 1 },
      };
      const first = trackErrorAsAnalytics(report, new Error('boom'), options);
      const second = trackErrorAsAnalytics(report, new Error('boom'), options);
      releaseReport();
      await Promise.all([first, second]);

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('does not consume the session budget or dedup when the reporter rejects', async () => {
      report.mockRejectedValueOnce(new Error('dispatch failed'));
      const options = {
        category: CATEGORY,
        source: SOURCE,
      };

      await trackErrorAsAnalytics(report, new Error('boom'), options);
      await trackErrorAsAnalytics(report, new Error('boom'), options);

      expect(report).toHaveBeenCalledTimes(2);
    });
  });
});
