/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { PERPS_EVENT_PROPERTY } from '../../../shared/constants/perps-events';

import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { usePerpsEventTracking } from './usePerpsEventTracking';

const mockTrackEvent = jest.fn().mockResolvedValue(undefined);

const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn().mockResolvedValue(undefined),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

const wrapper = ({
  children,
}: React.PropsWithChildren<{ conditions?: boolean }>) =>
  React.createElement(
    MetaMetricsContext.Provider,
    { value: mockMetaMetricsContext },
    children,
  );

describe('usePerpsEventTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('imperative API', () => {
    it('calls trackEvent with Perps category and timestamp in properties', () => {
      const { result } = renderHook(() => usePerpsEventTracking(), { wrapper });

      result.current.track(MetaMetricsEventName.PerpsScreenViewed, {
        screen_type: 'market_list',
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PerpsScreenViewed,
        category: MetaMetricsEventCategory.Perps,
        properties: {
          screen_type: 'market_list',
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: expect.any(Number),
        },
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
          wrapper,
          initialProps: { conditions: false },
        },
      );

      expect(mockTrackEvent).not.toHaveBeenCalled();

      rerender({ conditions: true });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: MetaMetricsEventName.PerpsScreenViewed,
        category: MetaMetricsEventCategory.Perps,
        properties: {
          screen_type: 'trading',
          [PERPS_EVENT_PROPERTY.TIMESTAMP]: expect.any(Number),
        },
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
          wrapper,
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
          wrapper,
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
          wrapper,
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
          wrapper,
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
});
