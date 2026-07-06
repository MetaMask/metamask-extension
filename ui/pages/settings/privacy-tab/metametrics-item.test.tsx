import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { MetametricsToggleItem } from './metametrics-item';

const mockTrackAnalyticsEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackAnalyticsEvent,
      createEventBuilder,
    }),
  };
});

const mockEnableMetametrics = jest.fn().mockResolvedValue(undefined);
const mockDisableMetametrics = jest.fn().mockResolvedValue(undefined);
const mockSetDataCollectionForMarketing = jest.fn();

jest.mock('../../../hooks/useMetametrics', () => ({
  useEnableMetametrics: () => ({
    enableMetametrics: mockEnableMetametrics,
    error: null,
  }),
  useDisableMetametrics: () => ({
    disableMetametrics: mockDisableMetametrics,
    error: null,
  }),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setDataCollectionForMarketing: (val: boolean) => {
    mockSetDataCollectionForMarketing(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

const createMockStore = (overrides = {}) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices: true,
      completedMetaMetricsOnboarding: true,
      optedIn: false,
      dataCollectionForMarketing: false,
      ...overrides,
    },
  });

describe('MetametricsToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    const mockStore = createMockStore();
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    expect(
      screen.getByText(messages.participateInMetaMetrics.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    const mockStore = createMockStore();
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    expect(
      screen.getByText(messages.participateInMetaMetricsDescription.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const mockStore = createMockStore({ optedIn: true });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    expect(
      screen.getByTestId('participate-in-meta-metrics-input'),
    ).toHaveAttribute('value', 'true');
  });

  it('renders toggle in disabled state', () => {
    const mockStore = createMockStore({ optedIn: false });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    expect(
      screen.getByTestId('participate-in-meta-metrics-input'),
    ).toHaveAttribute('value', 'false');
  });

  it('calls enableMetametrics when toggled on', async () => {
    const mockStore = createMockStore({ optedIn: false });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('participate-in-meta-metrics-input'));

    await waitFor(() => {
      expect(mockEnableMetametrics).toHaveBeenCalled();
    });
  });

  it('calls disableMetametrics when toggled off', async () => {
    const mockStore = createMockStore({ optedIn: true });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('participate-in-meta-metrics-input'));

    await waitFor(() => {
      expect(mockDisableMetametrics).toHaveBeenCalled();
    });
  });

  it('disables data collection for marketing when turning off metametrics', async () => {
    const mockStore = createMockStore({
      optedIn: true,
      dataCollectionForMarketing: true,
    });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('participate-in-meta-metrics-input'));

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
  });

  it('is disabled when useExternalServices is false', () => {
    const mockStore = createMockStore({ useExternalServices: false });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    const toggle = screen.getByTestId('participate-in-meta-metrics-input');
    expect(toggle.closest('.toggle-button--disabled')).toBeInTheDocument();
  });

  it('fires TurnOffMetaMetrics event when toggled off', async () => {
    const mockStore = createMockStore({ optedIn: true });

    renderWithProvider(<MetametricsToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('participate-in-meta-metrics-input'));

    await waitFor(() => {
      expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.TurnOffMetaMetrics,
        }),
      );
    });
  });
});
