import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { useParams } from 'react-router-dom';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getIsPerpsIncludedInBuild } from '../../../../shared/lib/environment';
import {
  createMockNotificationCategories,
  createMockNotificationPreferences,
} from '../../../hooks/metamask-notifications/mocks';
import {
  useNotificationPreferences,
  type NotificationPreferences,
} from '../../../hooks/metamask-notifications/useNotificationPreferences';
import { useNotificationCategories } from '../../../hooks/metamask-notifications/useNotificationCategories';
import { useAccountSettingsProps } from '../../../hooks/metamask-notifications/useSwitchNotifications';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { getNotificationsSettingsSectionRoute } from '../../notifications-settings/notifications-settings-routes';
import { NotificationSectionSubPage } from './notification-section-sub-page';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

const mockSwitchAccountNotifications = jest.fn();

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
  '../../../hooks/metamask-notifications/useNotificationCategories',
  () => ({
    useNotificationCategories: jest.fn(),
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

const setCategoryId = (categoryId: string) =>
  jest.mocked(useParams).mockReturnValue({ categoryId });

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
    setCategoryId('walletActivity');
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
    jest.mocked(useNotificationCategories).mockReturnValue({
      categories: createMockNotificationCategories(),
      isLoading: false,
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
      <NotificationSectionSubPage />,
      store,
      getNotificationsSettingsSectionRoute('walletActivity'),
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
      <NotificationSectionSubPage />,
      store,
      getNotificationsSettingsSectionRoute('walletActivity'),
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
      <NotificationSectionSubPage />,
      store,
      getNotificationsSettingsSectionRoute('walletActivity'),
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
      <NotificationSectionSubPage />,
      store,
      getNotificationsSettingsSectionRoute('walletActivity'),
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
      categoryId: string,
      preferences: NotificationPreferences,
    ) => {
      const updatePreference = jest.fn();
      setCategoryId(categoryId);
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
        <NotificationSectionSubPage />,
        buildStore(),
        getNotificationsSettingsSectionRoute(categoryId),
      );
      return updatePreference;
    };

    // `categoryId` intentionally differs from `ausKey` for a couple of
    // these (per `createMockNotificationCategories`) to prove the write
    // targets the AUS key, not the free-form category id.
    const cases: {
      categoryId: string;
      ausKey: string;
      preferences: NotificationPreferences;
    }[] = [
      {
        categoryId: 'walletActivity',
        ausKey: 'walletActivity',
        preferences: createMockNotificationPreferences(),
      },
      {
        categoryId: 'updatesAndRewards',
        ausKey: 'marketing',
        preferences: createMockNotificationPreferences(),
      },
      {
        categoryId: 'agenticCli',
        ausKey: 'agenticCli',
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
              categoryId: 'tradingActivity',
              ausKey: 'perps',
              preferences: createMockNotificationPreferences(),
            },
          ]
        : []),
    ];

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each(cases)(
      'writes the $categoryId category toggles to its $ausKey AUS key',
      ({ categoryId, ausKey, preferences }: (typeof cases)[number]) => {
        const updatePreference = renderSection(categoryId, preferences);

        fireEvent.click(
          screen.getByTestId(`${categoryId}-in-app-notifications-toggle-input`),
        );
        expect(updatePreference).toHaveBeenCalledWith(
          ausKey,
          'inAppNotificationsEnabled',
          false,
        );

        fireEvent.click(
          screen.getByTestId(`${categoryId}-push-notifications-toggle-input`),
        );
        expect(updatePreference).toHaveBeenCalledWith(
          ausKey,
          'pushNotificationsEnabled',
          false,
        );
      },
    );
  });
});
