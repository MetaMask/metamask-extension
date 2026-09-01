import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
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
