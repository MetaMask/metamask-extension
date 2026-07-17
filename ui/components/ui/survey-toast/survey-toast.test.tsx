import React from 'react';
import { act, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { SurveyToast } from './survey-toast';

const mockTrackEvent = jest.fn();
const mockToastDismiss = jest.fn();
const mockToast = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../../shared/lib/fetch-with-cache', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../toast/toast', () => ({
  toast: Object.assign((...args: unknown[]) => mockToast(...args), {
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
  }),
  ToastContent: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  useToasterStore: jest.fn(() => ({ toasts: [] })),
}));

const mockFetchWithCache = fetchWithCache as jest.Mock;
const mockStore = configureStore([thunk]);

const surveyData = {
  valid: {
    url: 'https://example.com',
    description: 'Test Survey',
    cta: 'Take Survey',
    id: 3,
  },
  stale: {
    url: 'https://example.com',
    description: 'Test Survey',
    cta: 'Take Survey',
    id: 1,
  },
};

const createStore = (options = { metametricsEnabled: true }) =>
  mockStore({
    user: { basicFunctionality: true },
    metamask: {
      lastViewedUserSurvey: 2,
      useExternalServices: true,
      completedMetaMetricsOnboarding: true,
      optedIn: options.metametricsEnabled,
      analyticsId: '0x123',
      internalAccounts: {
        selectedAccount: '0x123',
        accounts: { '0x123': { address: '0x123' } },
      },
    },
  });

const renderComponent = (options = { metametricsEnabled: true }) =>
  renderWithProvider(<SurveyToast />, createStore(options));

describe('SurveyToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent.mockClear();

    // @ts-expect-error mocking platform
    global.platform = {
      openTab: jest.fn(),
      closeCurrentWindow: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not show toast if no survey is available', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: [] });

    renderComponent();

    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
      expect(mockToastDismiss).toHaveBeenCalledWith('survey-toast');
    });
  });

  it('does not show toast if the survey is stale', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.stale });

    renderComponent();

    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
      expect(mockToastDismiss).toHaveBeenCalledWith('survey-toast');
    });
  });

  it('shows the survey toast when a valid survey is available', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            dataTestId: 'survey-toast',
            title: surveyData.valid.description,
            actionText: surveyData.valid.cta,
          }),
        }),
        {
          id: 'survey-toast',
          duration: Infinity,
        },
      );
    });
  });

  it('handles action click correctly when metametrics is enabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });

    const toastContentElement = mockToast.mock
      .calls[0][0] as React.ReactElement<{
      onActionClick?: () => void;
    }>;
    toastContentElement.props.onActionClick?.();

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: surveyData.valid.url,
    });
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.SurveyToast,
        properties: expect.objectContaining({
          category: MetaMetricsEventCategory.Feedback,
          response: 'accept',
          survey: surveyData.valid.id,
        }),
      }),
    );
  });

  it('does not show the toast if metametrics is disabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent({
      metametricsEnabled: false,
    });

    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
      expect(mockFetchWithCache).not.toHaveBeenCalled();
    });
  });
});
