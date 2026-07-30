import React, { useContext, useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../shared/constants/metametrics';
import { captureMessage } from '../../shared/lib/sentry';
import { submitRequestToBackground } from '../store/background-connection';
import { trackAnalyticsEvent, trackMetaMetricsPage } from '../store/actions';
import {
  MetaMetricsContext,
  MetaMetricsProvider,
  resetPreviousTrackedPagePathForTesting,
} from './metametrics';

jest.mock('../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('../hooks/useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({})),
}));

jest.mock('../store/actions', () => ({
  trackAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
  trackMetaMetricsPage: jest.fn(),
}));

jest.mock('../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockStore = configureMockStore([]);

const renderProviderAtPath = (pathname: string) => {
  const store = mockStore({
    metamask: {
      analyticsId: '0x123',
      completedMetaMetricsOnboarding: true,
      optedIn: true,
    },
  });

  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <MetaMetricsProvider>
            <div />
          </MetaMetricsProvider>
        ),
      },
    ],
    { initialEntries: [pathname] },
  );

  return render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
};

const renderProvider = ({
  event,
  state,
}: {
  event: MetaMetricsEventName;
  state: {
    metamask: {
      analyticsId: string | null;
      completedMetaMetricsOnboarding: boolean;
      optedIn: boolean;
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
    }, [trackEvent]);

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
  const mockedTrackAnalyticsEvent = jest.mocked(trackAnalyticsEvent);
  const mockedSubmitRequestToBackground = jest.mocked(
    submitRequestToBackground,
  );
  const mockedTrackMetaMetricsPage = jest.mocked(trackMetaMetricsPage);
  const mockedCaptureMessage = jest.mocked(captureMessage);

  beforeEach(() => {
    jest.clearAllMocks();
    resetPreviousTrackedPagePathForTesting();
  });

  it('buffers events when participation is enabled but analyticsId is missing', async () => {
    renderProvider({
      event: MetaMetricsEventName.AnalyticsPreferenceSelected,
      state: {
        metamask: {
          analyticsId: null,
          completedMetaMetricsOnboarding: true,
          optedIn: true,
        },
      },
    });

    await waitFor(() => {
      expect(mockedSubmitRequestToBackground).toHaveBeenCalledWith(
        'addEventBeforeMetricsOptIn',
        [
          expect.objectContaining({
            category: MetaMetricsEventCategory.Onboarding,
            event: MetaMetricsEventName.AnalyticsPreferenceSelected,
          }),
        ],
      );
    });

    expect(mockedTrackAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('tracks events immediately when participation is enabled and analyticsId exists', async () => {
    renderProvider({
      event: MetaMetricsEventName.AnalyticsPreferenceSelected,
      state: {
        metamask: {
          analyticsId: '0x123',
          completedMetaMetricsOnboarding: true,
          optedIn: true,
        },
      },
    });

    await waitFor(() => {
      expect(mockedTrackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.AnalyticsPreferenceSelected,
          properties: expect.objectContaining({
            category: MetaMetricsEventCategory.Onboarding,
          }),
        }),
        expect.anything(),
      );
    });

    expect(mockedSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('tracks metrics opt out immediately without an analyticsId', async () => {
    renderProvider({
      event: MetaMetricsEventName.MetricsOptOut,
      state: {
        metamask: {
          analyticsId: null,
          completedMetaMetricsOnboarding: true,
          optedIn: false,
        },
      },
    });

    await waitFor(() => {
      expect(mockedTrackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.MetricsOptOut,
          properties: expect.objectContaining({
            category: MetaMetricsEventCategory.Onboarding,
          }),
        }),
        expect.anything(),
      );
    });

    expect(mockedSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('does not buffer normal events when the user has opted out of MetaMetrics', async () => {
    renderProvider({
      event: MetaMetricsEventName.AnalyticsPreferenceSelected,
      state: {
        metamask: {
          analyticsId: '0x123',
          completedMetaMetricsOnboarding: true,
          optedIn: false,
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedTrackAnalyticsEvent).not.toHaveBeenCalled();
    expect(mockedSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('tracks page views only once across provider remounts', async () => {
    const store = mockStore({
      metamask: {
        analyticsId: '0x123',
        completedMetaMetricsOnboarding: true,
        optedIn: true,
      },
    });

    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <MetaMetricsProvider>
              <div data-testid="child" />
            </MetaMetricsProvider>
          ),
        },
      ],
      { initialEntries: ['/'] },
    );

    const { unmount } = render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockedTrackMetaMetricsPage).toHaveBeenCalledTimes(1);
    });

    unmount();

    render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>,
    );

    await waitFor(() => {
      expect(mockedTrackMetaMetricsPage).toHaveBeenCalledTimes(1);
    });
  });

  describe('page route matching', () => {
    it('reports unmatched routes to Sentry', async () => {
      renderProviderAtPath('/definitely-not-a-real-route');

      await waitFor(() => {
        expect(mockedCaptureMessage).toHaveBeenCalledWith(
          'Segment page tracking found unmatched route',
          expect.objectContaining({
            extra: expect.objectContaining({
              currentPath: '/definitely-not-a-real-route',
            }),
          }),
        );
      });

      expect(mockedTrackMetaMetricsPage).not.toHaveBeenCalled();
    });

    it('does not report known untracked routes to Sentry', async () => {
      renderProviderAtPath('/onboarding');

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockedCaptureMessage).not.toHaveBeenCalled();
      expect(mockedTrackMetaMetricsPage).not.toHaveBeenCalled();
    });

    it('tracks page views only for analytics-tracked routes', async () => {
      renderProviderAtPath('/');

      await waitFor(() => {
        expect(mockedTrackMetaMetricsPage).toHaveBeenCalledTimes(1);
      });

      expect(mockedCaptureMessage).not.toHaveBeenCalled();
    });
  });
});
