import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { PERPS_EVENT_PROPERTY } from '@metamask/perps-controller';

import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { usePerpsEventTracking } from './usePerpsEventTracking';

jest.mock('@metamask/perps-controller', () => ({
  PERPS_EVENT_PROPERTY: {
    TIMESTAMP: 'perps_timestamp',
    SCREEN_TYPE: 'screen_type',
    INTERACTION_TYPE: 'interaction_type',
    PREVIOUS_SCREEN: 'previous_screen',
    CURRENT_SCREEN: 'current_screen',
    TAB_NAME: 'tab_name',
    ASSET: 'asset',
    BUTTON_CLICKED: 'button_clicked',
    CANDLE_PERIOD: 'candle_period',
    STATUS: 'status',
    FAILURE_REASON: 'failure_reason',
    ORDER_TYPE: 'order_type',
    DIRECTION: 'direction',
    SELECTED_ORDER_TYPE: 'selected_order_type',
    PERCENTAGE_CLOSED: 'percentage_closed',
    ERROR_TYPE: 'error_type',
    ERROR_MESSAGE: 'error_message',
    LEVERAGE: 'leverage',
  },
  PERPS_EVENT_VALUE: {
    SCREEN_TYPE: {
      MARKET_LIST: 'market_list',
      TRADING: 'trading',
      ASSET_DETAILS: 'asset_details',
      ACTIVITY: 'activity',
      TUTORIAL: 'tutorial',
      POSITION_CLOSE: 'position_close',
      ADD_MARGIN: 'add_margin',
      REMOVE_MARGIN: 'remove_margin',
      INCREASE_EXPOSURE: 'increase_exposure',
    },
    INTERACTION_TYPE: {
      ORDER_TYPE_SELECTED: 'order_type_selected',
      TAP: 'tap',
      BUTTON_CLICKED: 'button_clicked',
      LEVERAGE_CHANGED: 'leverage_changed',
      CANDLE_PERIOD_CHANGED: 'candle_period_changed',
      FAVORITE_TOGGLED: 'favorite_toggled',
      SEARCH_CLICKED: 'search_clicked',
      TUTORIAL_STARTED: 'tutorial_started',
      TUTORIAL_COMPLETED: 'tutorial_completed',
      TUTORIAL_NAVIGATION: 'tutorial_navigation',
    },
    BUTTON_CLICKED: {
      DEPOSIT: 'deposit',
      WITHDRAW: 'withdraw',
    },
    DIRECTION: {
      LONG: 'long',
      SHORT: 'short',
    },
    STATUS: {
      FAILED: 'failed',
      SUCCESS: 'success',
    },
    ERROR_TYPE: {
      BACKEND: 'backend',
    },
  },
}));

const mockTrackEvent = jest.fn().mockResolvedValue(undefined);

const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn().mockResolvedValue(undefined),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

const wrapper = ({ children }: { children: React.ReactNode }) =>
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

    it('does not send the event again when conditions toggles after the first fire', () => {
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

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });
  });
});
