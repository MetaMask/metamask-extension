import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getIsPerpsIncludedInBuild } from '../../../../shared/lib/environment';
import { NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE } from '../../../helpers/constants/routes';
import { createMockNotificationPreferences } from '../../../hooks/metamask-notifications/mocks';
import {
  useNotificationPreferences,
  type NotificationPreferences,
} from '../../../hooks/metamask-notifications/useNotificationPreferences';
import { useAccountSettingsProps } from '../../../hooks/metamask-notifications/useSwitchNotifications';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import type { NotificationsSettingsSectionType } from '../../notifications-settings/notifications-settings-types';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { getNotificationsSettingsSectionRoute } from '../../notifications-settings/notifications-settings-routes';
import { NotificationSectionSubPage } from './notification-section-sub-page';

const mockTrackEvent = jest.fn();
const mockSwitchAccountNotifications = jest.fn();

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

jest.mock(
  '../../notifications-settings/notifications-settings-per-account',
  () => ({
    NotificationsSettingsPerAccount: ({
      address,
      name,
      disabledSwitch,
      isEnabled,
      onToggle,
    }: {
      address: string;
      name: string;
      disabledSwitch: boolean;
      isEnabled: boolean;
      onToggle: (nextValue: boolean) => Promise<void>;
    }) => (
      <button
        data-testid={`notifications-settings-account-${address}`}
        disabled={disabledSwitch}
        onClick={() => {
          onToggle(!isEnabled).catch(() => undefined);
        }}
      >
        {name}
      </button>
    ),
  }),
);

jest.mock(
  '../../../hooks/metamask-notifications/useSwitchNotifications',
  () => ({
    useAccountSettingsProps: jest.fn(),
    useSwitchAccountNotificationsChange: jest.fn(() => ({
      onChange: mockSwitchAccountNotifications,
      error: null,
    })),
  }),
);

jest.mock(
  '../../../hooks/metamask-notifications/useNotificationPreferences',
  () => ({
    useNotificationPreferences: jest.fn(),
  }),
);

jest.mock(
  '../../../contexts/metamask-notifications/metamask-notifications',
  () => ({
    useMetamaskNotificationsContext: () => ({
      listNotifications: jest.fn(),
    }),
  }),
);

const mockStore = configureMockStore([thunk]);

const createInternalAccount = ({
  id,
  address,
  type,
  name,
}: {
  id: string;
  address: string;
  type: string;
  name: string;
}) => ({
  id,
  address,
  type,
  options: {},
  methods: [],
  metadata: {
    name,
    keyring: {},
    importTime: 0,
  },
  scopes: ['eip155:1'],
});

