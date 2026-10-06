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
const mockUpdatePreferencesSection = jest.fn();
const mockRefetchPreferences = jest.fn();
const mockEnsurePreferences = jest.fn();
const mockListNotifications = jest.fn();
let mockMarketingPreferences = {
  pushNotificationsEnabled: false,
  inAppNotificationsEnabled: false,
};

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
  setDataCollectionForMarketing: (val: boolean, options?: unknown) => {
    if (options === undefined) {
      mockSetDataCollectionForMarketing(val);
    } else {
      mockSetDataCollectionForMarketing(val, options);
    }
    return () => Promise.resolve();
  },
}));

jest.mock(
  '../../../hooks/metamask-notifications/useNotificationPreferences',
  () => ({
    useNotificationPreferences: () => ({
      ensurePreferences: mockEnsurePreferences,
      refetchPreferences: mockRefetchPreferences,
      updatePreferencesSection: mockUpdatePreferencesSection,
    }),
  }),
);

jest.mock(
  '../../../contexts/metamask-notifications/metamask-notifications',
  () => ({
    useMetamaskNotificationsContext: () => ({
      listNotifications: mockListNotifications,
    }),
  }),
);

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
      consentDecisionMade: true,
      optedIn: false,
      marketingConsentDecisionMade: true,
      optedInToMarketing: false,
      isSignedIn: false,
      ...overrides,
    },
  });

describe('MetametricsToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    mockMarketingPreferences = {
      pushNotificationsEnabled: false,
      inAppNotificationsEnabled: false,
    };
    mockEnsurePreferences.mockImplementation(() =>
      Promise.resolve({ marketing: mockMarketingPreferences }),
    );
    mockRefetchPreferences.mockImplementation(() =>
      Promise.resolve({ data: { marketing: mockMarketingPreferences } }),
    );
    mockUpdatePreferencesSection.mockResolvedValue(undefined);
    mockListNotifications.mockResolvedValue(undefined);
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
      optedInToMarketing: true,
    });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('participate-in-meta-metrics-input'));

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
  });

  it('warns and disables marketing channels before turning off metrics', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
    };
    const mockStore = createMockStore({
      optedIn: true,
      optedInToMarketing: true,
      isSignedIn: true,
    });
    renderWithProvider(<MetametricsToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('participate-in-meta-metrics-input'));

    expect(
      await screen.findByTestId('metametrics-marketing-consent-sheet'),
    ).toBeInTheDocument();
    expect(mockDisableMetametrics).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByTestId('metametrics-marketing-consent-sheet-confirm'),
    );

    await waitFor(() => {
      expect(mockUpdatePreferencesSection).toHaveBeenCalledWith('marketing', {
        pushNotificationsEnabled: false,
        inAppNotificationsEnabled: false,
      });
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false, {
        waitForAus: true,
      });
      expect(mockDisableMetametrics).toHaveBeenCalled();
    });
    expect(mockListNotifications).toHaveBeenCalled();
    expect(
      screen.queryByTestId('metametrics-marketing-consent-sheet'),
    ).not.toBeInTheDocument();
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
