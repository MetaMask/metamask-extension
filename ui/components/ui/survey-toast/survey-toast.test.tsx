import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act } from 'react-dom/test-utils';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SurveyToast } from './survey-toast';

jest.mock('../../../../shared/lib/fetch-with-cache', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockFetchWithCache = fetchWithCache as jest.Mock;
const mockTrackEvent = jest.fn();
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

const validSrpSessionData = {
  ENTROPY_SOURCE_ID: {
    token: {
      accessToken: 'mock-access-token',
    },
  },
};

const createStore = (
  options: {
    metametricsEnabled?: boolean;
    srpSessionData?: typeof validSrpSessionData;
  } = { metametricsEnabled: true, srpSessionData: validSrpSessionData },
) =>
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
      srpSessionData: options.srpSessionData,
    },
  });

const renderComponent = (
  options: {
    metametricsEnabled?: boolean;
    srpSessionData?: typeof validSrpSessionData;
  } = { metametricsEnabled: true, srpSessionData: validSrpSessionData },
) =>
  renderWithProvider(
    <MetaMetricsContext.Provider value={mockTrackEvent}>
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

  it('should match snapshot', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    let container;
    await act(async () => {
      const result = renderComponent();
      container = result.container;
    });

    expect(container).toMatchSnapshot();
  });

  it('renders nothing if no survey is available', () => {
    mockFetchWithCache.mockResolvedValue({ surveys: [] });
    renderComponent();
    expect(screen.queryByTestId('survey-toast')).toBeNull();
  });

  it('renders nothing if the survey is stale', () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.stale });
    renderComponent();
    expect(screen.queryByTestId('survey-toast')).toBeNull();
  });

  it('renders the survey toast when a valid survey is available', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByTestId('survey-toast')).toBeInTheDocument();
      expect(
        screen.getByText(surveyData.valid.description),
      ).toBeInTheDocument();
      expect(screen.getByText(surveyData.valid.cta)).toBeInTheDocument();
    });
  });

  it('handles action click correctly when metametrics is enabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('survey-toast')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(surveyData.valid.cta));

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

  it('should not show the toast if metametrics is disabled', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    renderComponent({
      metametricsEnabled: false,
    });

    await waitFor(() => {
      expect(screen.queryByTestId('survey-toast')).toBeNull();
    });
  });

  it('should fetch survey data with the correct headers', async () => {
    mockFetchWithCache.mockResolvedValue({ surveys: surveyData.valid });

    await act(async () => {
      renderComponent();
    });

    expect(mockFetchWithCache).toHaveBeenCalledWith({
      cacheOptions: expect.any(Object),
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${validSrpSessionData.ENTROPY_SOURCE_ID.token.accessToken}`,
          'x-metamask-clientproduct': 'metamask-extension',
        },
        method: 'GET',
        signal: expect.any(AbortSignal),
      },
      functionName: 'fetchSurveys',
      url: 'https://accounts.api.cx.metamask.io/v1/users/0x123/surveys',
    });

    await act(async () => {
      renderComponent({
        metametricsEnabled: true,
        srpSessionData: undefined,
      });
    });

    expect(mockFetchWithCache).toHaveBeenCalledWith({
      cacheOptions: expect.any(Object),
      fetchOptions: {
        headers: {
          'x-metamask-clientproduct': 'metamask-extension',
        },
        method: 'GET',
        signal: expect.any(AbortSignal),
      },
      functionName: 'fetchSurveys',
      url: 'https://accounts.api.cx.metamask.io/v1/users/0x123/surveys',
    });
  });
});
