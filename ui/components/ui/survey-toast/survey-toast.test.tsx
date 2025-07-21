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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
});
