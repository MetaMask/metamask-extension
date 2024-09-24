import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { SurveyToast } from './survey-toast';

jest.mock('../../../../shared/lib/fetch-with-cache', () => ({
  __esModule: true,
  default: jest.fn(),
}));

window.open = jest.fn();

const mockFetchWithCache = fetchWithCache as jest.Mock;
const mockStore = configureStore([thunk]);

const initialState = {
  metametrics: {
    participateInMetaMetrics: true,
  },
  user: {
    basicFunctionality: true,
  },
  metamask: {
    lastViewedUserSurvey: 0,
    useExternalServices: true,
    internalAccounts: {
      selectedAccount: '0x123',
      accounts: { '0x123': { address: '0x123' } },
    },
  },
};

const store = mockStore(initialState);
const mockTrackEvent = jest.fn();

const renderComponent = () =>
  render(
    <Provider store={store}>
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <SurveyToast />
      </MetaMetricsContext.Provider>
    </Provider>,
  );

describe('SurveyToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should match snapshot', () => {
    const { container } = renderComponent();
    expect(container).toMatchSnapshot();
  });

  it('renders nothing if no survey is available', () => {
    mockFetchWithCache.mockResolvedValue({ surveys: [] });
    renderComponent();
    expect(screen.queryByTestId('survey-toast')).toBeNull();
  });

  it('renders the survey toast if a survey is available', async () => {
    const survey = {
      url: 'https://example.com',
      description: 'Test Survey',
      cta: 'Take Survey',
      surveyId: 1,
    };
    mockFetchWithCache.mockResolvedValue({ surveys: [survey] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('survey-toast')).toBeInTheDocument();
      expect(screen.getByText('Test Survey')).toBeInTheDocument();
      expect(screen.getByText('Take Survey')).toBeInTheDocument();
    });
  });

  it('handles action click correctly', async () => {
    const survey = {
      url: 'https://example.com',
      description: 'Test Survey',
      cta: 'Take Survey',
      surveyId: 1,
    };
    mockFetchWithCache.mockResolvedValue({ surveys: [survey] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('survey-toast')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Take Survey'));

    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
  });
});
