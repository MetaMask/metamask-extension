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
const mockUpdatePreferencesSection = jest.fn();
const mockRefetchPreferences = jest.fn();
const mockListNotifications = jest.fn();
const mockEnsurePreferences = jest.fn();
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
      optedIn: true,
      marketingConsentDecisionMade: true,
      optedInToMarketing: false,
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
    mockUpdatePreferencesSection.mockResolvedValue(undefined);
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
    expect(mockUpdatePreferencesSection).not.toHaveBeenCalled();
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
    expect(mockUpdatePreferencesSection).not.toHaveBeenCalled();
  });

  it('shows the opt-out warning when the preference read failed', async () => {
    mockEnsurePreferences.mockRejectedValueOnce(new Error('AUS unavailable'));
    renderWithProvider(
      <DataCollectionToggleItem />,
      createMockStore({ optedInToMarketing: true }),
    );

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));

    expect(
      await screen.findByTestId('marketing-consent-opt-out-sheet'),
    ).toBeInTheDocument();
    expect(mockSetDataCollectionForMarketing).not.toHaveBeenCalled();
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
    expect(mockUpdatePreferencesSection).not.toHaveBeenCalled();
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
    expect(mockUpdatePreferencesSection).not.toHaveBeenCalled();
  });

  it('turns off consent and both marketing notification channels after confirmation', async () => {
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
      expect(mockUpdatePreferencesSection).toHaveBeenCalledWith(
        'marketing',
        expect.objectContaining({
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: false,
        }),
      );
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(mockListNotifications).toHaveBeenCalled();
    });
  });

  it('keeps the opt-out sheet open and consent unchanged when preference update fails', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: false,
    };
    mockUpdatePreferencesSection.mockRejectedValueOnce(
      new Error('Could not update notification preferences'),
    );
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('marketing-consent-opt-out-sheet'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.notificationsSettingsBoxError.message),
      ).toBeInTheDocument();
      expect(mockSetDataCollectionForMarketing).not.toHaveBeenCalled();
    });
    expect(
      screen.queryByText('Could not update notification preferences'),
    ).not.toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(
      'Failed to turn off marketing consent:',
      expect.objectContaining({
        message: 'Could not update notification preferences',
      }),
    );
  });

  it('keeps the opt-out sheet open without writing when the fresh read fails', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: false,
    };
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    mockRefetchPreferences.mockRejectedValueOnce(new Error('AUS unavailable'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    expect(
      await screen.findByText(messages.notificationsSettingsBoxError.message),
    ).toBeInTheDocument();
    expect(mockRefetchPreferences).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockUpdatePreferencesSection).not.toHaveBeenCalled();
    expect(mockSetDataCollectionForMarketing).not.toHaveBeenCalled();
  });

  it('opts out without writing preferences when the fresh read finds none', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: false,
    };
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    mockRefetchPreferences.mockResolvedValueOnce({ data: null });
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    await waitFor(() => {
      expect(mockSetDataCollectionForMarketing).toHaveBeenCalledWith(false);
      expect(
        screen.queryByTestId('marketing-consent-opt-out-sheet'),
      ).not.toBeInTheDocument();
    });
    expect(mockUpdatePreferencesSection).not.toHaveBeenCalled();
  });

  it('rolls back consent and then channels if the consent update fails', async () => {
    const previousMarketing = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: false,
    };
    mockMarketingPreferences = previousMarketing;
    const writeOrder: string[] = [];
    mockConsentWrite = jest
      .fn()
      .mockRejectedValueOnce(
        new Error('Marketing consent was not saved to AUS'),
      )
      .mockResolvedValue(undefined);
    mockSetDataCollectionForMarketing.mockImplementation((value: boolean) =>
      writeOrder.push(`consent:${value}`),
    );
    mockUpdatePreferencesSection.mockImplementation(
      (_section: string, value: typeof previousMarketing) => {
        writeOrder.push(`channels:${value.pushNotificationsEnabled}`);
        return Promise.resolve();
      },
    );
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    expect(
      await screen.findByText(messages.notificationsSettingsBoxError.message),
    ).toBeInTheDocument();
    expect(writeOrder).toStrictEqual([
      'channels:false',
      'consent:false',
      'consent:true',
      'channels:true',
    ]);
    expect(mockUpdatePreferencesSection).toHaveBeenLastCalledWith(
      'marketing',
      previousMarketing,
    );
    expect(
      screen.getByTestId('marketing-consent-opt-out-sheet'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Marketing consent was not saved to AUS'),
    ).not.toBeInTheDocument();
  });

  it('does not restore channels when restoring consent fails', async () => {
    mockMarketingPreferences = {
      pushNotificationsEnabled: true,
      inAppNotificationsEnabled: false,
    };
    mockConsentWrite = jest
      .fn()
      .mockRejectedValue(new Error('Marketing consent was not saved to AUS'));
    const mockStore = createMockStore({ optedInToMarketing: true });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    fireEvent.click(screen.getByTestId('data-collection-for-marketing-input'));
    fireEvent.click(
      await screen.findByTestId('marketing-consent-opt-out-sheet-confirm'),
    );

    expect(
      await screen.findByText(messages.notificationsSettingsBoxError.message),
    ).toBeInTheDocument();
    expect(mockSetDataCollectionForMarketing).toHaveBeenLastCalledWith(true);
    expect(mockUpdatePreferencesSection).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to roll back marketing opt-out:',
      expect.any(Error),
    );
  });

  it('is disabled when useExternalServices is false', () => {
    const mockStore = createMockStore({ useExternalServices: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    const toggle = screen.getByRole('checkbox');
    expect(toggle.closest('.toggle-button--disabled')).toBeInTheDocument();
  });

  it('is disabled when metrics participation is false', () => {
    const mockStore = createMockStore({ optedIn: false });
    renderWithProvider(<DataCollectionToggleItem />, mockStore);

    const toggle = screen.getByRole('checkbox');
    expect(toggle.closest('.toggle-button--disabled')).toBeInTheDocument();
  });
});
