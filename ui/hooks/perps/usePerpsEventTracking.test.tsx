/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { PERPS_EVENT_PROPERTY } from '../../../shared/constants/perps-events';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { PerpsAttributionProvider } from '../../providers/perps/PerpsAttributionContext';
import { usePerpsEventTracking } from './usePerpsEventTracking';

const mockTrackEvent = jest.fn();

jest.mock('../useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

// PerpsAttributionProvider fires fire-and-forget background writes on mount.
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

describe('usePerpsEventTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('imperative API', () => {
    it('calls trackEvent with Perps category and timestamp in properties', () => {
      const { result } = renderHook(() => usePerpsEventTracking());

      result.current.track(MetaMetricsEventName.PerpsScreenViewed, {
        screen_type: 'market_list',
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.PerpsScreenViewed,
        properties: {
          category: MetaMetricsEventCategory.Perps,
          screen_type: 'market_list',
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: expect.any(Number),
        },
        sensitiveProperties: {},
      });
    });
  });

  describe('declarative API', () => {
    it('sends the event once when conditions becomes true', () => {
      const { rerender } = renderHook(
        ({ conditions }: { conditions: boolean }) =>
          usePerpsEventTracking({
            eventName: MetaMetricsEventName.PerpsScreenViewed,
            conditions,
            properties: { screen_type: 'trading' },
          }),
        {
          initialProps: { conditions: false },
        },
      );

      expect(mockTrackEvent).not.toHaveBeenCalled();

      rerender({ conditions: true });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        name: MetaMetricsEventName.PerpsScreenViewed,
        properties: {
          category: MetaMetricsEventCategory.Perps,
          screen_type: 'trading',
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: expect.any(Number),
        },
        sensitiveProperties: {},
      });
    });

    it('does not send the event again on re-renders while conditions stays true', () => {
      const { rerender } = renderHook(
        ({ conditions }: { conditions: boolean }) =>
          usePerpsEventTracking({
            eventName: MetaMetricsEventName.PerpsScreenViewed,
            conditions,
          }),
        {
          initialProps: { conditions: true },
        },
      );

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      rerender({ conditions: true });
      rerender({ conditions: true });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });

    it('fires again after conditions cycles false then true (modal re-open)', () => {
      const { rerender } = renderHook(
        ({ conditions }: { conditions: boolean }) =>
          usePerpsEventTracking({
            eventName: MetaMetricsEventName.PerpsScreenViewed,
            conditions,
          }),
        {
          initialProps: { conditions: true },
        },
      );

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      rerender({ conditions: false });
      rerender({ conditions: true });

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    });

    it('fires again when resetKey changes while conditions stays true', () => {
      const { rerender } = renderHook(
        ({ conditions, resetKey }: { conditions: boolean; resetKey: string }) =>
          usePerpsEventTracking({
            eventName: MetaMetricsEventName.PerpsScreenViewed,
            conditions,
            resetKey,
          }),
        {
          initialProps: { conditions: true, resetKey: 'BTC' },
        },
      );

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);

      act(() => {
        rerender({ conditions: true, resetKey: 'ETH' });
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
    });

    it('does not fire again when resetKey changes while conditions is false', () => {
      const { rerender } = renderHook(
        ({ conditions, resetKey }: { conditions: boolean; resetKey: string }) =>
          usePerpsEventTracking({
            eventName: MetaMetricsEventName.PerpsScreenViewed,
            conditions,
            resetKey,
          }),
        {
          initialProps: { conditions: false, resetKey: 'BTC' },
        },
      );

      expect(mockTrackEvent).not.toHaveBeenCalled();

      act(() => {
        rerender({ conditions: false, resetKey: 'ETH' });
      });

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });

  describe('attribution merge', () => {
    function wrapperWith(locationSearch: string) {
      return function wrapper({ children }: { children: React.ReactNode }) {
        return (
          <PerpsAttributionProvider locationSearch={locationSearch}>
            {children}
          </PerpsAttributionProvider>
        );
      };
    }

    it('merges stored UTM context into PERPS_SCREEN_VIEWED events', () => {
      const { result } = renderHook(() => usePerpsEventTracking(), {
        wrapper: wrapperWith('?utm_source=ads&utm_medium=cpc&utm_campaign=summer'),
      });

      act(() => {
        result.current.track(MetaMetricsEventName.PerpsScreenViewed, {
          [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: 'asset_details',
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsScreenViewed,
          properties: expect.objectContaining({
            [PERPS_EVENT_PROPERTY.UTM_SOURCE]: 'ads',
            [PERPS_EVENT_PROPERTY.UTM_MEDIUM]: 'cpc',
            [PERPS_EVENT_PROPERTY.UTM_CAMPAIGN]: 'summer',
          }),
        }),
      );
    });

    it('does not merge UTM into non-ScreenViewed events', () => {
      const { result } = renderHook(() => usePerpsEventTracking(), {
        wrapper: wrapperWith('?utm_source=ads'),
      });

      act(() => {
        result.current.track(MetaMetricsEventName.PerpsUiInteraction, {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]: 'sort_applied',
        });
      });

      const [builtEvent] = mockTrackEvent.mock.calls[0];
      expect(builtEvent.properties).not.toHaveProperty(
        PERPS_EVENT_PROPERTY.UTM_SOURCE,
      );
    });

    it('includes UTM/deeplink on a screen view emitted on the first render', () => {
      // Regression: attribution must be ready synchronously, because the
      // declarative screen-view effect runs (child-first) before the provider's
      // locationSearch effect — an effect-seeded attribution would miss the
      // entry screen's first emit.
      renderHook(
        () =>
          usePerpsEventTracking({
            eventName: MetaMetricsEventName.PerpsScreenViewed,
            conditions: true,
            properties: {
              [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: 'asset_details',
              [PERPS_EVENT_PROPERTY.SOURCE]: 'market_list',
            },
          }),
        { wrapper: wrapperWith('?utm_source=ads&source=deeplink') },
      );

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            [PERPS_EVENT_PROPERTY.UTM_SOURCE]: 'ads',
            [PERPS_EVENT_PROPERTY.SOURCE]: 'deeplink',
          }),
        }),
      );
    });

    it('overrides the call-site source with deeplink when entered via deeplink', () => {
      const { result } = renderHook(() => usePerpsEventTracking(), {
        wrapper: wrapperWith('?source=deeplink'),
      });

      act(() => {
        result.current.track(MetaMetricsEventName.PerpsScreenViewed, {
          [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: 'asset_details',
          [PERPS_EVENT_PROPERTY.SOURCE]: 'market_list',
        });
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            [PERPS_EVENT_PROPERTY.SOURCE]: 'deeplink',
          }),
        }),
      );
    });
  });
});
