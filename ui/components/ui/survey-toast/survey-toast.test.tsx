import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act } from 'react-dom/test-utils';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { toast } from '../toast/toast';
import { SurveyToast } from './survey-toast';

const mockTrackEvent = jest.fn();

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

jest.mock('../toast/toast', () => {
  const actual =
    jest.requireActual<typeof import('../toast/toast')>('../toast/toast');

  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: jest.fn(),
      dismiss: jest.fn(),
    },
  };
});

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

const createStore = (
  options: { metametricsEnabled?: boolean; isUnlocked?: boolean } = {},
) =>
  mockStore({
    user: { basicFunctionality: true },
    metamask: {
      lastViewedUserSurvey: 2,
      useExternalServices: true,
      consentDecisionMade: true,
      optedIn: options.metametricsEnabled ?? true,
      isUnlocked: options.isUnlocked ?? true,
      analyticsId: '0x123',
      internalAccounts: {
        selectedAccount: '0x123',
        accounts: { '0x123': { address: '0x123' } },
      },
    },
  });

const renderComponent = (
  options: { metametricsEnabled?: boolean; isUnlocked?: boolean } = {},
) => renderWithProvider(<SurveyToast />, createStore(options));

describe('SurveyToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent.mockClear();
    jest.restoreAllMocks();

    // @ts-expect-error mocking platform
    global.platform = {
      openTab: jest.fn(),
      closeCurrentWindow: jest.fn(),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should match snapshot', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            title: surveyData.valid.description,
            dataTestId: 'survey-toast',
          }),
        }),
        expect.objectContaining({
          id: 'survey-toast',
          icon: expect.anything(),
        }),
      );
    });
  });

  it('renders nothing if no survey is available', () => {
    mockFetchWithCache.mockResolvedValue({ surveys: [] });
    renderComponent();

    return waitFor(() => {
      expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });

  it('renders nothing if the survey is stale', () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.stale });
    renderComponent();

    return waitFor(() => {
      expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });

  it('renders the survey toast when a valid survey is available', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalled();
    });
  });

  it('handles action click correctly when metametrics is enabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent();

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledTimes(1);
    });

    const toastElement = jest.mocked(toast.success).mock.calls[0][0];
    render(toastElement as React.ReactElement);

    fireEvent.click(screen.getByText(surveyData.valid.cta));

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

  it('should not show the toast if metametrics is disabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent({
      metametricsEnabled: false,
    });

    await waitFor(() => {
      expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
    });
  });

  it('does not fetch surveys while the wallet is locked', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    await act(async () => {
      renderComponent({ isUnlocked: false });
    });

    expect(mockFetchWithCache).not.toHaveBeenCalled();
    expect(jest.mocked(toast.success)).not.toHaveBeenCalled();
  });
});
