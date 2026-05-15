import React, { useContext, useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { submitRequestToBackground } from '../store/background-connection';
import { trackMetaMetricsEvent } from '../store/actions';
import { MetaMetricsContext, MetaMetricsProvider } from './metametrics';

jest.mock('../hooks/useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({})),
}));

jest.mock('../store/actions', () => ({
  trackMetaMetricsEvent: jest.fn(),
  trackMetaMetricsPage: jest.fn(),
}));

jest.mock('../store/background-connection', () => ({
  generateActionId: jest.fn(() => 'test-action-id'),
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockStore = configureMockStore([]);

const renderProvider = ({
  event,
  state,
}: {
  event: MetaMetricsEventName;
  state: {
    metamask: {
      participateInMetaMetrics: boolean | null;
      metaMetricsId: string | null;
    };
  };
}) => {
  const store = mockStore(state);

  const TestComponent = () => {
    const { trackEvent } = useContext(MetaMetricsContext);

    useEffect(() => {
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event,
      });
    }, [event, trackEvent]);

    return null;
  };

  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <MetaMetricsProvider>
            <TestComponent />
          </MetaMetricsProvider>
        ),
      },
    ],
    { initialEntries: ['/onboarding/metametrics'] },
  );

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
};

describe('MetaMetricsProvider', () => {
  const mockedTrackMetaMetricsEvent = jest.mocked(trackMetaMetricsEvent);
  const mockedSubmitRequestToBackground = jest.mocked(
    submitRequestToBackground,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('buffers events when participation is enabled but metaMetricsId is missing', async () => {
    renderProvider({
      event: MetaMetricsEventName.AnalyticsPreferenceSelected,
      state: {
        metamask: {
          participateInMetaMetrics: true,
          metaMetricsId: null,
        },
      },
    });

    await waitFor(() => {
      expect(mockedSubmitRequestToBackground).toHaveBeenCalledWith(
        'addEventBeforeMetricsOptIn',
        [
          expect.objectContaining({
            actionId: 'test-action-id',
            category: MetaMetricsEventCategory.Onboarding,
            event: MetaMetricsEventName.AnalyticsPreferenceSelected,
          }),
        ],
      );
    });

    expect(mockedTrackMetaMetricsEvent).not.toHaveBeenCalled();
  });

  it('tracks events immediately when participation is enabled and metaMetricsId exists', async () => {
    renderProvider({
      event: MetaMetricsEventName.AnalyticsPreferenceSelected,
      state: {
        metamask: {
          participateInMetaMetrics: true,
          metaMetricsId: '0x123',
        },
      },
    });

    await waitFor(() => {
      expect(mockedTrackMetaMetricsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        }),
        undefined,
      );
    });

    expect(mockedSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('tracks metrics opt out immediately without a metaMetricsId', async () => {
    renderProvider({
      event: MetaMetricsEventName.MetricsOptOut,
      state: {
        metamask: {
          participateInMetaMetrics: false,
          metaMetricsId: null,
        },
      },
    });

    await waitFor(() => {
      expect(mockedTrackMetaMetricsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.MetricsOptOut,
        }),
        undefined,
      );
    });

    expect(mockedSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('does not buffer normal events when the user has opted out of MetaMetrics', async () => {
    renderProvider({
      event: MetaMetricsEventName.AnalyticsPreferenceSelected,
      state: {
        metamask: {
          participateInMetaMetrics: false,
          metaMetricsId: '0x123',
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedTrackMetaMetricsEvent).not.toHaveBeenCalled();
    expect(mockedSubmitRequestToBackground).not.toHaveBeenCalled();
  });
});
