import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getIsSocialLoginFlow } from '../../../selectors/first-time-flow';
import { setBackgroundConnection } from '../../../store/background-connection';
import { DataCollectionToggleItem } from './data-collection-item';

const mockSetDataCollectionForMarketing = jest.fn();
const mockRefetchPreferences = jest.fn();
const mockListNotifications = jest.fn();
const mockEnsurePreferences = jest.fn();
const mockMarkMarketingChannelsOff = jest.fn();
let mockConsentWrite: () => Promise<void> = () => Promise.resolve();
let mockMarketingPreferences = {
  pushNotificationsEnabled: false,
  inAppNotificationsEnabled: false,
};

jest.mock('../../../selectors/first-time-flow', () => {
  const actual = jest.requireActual<
    typeof import('../../../selectors/first-time-flow')
  >('../../../selectors/first-time-flow');
  return {
    ...actual,
    getIsSocialLoginFlow: jest.fn().mockReturnValue(false),
  };
});

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setDataCollectionForMarketing: (val: boolean) => {
    mockSetDataCollectionForMarketing(val);
    return () => mockConsentWrite();
  },
}));

jest.mock(
  '../../../hooks/metamask-notifications/useNotificationPreferences',
  () => ({
    useNotificationPreferences: () => ({
      preferences: { marketing: mockMarketingPreferences },
      ensurePreferences: mockEnsurePreferences,
      markMarketingChannelsOff: mockMarkMarketingChannelsOff,
      refetchPreferences: mockRefetchPreferences,
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
      optedIn: true,
      marketingConsentDecisionMade: true,
      optedInToMarketing: false,
      isSignedIn: true,
      ...overrides,
    },
  });

describe('DataCollectionToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
    (getIsSocialLoginFlow as jest.Mock).mockReturnValue(false);
    mockMarketingPreferences = {
      pushNotificationsEnabled: false,
      inAppNotificationsEnabled: false,
    };
    mockConsentWrite = () => Promise.resolve();
    mockEnsurePreferences.mockImplementation(() =>
      Promise.resolve({ marketing: mockMarketingPreferences }),
    );
    mockRefetchPreferences.mockImplementation(() =>
      Promise.resolve({ data: { marketing: mockMarketingPreferences } }),
    );
    mockListNotifications.mockResolvedValue(undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('renders title', () => {
    const mockStore = createMockStore();
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByText(messages.dataCollectionForMarketing.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    const mockStore = createMockStore();
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByText(messages.dataCollectionForMarketingDescription.message),
    ).toBeInTheDocument();
  });

  it('preserves the social-login marketing description', () => {
    (getIsSocialLoginFlow as jest.Mock).mockReturnValue(true);
    renderWithProvider(<DataCollectionToggleItem />, createMockStore());

    expect(
      screen.getByText(
        messages.dataCollectionForMarketingDescriptionSocialLogin.message,
      ),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByTestId('data-collection-for-marketing-input'),
    ).toHaveAttribute('value', 'true');
  });

  it('renders toggle in disabled state', () => {
    const mockStore = createMockStore({ optedInToMarketing: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    expect(
      screen.getByTestId('data-collection-for-marketing-input'),
    ).toHaveAttribute('value', 'false');
  });

  it('calls setDataCollectionForMarketing with true when toggled on', () => {
    const mockStore = createMockStore({ optedInToMarketing: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(true);
  });

  it('calls setDataCollectionForMarketing with false when toggled off', async () => {
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
    expect(
      screen.queryByTestId('marketing-consent-opt-out-sheet'),
    ).not.toBeInTheDocument();
  });

  it('allows opting out if notification preferences have not been created', async () => {
    mockEnsurePreferences.mockResolvedValueOnce(null);
    const store = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, store);
    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
  });

  it('waits for an in-flight preference read instead of showing the warning', async () => {
    let resolveRead: (value: null) => void = () => undefined;
    mockEnsurePreferences.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRead = resolve;
      }),
    );
    renderWithProvider(
      <DataCollectionToggleItem />,
      createMockStore({ optedInToMarketing: true }),
    );

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(mockSetDataCollectionForMarketing).not.toHaveBeenCalled();
    resolveRead(null);

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
    expect(
      screen.queryByTestId('marketing-consent-opt-out-sheet'),
    ).not.toBeInTheDocument();
    expect(mockRefetchPreferences).not.toHaveBeenCalled();
  });

  it('opts out without the warning when the preference read failed', async () => {
    mockEnsurePreferences.mockRejectedValueOnce(new Error('AUS unavailable'));
    renderWithProvider(
      <DataCollectionToggleItem />,
      createMockStore({ optedInToMarketing: true }),
    );

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
    expect(
      screen.queryByTestId('marketing-consent-opt-out-sheet'),
    ).not.toBeInTheDocument();
  });

  it('shows the opt-out warning without changing either preference when marketing notifications are enabled', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
    };
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(
      await screen.findByTestId('marketing-consent-opt-out-sheet'),
    ).toBeInTheDocument();
    expect(mockSetDataCollectionForMarketing).not.toHaveBeenCalled();
  });

  it('leaves preferences unchanged when the opt-out sheet is dismissed', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
    };
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-cancel'),
    );

    expect(
      screen.queryByTestId('marketing-consent-opt-out-sheet'),
    ).not.toBeInTheDocument();
    expect(mockSetDataCollectionForMarketing).not.toHaveBeenCalled();
  });

  it('turns off consent and refreshes the preferences after confirmation', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
    };
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(mockMarkMarketingChannelsOff).toHaveBeenCalled();
      expect(mockRefetchPreferences).toHaveBeenCalled();
      expect(mockListNotifications).toHaveBeenCalled();
      expect(
        screen.queryByTestId('marketing-consent-opt-out-sheet'),
      ).not.toBeInTheDocument();
    });
  });

  it('clears the cached marketing channels and completes the opt-out when the refresh fails', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
    };
    mockRefetchPreferences.mockResolvedValueOnce({
      isError: true,
      error: new Error('Failed to read preferences'),
    });
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    await waitFor(() => {
      expect(
        screen.queryByTestId('marketing-consent-opt-out-sheet'),
      ).not.toBeInTheDocument();
    });
    expect(mockMarkMarketingChannelsOff).toHaveBeenCalled();
    expect(
      mockMarkMarketingChannelsOff.mock.invocationCallOrder[0],
    ).toBeLessThan(mockRefetchPreferences.mock.invocationCallOrder[0]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the opt-out sheet open and restores consent if the consent update fails', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: false,
    };
    mockConsentWrite = jest
      .fn()
      .mockRejectedValueOnce(
        new Error('Marketing consent was not saved to AUS'),
      )
      .mockResolvedValue(undefined);
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      messages.notificationsSettingsBoxError.message,
    );
    expect(mockSetDataCollectionForMarketing).toHaveBeenNthCalledWith(1, false);
    expect(mockSetDataCollectionForMarketing).toHaveBeenNthCalledWith(2, true);
    expect(
      screen.getByTestId('marketing-consent-opt-out-sheet'),
    ).toBeInTheDocument();
  });

  it('opts out directly for signed-out users even when marketing channels are enabled', async () => {
    // Marketing channels live in AUS, which a signed-out user does not have:
    // the preferences read always fails and the sheet confirm could never
    // complete, so the opt-out must not require it.
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
    };
    const mockStore = createMockStore({
      isSignedIn: false,
      optedInToMarketing: true,
    });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
    });
    expect(
      screen.queryByTestId('marketing-consent-opt-out-sheet'),
    ).not.toBeInTheDocument();
  });

  it('is disabled when useExternalServices is false', () => {
    const mockStore = createMockStore({ useExternalServices: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    const toggle = screen.getByRole('checkbox');
    expect(toggle.closest('.toggle-button--disabled')).toBeInTheDocument();
  });

  it('is enabled when metrics participation is off', () => {
    const mockStore = createMockStore({
      optedIn: false,
      optedInToMarketing: false,
    });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    const toggle = screen.getByRole('checkbox');
    expect(toggle.closest('.toggle-button--disabled')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(true);
  });
});
