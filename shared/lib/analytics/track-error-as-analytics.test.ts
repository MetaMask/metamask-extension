import { MetaMetricsEventName } from '../../constants/metametrics';
import {
  trackErrorAsAnalytics,
  resetTrackErrorAsAnalyticsStateForTesting,
} from './track-error-as-analytics';
import type { AnalyticsEvent } from './create-event-builder';
import type { TrackErrorReporter } from './track-error-as-analytics';

const CATEGORY = 'Swaps';

describe('trackErrorAsAnalytics', () => {
  let report: jest.MockedFunction<TrackErrorReporter>;

  beforeEach(() => {
    resetTrackErrorAsAnalyticsStateForTesting();
    report = jest.fn().mockResolvedValue(undefined);
  });

  describe('error normalization', () => {
    it('emits normalized message and stack for an Error instance', async () => {
      const error = new Error('boom');

      await trackErrorAsAnalytics(report, error, { category: CATEGORY });

      expect(report).toHaveBeenCalledTimes(1);
      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('boom');
      expect(event.properties.error_stack).toBe(error.stack);
    });

    it('stringifies non-Error thrown values', async () => {
      await trackErrorAsAnalytics(report, 'unexpected string', {
        category: CATEGORY,
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('unexpected string');
      expect(event.properties.error_stack).toBeUndefined();
    });

    it('resolves without throwing for null input', async () => {
      await expect(
        trackErrorAsAnalytics(report, null, { category: CATEGORY }),
      ).resolves.toBeUndefined();

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('Unknown error');
    });

    it('resolves without throwing for undefined input', async () => {
      await expect(
        trackErrorAsAnalytics(report, undefined, { category: CATEGORY }),
      ).resolves.toBeUndefined();
    });
  });

  describe('canonical schema', () => {
    it('always includes event name, category, and severity', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.name).toBe(MetaMetricsEventName.ErrorOccured);
      expect(event.properties.category).toBe(CATEGORY);
      expect(event.properties.severity).toBe('error');
    });

    it('keeps optional caller context inside the error_context namespace', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
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
      });

      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_context).toBeUndefined();
    });

    it('keeps volume-control fields out of the emitted event options', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        buildOptions: {
          excludeMetaMetricsId: true,
          matomoEvent: true,
        },
        volumeControls: {
          samplingRate: 0.5,
          dedupWindowMs: 12_345,
          sessionCap: 7,
          draw: () => 0.5,
          now: () => 1000,
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
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('volume controls', () => {
    it('suppresses events outside the sampling rate', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        volumeControls: {
          samplingRate: 0.5,
          draw: () => 0.75,
        },
      });

      expect(report).not.toHaveBeenCalled();
    });

    it('emits events inside the sampling rate', async () => {
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        volumeControls: {
          samplingRate: 0.5,
          draw: () => 0.25,
        },
      });

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('emits only once for a duplicate signature within the dedup window', async () => {
      let currentTime = 1000;
      const now = () => currentTime;

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        volumeControls: { now },
      });
      currentTime = 2000;
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        volumeControls: { now },
      });

      expect(report).toHaveBeenCalledTimes(1);
    });

    it('emits again for the same signature after the dedup window', async () => {
      let currentTime = 1000;
      const now = () => currentTime;

      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        volumeControls: { now, dedupWindowMs: 5000 },
      });
      currentTime = 1000 + 5000 + 1;
      await trackErrorAsAnalytics(report, new Error('boom'), {
        category: CATEGORY,
        volumeControls: { now, dedupWindowMs: 5000 },
      });

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('treats different error messages as distinct signatures', async () => {
      const currentTime = 1000;
      const now = () => currentTime;

      await trackErrorAsAnalytics(report, new Error('first'), {
        category: CATEGORY,
        volumeControls: { now },
      });
      await trackErrorAsAnalytics(report, new Error('second'), {
        category: CATEGORY,
        volumeControls: { now },
      });

      expect(report).toHaveBeenCalledTimes(2);
    });

    it('suppresses all events once the session cap is reached', async () => {
      const options = {
        category: CATEGORY,
        volumeControls: { sessionCap: 1 },
      };

      await trackErrorAsAnalytics(report, new Error('first'), options);
      await trackErrorAsAnalytics(report, new Error('second'), options);

      expect(report).toHaveBeenCalledTimes(1);
      const event = report.mock.calls[0][0] as AnalyticsEvent;
      expect(event.properties.error_message).toBe('first');
    });
  });
});
