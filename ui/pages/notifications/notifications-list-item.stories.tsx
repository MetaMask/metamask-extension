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
} from '@metamask/notification-services-controller/notification-services/mocks';
import { SnapComponent, SnapNotification } from './notification-components/snap/snap';
import { NotificationsListItem } from './notifications-list-item';
import { NotificationServicesController } from '@metamask/notification-services-controller';

type Notification = NotificationServicesController.Types.INotification;
const { processNotification } = NotificationServicesController.Processors;

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
  Snap: createMockSnapNotification,
} as const;

const notifications: Notification[] = Object.values(notificationMocks).map(
  (createMock) => processNotification(createMock()),
);

export default {
  title: 'Pages/Notifications/NotificationsListItems',
  component: NotificationsListItem,
} as Meta;

const NotificationItemWrapper: React.FC<{
  notification: Notification;
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
