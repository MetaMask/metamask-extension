import React, { useState } from 'react';
import { Meta } from '@storybook/react';
import { Box } from '../../components/component-library';
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
  createMockSnapNotification,
  createMockPlatformNotification,
} from '@metamask/notification-services-controller/notification-services/mocks';
import { NotificationsListItem } from './notifications-list-item';
import {
  type INotification,
  processNotification,
} from '@metamask/notification-services-controller/notification-services';

const notificationMocks = {
  EthSent: createMockNotificationEthSent,
  EthReceived: createMockNotificationEthReceived,
  ERC20Sent: createMockNotificationERC20Sent,
  ERC20Received: createMockNotificationERC20Received,
  ERC721Sent: createMockNotificationERC721Sent,
  ERC721Received: createMockNotificationERC721Received,
  ERC1155Sent: createMockNotificationERC1155Sent,
  ERC1155Received: createMockNotificationERC1155Received,
  LidoReadyToBeWithdrawn: createMockNotificationLidoReadyToBeWithdrawn,
  LidoStakeCompleted: createMockNotificationLidoStakeCompleted,
  LidoWithdrawalCompleted: createMockNotificationLidoWithdrawalCompleted,
  LidoWithdrawalRequested: createMockNotificationLidoWithdrawalRequested,
  MetaMaskSwapsCompleted: createMockNotificationMetaMaskSwapsCompleted,
  RocketPoolStakeCompleted: createMockNotificationRocketPoolStakeCompleted,
  RocketPoolUnStakeCompleted: createMockNotificationRocketPoolUnStakeCompleted,
  FeatureAnnouncement: createMockFeatureAnnouncementRaw,
  Snap: () => {
    const mock = createMockSnapNotification();
    // TODO(hmalik88): the mock's origin should be fixed upstream
    mock.data.origin = 'npm:@metamask/example-snap';
    return mock;
  },
  Platform: createMockPlatformNotification,
} as const;

const notifications: INotification[] = Object.values(notificationMocks).map(
  (createMock) => processNotification(createMock()),
);

export default {
  title: 'Pages/Notifications/NotificationsListItems',
  component: NotificationsListItem,
} as Meta;

const NotificationItemWrapper: React.FC<{
  notification: INotification;
  onRead: (id: string) => void;
}> = ({ notification, onRead }) => {
  const handleCustomNotificationClick = () => {
    onRead(notification.id);
  };

  return (
    <div onClick={handleCustomNotificationClick}>
      <NotificationsListItem notification={notification} />
    </div>
  );
};

const Template = () => {
  const [notificationList, setNotificationList] = useState(notifications);

  const markAsRead = (id: string) => {
    setNotificationList((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  return (
    <Box marginLeft={'auto'} marginRight={'auto'}>
      {notificationList.map((notification) => (
        <NotificationItemWrapper
          key={notification.id}
          notification={notification}
          onRead={markAsRead} // Pass the markAsRead function
        />
      ))}
    </Box>
  );
};

export const Default = Template.bind({});
