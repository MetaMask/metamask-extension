import React, { useState } from 'react';
import { Meta } from '@storybook/react';
import { processSnapNotifications } from './snap/utils/utils';
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
} from '@metamask/notification-services-controller/notification-services/mocks';
import type { SnapNotification } from './snap/types/types';
import { SnapComponent } from './notification-components/snap/snap';
import { NotificationsListItem } from './notifications-list-item';
import { NotificationServicesController } from '@metamask/notification-services-controller';

type Notification = NotificationServicesController.Types.INotification;
const { processNotification } = NotificationServicesController.Processors;

const snapNotifications = processSnapNotifications([
  {
    createdDate: 1728380597788,
    id: 'TRYkTTkpGf1BqhajRQz8h',
    message: 'Hello from within MetaMask!',
    origin: 'npm:@metamask/notification-example-snap',
    readDate: undefined,
  },
]);

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

const SnapNotificationWrapper: React.FC<{
  snapNotification: SnapNotification;
  onRead: (id: string) => void;
}> = ({ snapNotification, onRead }) => {
  const handleSnapNotificationClick = () => {
    onRead(snapNotification.id);
  };

  return (
    <div onClick={handleSnapNotificationClick}>
      <SnapComponent snapNotification={snapNotification} />
    </div>
  );
};

const Template = () => {
  const [notificationList, setNotificationList] = useState(notifications);
  const [snapNotificationList, setSnapNotificationList] =
    useState(snapNotifications);

  const markAsRead = (id: string) => {
    setNotificationList((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const markSnapAsRead = (id: string) => {
    setSnapNotificationList((prevSnapNotifications) =>
      prevSnapNotifications.map((snapNotification) =>
        snapNotification.id === id
          ? { ...snapNotification, readDate: Date.now() }
          : snapNotification,
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
      {snapNotificationList.map((snapNotification) => (
        <SnapNotificationWrapper
          key={snapNotification.id}
          snapNotification={snapNotification}
          onRead={markSnapAsRead} // Pass the markSnapAsRead function
        />
      ))}
    </Box>
  );
};

export const Default = Template.bind({});
