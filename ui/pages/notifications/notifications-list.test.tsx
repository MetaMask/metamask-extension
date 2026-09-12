import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import {
  processNotification,
  TRIGGER_TYPES,
  type INotification,
} from '@metamask/notification-services-controller/notification-services';
import {
  createMockNotificationEthSent,
  createMockNotificationEthReceived,
  createMockNotificationERC20Sent,
  createMockNotificationERC20Received,
  createMockNotificationERC721Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC1155Received,
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
  createMockFeatureAnnouncementRaw,
  createMockPlatformNotification,
} from '@metamask/notification-services-controller/notification-services/mocks';

import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { NotificationsList, TAB_KEYS } from './notifications-list';

jest.mock('../../store/actions', () => ({
  deleteExpiredSnapNotifications: jest.fn(() => () => Promise.resolve()),
  fetchAndUpdateMetamaskNotifications: jest.fn(() => () => Promise.resolve()),
}));

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const createStore = (isNotificationServicesEnabled: boolean) =>
  mockStore({
    metamask: {
      isNotificationServicesEnabled,
      isBackupAndSyncEnabled: true,
      metamaskNotifications: [],
      internalAccounts: {
        accounts: [
          {
            address: '0x123',
            id: 'account1',
            metadata: {},
            options: {},
            methods: [],
            type: 'eip155:eoa',
            balance: '100',
            keyring: { type: 'type1' },
            label: 'Account 1',
          },
        ],
      },
    },
  });

const mockNotifications = [
  processNotification(createMockNotificationEthSent()),
  processNotification(createMockNotificationEthReceived()),
  processNotification(createMockNotificationERC20Sent()),
  processNotification(createMockNotificationERC20Received()),
  processNotification(createMockNotificationERC721Sent()),
  processNotification(createMockNotificationERC721Received()),
  processNotification(createMockNotificationERC1155Sent()),
  processNotification(createMockNotificationERC1155Received()),
  processNotification(createMockNotificationLidoReadyToBeWithdrawn()),
  processNotification(createMockNotificationLidoStakeCompleted()),
  processNotification(createMockNotificationLidoWithdrawalCompleted()),
  processNotification(createMockNotificationLidoWithdrawalRequested()),
  processNotification(createMockNotificationMetaMaskSwapsCompleted()),
  processNotification(createMockNotificationRocketPoolStakeCompleted()),
  processNotification(createMockNotificationRocketPoolUnStakeCompleted()),
  processNotification(createMockFeatureAnnouncementRaw()),
  processNotification(createMockPlatformNotification()),
];

describe('NotificationsList', () => {
  it('renders the notifications list page', () => {
    renderWithProvider(
      <NotificationsList
        activeTab={TAB_KEYS.ALL}
        notifications={mockNotifications}
        isLoading={false}
        isError={false}
        notificationsCount={0}
      />,
      createStore(true),
    );

    expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/notification-list-item-/u)).toHaveLength(
      mockNotifications.length,
    );
  });

  it('skips notifications that fail to render instead of crashing the list', () => {
    // Silence the expected render error logs from the error boundary
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(jest.fn());

    // Malformed API responses observed in the wild (see issue #44088):
    // a platform notification missing its `template`, and an on-chain
    // eth_received notification missing `payload.data.amount`.
    const malformedPlatformNotification = {
      id: 'poison-1',
      type: TRIGGER_TYPES.PLATFORM,
      createdAt: '2026-07-02T00:00:00.000Z',
      isRead: false,
    } as unknown as INotification;

    const malformedEthReceivedNotification = {
      id: 'poison-2',
      type: TRIGGER_TYPES.ETH_RECEIVED,
      createdAt: '2026-07-02T00:00:00.000Z',
      isRead: false,
      payload: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: 1,
        network: 'ethereum-mainnet',
        data: {
          kind: 'eth_received',
          to: '0x1111111111111111111111111111111111111111',
          from: '0x2222222222222222222222222222222222222222',
        },
      },
    } as unknown as INotification;

    const validNotification = processNotification(
      createMockNotificationEthSent(),
    );

    renderWithProvider(
      <NotificationsList
        activeTab={TAB_KEYS.ALL}
        notifications={[
          validNotification,
          malformedPlatformNotification,
          malformedEthReceivedNotification,
        ]}
        isLoading={false}
        isError={false}
        notificationsCount={0}
      />,
      createStore(true),
    );

    // The list still renders, showing only the valid notification
    expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
    expect(
      screen.getByTestId(`notification-list-item-${validNotification.id}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('notification-list-item-poison-1'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('notification-list-item-poison-2'),
    ).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  ([TAB_KEYS.ALL, TAB_KEYS.WALLET, TAB_KEYS.WEB3] as TAB_KEYS[]).forEach(
    (tabKey) => {
      it(`shows disabled notifications state when notifications are disabled for ${tabKey} tab`, () => {
        renderWithProvider(
          <NotificationsList
            activeTab={tabKey}
            notifications={mockNotifications}
            isLoading={false}
            isError={false}
            notificationsCount={0}
          />,
          createStore(false),
        );

        expect(
          screen.getByTestId('notifications-list-disabled-notifications'),
        ).toBeInTheDocument();
      });
    },
  );
});
