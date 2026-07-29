import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { trackAnalyticsEvent } from '../store/actions';
import { useAnalytics } from './useAnalytics';

jest.mock('./useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({})),
}));

jest.mock('../store/actions', () => ({
  trackAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockStore = configureMockStore([]);

const renderHookConsumer = ({
  eventName,
  state,
}: {
  eventName: MetaMetricsEventName;
  state: {
    metamask: {
      analyticsId: string | null;
      consentDecisionMade: boolean;
      optedIn: boolean;
    };
  };
}) => {
  const store = mockStore(state);

  const TestComponent = () => {
    const { trackEvent, createEventBuilder } = useAnalytics();

    useEffect(() => {
      trackEvent(
        createEventBuilder(eventName)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .build(),
      );
    }, [createEventBuilder, trackEvent]);

    return null;
  };

  return render(
    <Provider store={store}>
      <TestComponent />
    </Provider>,
  );
};

describe('useAnalytics', () => {
  const mockedTrackAnalyticsEvent = jest.mocked(trackAnalyticsEvent);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('queues events when participation is enabled but analyticsId is missing', async () => {
      renderHookConsumer({
        eventName: MetaMetricsEventName.AnalyticsPreferenceSelected,
        state: {
          metamask: {
            analyticsId: null,
            consentDecisionMade: true,
            optedIn: true,
          },
        },
      });

      await waitFor(() => {
        expect(mockedTrackAnalyticsEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.AnalyticsPreferenceSelected,
            properties: {
              category: MetaMetricsEventCategory.Onboarding,
            },
          }),
          expect.objectContaining({
            environmentType: expect.any(String),
          }),
        );
      });
    });

    it('tracks events immediately when participation is enabled and analyticsId exists', async () => {
      renderHookConsumer({
        eventName: MetaMetricsEventName.AnalyticsPreferenceSelected,
        state: {
          metamask: {
            analyticsId: '0x123',
            consentDecisionMade: true,
            optedIn: true,
          },
        },
      });

      await waitFor(() => {
        expect(mockedTrackAnalyticsEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.AnalyticsPreferenceSelected,
            properties: {
              category: MetaMetricsEventCategory.Onboarding,
            },
          }),
          expect.objectContaining({
            environmentType: expect.any(String),
          }),
        );
      });
    });

    it('tracks metrics opt out immediately', async () => {
      renderHookConsumer({
        eventName: MetaMetricsEventName.MetricsOptOut,
        state: {
          metamask: {
            analyticsId: null,
            consentDecisionMade: true,
            optedIn: false,
          },
        },
      });

      await waitFor(() => {
        expect(mockedTrackAnalyticsEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: MetaMetricsEventName.MetricsOptOut,
          }),
          expect.objectContaining({
            environmentType: expect.any(String),
          }),
        );
      });
    });

    it('swallows background RPC failures when tracking immediately', async () => {
      mockedTrackAnalyticsEvent.mockRejectedValueOnce(
        new Error('background unavailable'),
      );

      expect(() =>
        renderHookConsumer({
          eventName: MetaMetricsEventName.AnalyticsPreferenceSelected,
          state: {
            metamask: {
              analyticsId: '0x123',
              consentDecisionMade: true,
              optedIn: true,
            },
          },
        }),
      ).not.toThrow();

      await waitFor(() => {
        expect(mockedTrackAnalyticsEvent).toHaveBeenCalled();
      });
    });
  });
});