describe('NotificationSectionSubPage', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    jest.mocked(useAccountSettingsProps).mockReturnValue({
      data: {},
      initialLoading: false,
      error: null,
      accountsBeingUpdated: [],
      update: jest.fn(),
    });
    jest.mocked(useNotificationPreferences).mockReturnValue({
      preferences: createMockNotificationPreferences(),
      hasNotificationPreferences: true,
      isLoading: false,
      isUpdatingPreferences: false,
      error: null,
      refetchPreferences: jest.fn(),
      updatePreference: jest.fn(),
      updatePreferencesSection: jest.fn(),
    });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('renders a loading indicator while preferences are being fetched', () => {
    jest.mocked(useNotificationPreferences).mockReturnValue({
      preferences: undefined,
      hasNotificationPreferences: false,
      isLoading: true,
      isUpdatingPreferences: false,
      error: null,
      refetchPreferences: jest.fn(),
      updatePreference: jest.fn(),
      updatePreferencesSection: jest.fn(),
    });

    const store = mockStore({
      metamask: {
        isNotificationServicesEnabled: true,
        isUpdatingMetamaskNotifications: false,
        isUpdatingMetamaskNotificationsAccount: [],
        accountTree: { selectedAccountGroup: '', wallets: {} },
        internalAccounts: { selectedAccount: '', accounts: {} },
      },
    });

    renderWithProvider(
      <NotificationSectionSubPage sectionType="walletActivity" />,
      store,
      NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
    );

    expect(
      screen.getByTestId('notifications-section-loading'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('notifications-settings-per-account'),
    ).not.toBeInTheDocument();
  });

  it('renders notification accounts grouped by wallet', () => {
    const account1 = createInternalAccount({
      id: 'account-1',
      address: '0x1111111111111111111111111111111111111111',
      type: 'eip155:eoa',
      name: 'Account 1',
    });
    const account2 = createInternalAccount({
      id: 'account-2',
      address: '0x2222222222222222222222222222222222222222',
      type: 'eip155:eoa',
      name: 'Account 2',
    });
    const account3 = createInternalAccount({
      id: 'account-3',
      address: '0x3333333333333333333333333333333333333333',
      type: 'eip155:eoa',
      name: 'Imported 1',
    });
    const nonEvmAccount = createInternalAccount({
      id: 'account-4',
      address: 'SolanaAddress222222222222222222222222222222',
      type: 'solana:data-account',
      name: 'Imported 2',
    });

    const store = mockStore({
      metamask: {
        isNotificationServicesEnabled: true,
        isUpdatingMetamaskNotifications: false,
        isUpdatingMetamaskNotificationsAccount: [],
        subscriptionAccountsSeen: [
          account1.address,
          account2.address,
          account3.address,
        ],
        accountTree: {
          selectedAccountGroup: 'entropy:wallet-1/0',
          wallets: {
            'entropy:wallet-1': {
              id: 'entropy:wallet-1',
              type: 'entropy',
              metadata: { name: 'Wallet 1' },
              groups: {
                'entropy:wallet-1/0': {
                  id: 'entropy:wallet-1/0',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account1.id],
                },
                'entropy:wallet-1/1': {
                  id: 'entropy:wallet-1/1',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 2',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account2.id],
                },
              },
            },
            'keyring:wallet-2': {
              id: 'keyring:wallet-2',
              type: 'keyring',
              metadata: { name: 'Imported wallet' },
              groups: {
                'keyring:wallet-2/0': {
                  id: 'keyring:wallet-2/0',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Imported 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account3.id],
                },
                'keyring:wallet-2/1': {
                  id: 'keyring:wallet-2/1',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Imported 2',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [nonEvmAccount.id],
                },
              },
            },
          },
        },
        internalAccounts: {
          selectedAccount: account1.id,
          accounts: {
            [account1.id]: account1,
            [account2.id]: account2,
            [account3.id]: account3,
            [nonEvmAccount.id]: nonEvmAccount,
          },
        },
      },
    });

    renderWithProvider(
      <NotificationSectionSubPage sectionType="walletActivity" />,
      store,
      NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
    );

    expect(
      screen.getByTestId('notifications-settings-per-account'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('notifications-settings-section-back-button'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Imported wallet')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'notifications-settings-account-0x1111111111111111111111111111111111111111',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'notifications-settings-account-0x2222222222222222222222222222222222222222',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'notifications-settings-account-0x3333333333333333333333333333333333333333',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Imported 2')).not.toBeInTheDocument();
  });

  it('queues rapid account toggles while rendering optimistic account states', async () => {
    const account1 = createInternalAccount({
      id: 'account-1',
      address: '0x1111111111111111111111111111111111111111',
      type: 'eip155:eoa',
      name: 'Account 1',
    });
    const account2 = createInternalAccount({
      id: 'account-2',
      address: '0x2222222222222222222222222222222222222222',
      type: 'eip155:eoa',
      name: 'Account 2',
    });
    const store = mockStore({
      metamask: {
        isNotificationServicesEnabled: true,
        isUpdatingMetamaskNotifications: false,
        isUpdatingMetamaskNotificationsAccount: [],
        subscriptionAccountsSeen: [account1.address, account2.address],
        accountTree: {
          selectedAccountGroup: 'entropy:wallet-1/0',
          wallets: {
            'entropy:wallet-1': {
              id: 'entropy:wallet-1',
              type: 'entropy',
              metadata: { name: 'Wallet 1' },
              groups: {
                'entropy:wallet-1/0': {
                  id: 'entropy:wallet-1/0',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account1.id],
                },
                'entropy:wallet-1/1': {
                  id: 'entropy:wallet-1/1',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 2',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account2.id],
                },
              },
            },
          },
        },
        internalAccounts: {
          selectedAccount: account1.id,
          accounts: {
            [account1.id]: account1,
            [account2.id]: account2,
          },
        },
      },
    });
    let resolveFirstToggle: () => void = () => undefined;
    const firstToggle = new Promise<void>((resolve) => {
      resolveFirstToggle = resolve;
    });
    mockSwitchAccountNotifications.mockImplementation(() =>
      mockSwitchAccountNotifications.mock.calls.length === 1
        ? firstToggle
        : Promise.resolve(),
    );

    renderWithProvider(
      <NotificationSectionSubPage sectionType="walletActivity" />,
      store,
      NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
    );

    fireEvent.click(
      screen.getByTestId(
        'notifications-settings-account-0x1111111111111111111111111111111111111111',
      ),
    );

    await waitFor(() => {
      expect(mockSwitchAccountNotifications).toHaveBeenCalledTimes(1);
    });

    const secondAccountToggle = screen.getByTestId(
      'notifications-settings-account-0x2222222222222222222222222222222222222222',
    );
    expect(secondAccountToggle).not.toBeDisabled();
    fireEvent.click(secondAccountToggle);

    expect(mockSwitchAccountNotifications).toHaveBeenCalledTimes(1);
    resolveFirstToggle();

    await waitFor(() => {
      expect(mockSwitchAccountNotifications).toHaveBeenCalledTimes(2);
    });
    expect(mockSwitchAccountNotifications).toHaveBeenNthCalledWith(
      1,
      ['0x1111111111111111111111111111111111111111'],
      false,
    );
    expect(mockSwitchAccountNotifications).toHaveBeenNthCalledWith(
      2,
      ['0x2222222222222222222222222222222222222222'],
      false,
    );
  });

  it('renders local EVM accounts when AUS wallet activity accounts are empty', () => {
    const account = createInternalAccount({
      id: 'account-1',
      address: '0x1111111111111111111111111111111111111111',
      type: 'eip155:eoa',
      name: 'Account 1',
    });

    const store = mockStore({
      metamask: {
        isNotificationServicesEnabled: true,
        isUpdatingMetamaskNotifications: false,
        isUpdatingMetamaskNotificationsAccount: [],
        subscriptionAccountsSeen: [],
        accountTree: {
          selectedAccountGroup: 'entropy:wallet-1/0',
          wallets: {
            'entropy:wallet-1': {
              id: 'entropy:wallet-1',
              type: 'entropy',
              metadata: { name: 'Wallet 1' },
              groups: {
                'entropy:wallet-1/0': {
                  id: 'entropy:wallet-1/0',
                  type: 'multichain-account',
                  metadata: {
                    name: 'Account 1',
                    pinned: false,
                    hidden: false,
                  },
                  accounts: [account.id],
                },
              },
            },
          },
        },
        internalAccounts: {
          selectedAccount: account.id,
          accounts: {
            [account.id]: account,
          },
        },
      },
    });

    jest.mocked(useNotificationPreferences).mockReturnValue({
      preferences: createMockNotificationPreferences({
        walletActivity: {
          pushNotificationsEnabled: true,
          inAppNotificationsEnabled: true,
          accounts: [],
        },
      }),
      hasNotificationPreferences: true,
      isLoading: false,
      isUpdatingPreferences: false,
      error: null,
      refetchPreferences: jest.fn(),
      updatePreference: jest.fn(),
      updatePreferencesSection: jest.fn(),
    });

    renderWithProvider(
      <NotificationSectionSubPage sectionType="walletActivity" />,
      store,
      NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
    );

    expect(
      screen.getByTestId('notifications-settings-per-account'),
    ).toBeInTheDocument();
    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'notifications-settings-account-0x1111111111111111111111111111111111111111',
      ),
    ).toBeInTheDocument();
  });

  describe('wallet-activity aggregate toggle analytics', () => {
    const address1 =
      '0x1111111111111111111111111111111111111111' as `0x${string}`;
    const address2 =
      '0x2222222222222222222222222222222222222222' as `0x${string}`;

    const acc1 = createInternalAccount({
      id: 'agg-account-1',
      address: address1,
      type: 'eip155:eoa',
      name: 'Agg Account 1',
    });
    const acc2 = createInternalAccount({
      id: 'agg-account-2',
      address: address2,
      type: 'eip155:eoa',
      name: 'Agg Account 2',
    });

    const buildAggStore = () =>
      mockStore({
        metamask: {
          isNotificationServicesEnabled: true,
          isUpdatingMetamaskNotifications: false,
          isUpdatingMetamaskNotificationsAccount: [],
          subscriptionAccountsSeen: [address1, address2],
          accountTree: {
            selectedAccountGroup: 'entropy:wallet-agg/0',
            wallets: {
              'entropy:wallet-agg': {
                id: 'entropy:wallet-agg',
                type: 'entropy',
                metadata: { name: 'Wallet Agg' },
                groups: {
                  'entropy:wallet-agg/0': {
                    id: 'entropy:wallet-agg/0',
                    type: 'multichain-account',
                    metadata: {
                      name: 'Agg Account 1',
                      pinned: false,
                      hidden: false,
                    },
                    accounts: [acc1.id],
                  },
                  'entropy:wallet-agg/1': {
                    id: 'entropy:wallet-agg/1',
                    type: 'multichain-account',
                    metadata: {
                      name: 'Agg Account 2',
                      pinned: false,
                      hidden: false,
                    },
                    accounts: [acc2.id],
                  },
                },
              },
            },
          },
          internalAccounts: {
            selectedAccount: acc1.id,
            accounts: { [acc1.id]: acc1, [acc2.id]: acc2 },
          },
        },
      });

    beforeEach(() => {
      mockSwitchAccountNotifications.mockResolvedValue(undefined);
    });

    const renderAggPage = (
      accounts: { address: `0x${string}`; enabled: boolean }[],
    ) => {
      jest.mocked(useNotificationPreferences).mockReturnValue({
        preferences: createMockNotificationPreferences({
          walletActivity: {
            pushNotificationsEnabled: true,
            inAppNotificationsEnabled: true,
            accounts,
          },
        }),
        hasNotificationPreferences: true,
        isLoading: false,
        isUpdatingPreferences: false,
        error: null,
        refetchPreferences: jest.fn(),
        updatePreference: jest.fn(),
        updatePreferencesSection: jest.fn(),
      });

      renderWithProvider(
        <NotificationSectionSubPage sectionType="walletActivity" />,
        buildAggStore(),
        NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
      );
    };

    it('tracks aggregate wallet_activity enabled when the first disabled account is toggled on', async () => {
      renderAggPage([
        { address: address1, enabled: false },
        { address: address2, enabled: false },
      ]);

      fireEvent.click(
        screen.getByTestId(`notifications-settings-account-${address1}`),
      );

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              settings_type: 'wallet_activity',
              notification_channel: 'all',
              enabled: true,
            }),
          }),
        );
      });
    });

    it('tracks aggregate wallet_activity disabled when the last enabled account is toggled off', async () => {
      renderAggPage([
        { address: address1, enabled: true },
        { address: address2, enabled: false },
      ]);

      fireEvent.click(
        screen.getByTestId(`notifications-settings-account-${address1}`),
      );

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              settings_type: 'wallet_activity',
              notification_channel: 'all',
              enabled: false,
            }),
          }),
        );
      });
    });
  });

  describe('section notification toggle wiring', () => {
    const buildStore = () =>
      mockStore({
        metamask: {
          isNotificationServicesEnabled: true,
          isUpdatingMetamaskNotifications: false,
          isUpdatingMetamaskNotificationsAccount: [],
          subscriptionAccountsSeen: [],
          accountTree: { selectedAccountGroup: '', wallets: {} },
          internalAccounts: { selectedAccount: '', accounts: {} },
        },
      });

    const renderSection = (
      section: NotificationsSettingsSectionType,
      preferences: NotificationPreferences,
    ) => {
      const updatePreference = jest.fn();
      jest.mocked(useNotificationPreferences).mockReturnValue({
        preferences,
        hasNotificationPreferences: true,
        isLoading: false,
        isUpdatingPreferences: false,
        error: null,
        refetchPreferences: jest.fn(),
        updatePreference,
        updatePreferencesSection: jest.fn(),
      });
      renderWithProvider(
        <NotificationSectionSubPage sectionType={section} />,
        buildStore(),
        getNotificationsSettingsSectionRoute(section),
      );
      return updatePreference;
    };

    const cases: {
      section: NotificationsSettingsSectionType;
      preferences: NotificationPreferences;
    }[] = [
      {
        section: 'walletActivity',
        preferences: createMockNotificationPreferences(),
      },
      {
        section: 'marketing',
        preferences: createMockNotificationPreferences(),
      },
      {
        section: 'agenticCli',
        preferences: {
          ...createMockNotificationPreferences(),
          agenticCli: {
            inAppNotificationsEnabled: true,
            pushNotificationsEnabled: true,
          },
        },
      },
      ...(getIsPerpsIncludedInBuild()
        ? [
            {
              section: 'perps' as const,
              preferences: createMockNotificationPreferences(),
            },
          ]
        : []),
    ];

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(cases)(
      'writes the $section in-app and push toggles to their own preference fields',
      ({ section, preferences }: (typeof cases)[number]) => {
        const updatePreference = renderSection(section, preferences);

        fireEvent.click(
          screen.getByTestId(`${section}-in-app-notifications-toggle-input`),
        );
        expect(updatePreference).toHaveBeenCalledWith(
          section,
          'inAppNotificationsEnabled',
          false,
        );

        fireEvent.click(
          screen.getByTestId(`${section}-push-notifications-toggle-input`),
        );
        expect(updatePreference).toHaveBeenCalledWith(
          section,
          'pushNotificationsEnabled',
          false,
        );
      },
    );
  });
});
