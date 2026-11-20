import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { trackAnalyticsEvent, trackErrorAsAnalytics } from '../store/actions';
import { useAnalytics } from './useAnalytics';

jest.mock('./useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({})),
}));

jest.mock('../store/actions', () => ({
  trackAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
  trackErrorAsAnalytics: jest.fn().mockResolvedValue(undefined),
}));

const mockStore = configureMockStore([]);

const renderHookConsumer = ({
  eventName,
  state,
  onTrack,
}: {
  eventName: MetaMetricsEventName;
  state: {
    metamask: {
      analyticsId: string | null;
      consentDecisionMade: boolean;
      optedIn: boolean;
    };
  };
  onTrack?: (trackEventPromise: Promise<void>) => void;
}) => {
  const store = mockStore(state);

  const TestComponent = () => {
    const { trackEvent, createEventBuilder } = useAnalytics();

    useEffect(() => {
      const trackEventPromise = trackEvent(
        createEventBuilder(eventName)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .build(),
      );
      onTrack?.(trackEventPromise);
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
  const mockedTrackErrorAsAnalytics = jest.mocked(trackErrorAsAnalytics);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackErrorAsAnalytics', () => {
    const deletionError = new Error('Deletion failed');
    const errorOptions = {
      source: 'clear-metametrics-data',
      excludeMetaMetricsId: true,
    };

    const renderTrackError = ({
      state,
      onTrack,
    }: {
      state: {
        metamask: {
          analyticsId: string | null;
          consentDecisionMade: boolean;
          optedIn: boolean;
        };
      };
      onTrack?: (trackErrorPromise: Promise<void>) => void;
    }) => {
      const store = mockStore(state);

      const TestComponent = () => {
        const { trackErrorAsAnalytics: trackError } = useAnalytics();

        useEffect(() => {
          onTrack?.(trackError(deletionError, errorOptions));
        }, [trackError]);

        return null;
      };

      return render(
        <Provider store={store}>
          <TestComponent />
        </Provider>,
      );
    };

    it('forwards errors when participation is enabled and analyticsId exists', async () => {
      const onTrack = jest.fn();

      renderTrackError({
        state: {
          metamask: {
            analyticsId: '0x123',
            consentDecisionMade: true,
            optedIn: true,
          },
        },
        onTrack,
      });

      await waitFor(() => {
        expect(mockedTrackErrorAsAnalytics).toHaveBeenCalledWith(
          deletionError,
          {
            ...errorOptions,
            environmentType: expect.any(String),
          },
          undefined,
        );
      });
      await expect(onTrack.mock.calls[0][0]).resolves.toBeUndefined();
    });

    it('does not forward errors when the user has opted out', async () => {
      const onTrack = jest.fn();

      renderTrackError({
        state: {
          metamask: {
            analyticsId: '0x123',
            consentDecisionMade: true,
            optedIn: false,
          },
        },
        onTrack,
      });

      await waitFor(() => {
        expect(onTrack).toHaveBeenCalled();
      });
      expect(mockedTrackErrorAsAnalytics).not.toHaveBeenCalled();
      await expect(onTrack.mock.calls[0][0]).resolves.toBeUndefined();
    });

    it('forwards errors when consent is still undecided', async () => {
      const onTrack = jest.fn();

      renderTrackError({
        state: {
          metamask: {
            analyticsId: null,
            consentDecisionMade: false,
            optedIn: false,
          },
        },
        onTrack,
      });

      await waitFor(() => {
        expect(mockedTrackErrorAsAnalytics).toHaveBeenCalledWith(
          deletionError,
          {
            ...errorOptions,
            environmentType: expect.any(String),
          },
          undefined,
        );
      });
      await expect(onTrack.mock.calls[0][0]).resolves.toBeUndefined();
    });

    it('forwards errors when participation is enabled but analyticsId is missing', async () => {
      const onTrack = jest.fn();

      renderTrackError({
        state: {
          metamask: {
            analyticsId: null,
            consentDecisionMade: true,
            optedIn: true,
          },
        },
        onTrack,
      });

      await waitFor(() => {
        expect(mockedTrackErrorAsAnalytics).toHaveBeenCalledWith(
          deletionError,
          {
            ...errorOptions,
            environmentType: expect.any(String),
          },
          undefined,
        );
      });
      await expect(onTrack.mock.calls[0][0]).resolves.toBeUndefined();
    });
  });

  describe('trackEvent', () => {
    it('queues events when participation is enabled but analyticsId is missing', async () => {
      const onTrack = jest.fn();

      renderHookConsumer({
        eventName: MetaMetricsEventName.AnalyticsPreferenceSelected,
        state: {
          metamask: {
            analyticsId: null,
            consentDecisionMade: true,
            optedIn: true,
          },
        },
        onTrack,
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

      await expect(onTrack.mock.calls[0][0]).resolves.toBeUndefined();
    });

    it('tracks events immediately when participation is enabled and analyticsId exists', async () => {
      const onTrack = jest.fn();

      renderHookConsumer({
        eventName: MetaMetricsEventName.AnalyticsPreferenceSelected,
        state: {
          metamask: {
            analyticsId: '0x123',
            consentDecisionMade: true,
            optedIn: true,
          },
        },
        onTrack,
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

      await expect(onTrack.mock.calls[0][0]).resolves.toBeUndefined();
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
      const onTrack = jest.fn();

      renderHookConsumer({
        eventName: MetaMetricsEventName.AnalyticsPreferenceSelected,
        state: {
          metamask: {
            analyticsId: '0x123',
            consentDecisionMade: true,
            optedIn: true,
          },
        },
        onTrack,
      });

      await waitFor(() => {
        expect(mockedTrackAnalyticsEvent).toHaveBeenCalled();
      });
      await expect(onTrack.mock.calls[0][0]).resolves.toBeUndefined();
    });
  });
});
