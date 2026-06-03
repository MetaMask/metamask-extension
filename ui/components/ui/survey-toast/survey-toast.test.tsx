import React from 'react';
import { waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { toast } from '@metamask/design-system-react';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SurveyToast } from './survey-toast';

jest.mock('../../../../shared/lib/fetch-with-cache', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@metamask/design-system-react', () => {
  const actual = jest.requireActual('@metamask/design-system-react');
  const mockToast = jest.fn();
  mockToast.dismiss = jest.fn();
  return {
    ...actual,
    toast: mockToast,
  };
});

const mockFetchWithCache = fetchWithCache as jest.Mock;
const mockToast = toast as jest.MockedFunction<typeof toast> & {
  dismiss: jest.Mock;
};
const mockTrackEvent = jest.fn();
const mockMetaMetricsContext = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};
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
      participateInMetaMetrics: options.metametricsEnabled,
      metaMetricsId: '0x123',
      internalAccounts: {
        selectedAccount: '0x123',
        accounts: { '0x123': { address: '0x123' } },
      },
    },
  });

const renderComponent = (options = { metametricsEnabled: true }) =>
  renderWithProvider(
    <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
      <SurveyToast />
    </MetaMetricsContext.Provider>,
    createStore(options),
  );

describe('SurveyToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('dispatches a toast for a valid survey', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent();

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'default',
        title: surveyData.valid.description,
        description: undefined,
        actionButtonLabel: surveyData.valid.cta,
        'data-testid': 'survey-toast',
      }),
    );
  });

  it('does not dispatch a toast when no survey is available', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: [] });

    renderComponent();

    await waitFor(() => expect(mockFetchWithCache).toHaveBeenCalled());

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('does not dispatch a toast when the survey is stale', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.stale });

    renderComponent();

    await waitFor(() => expect(mockFetchWithCache).toHaveBeenCalled());

    expect(mockToast).not.toHaveBeenCalled();
  });

  it('handles action click correctly when metametrics is enabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent();

    await waitFor(() => expect(mockToast).toHaveBeenCalled());

    const toastOptions = mockToast.mock.calls[0]?.[0] as {
      actionButtonOnClick?: () => void;
    };

    toastOptions.actionButtonOnClick?.();

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: surveyData.valid.url,
    });
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: MetaMetricsEventName.SurveyToast,
      category: MetaMetricsEventCategory.Feedback,
      properties: {
        response: 'accept',
        survey: surveyData.valid.id,
      },
    });
  });

  it('does not dispatch a toast if metametrics is disabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent({
      metametricsEnabled: false,
    });

    expect(mockToast).not.toHaveBeenCalled();
  });
});
