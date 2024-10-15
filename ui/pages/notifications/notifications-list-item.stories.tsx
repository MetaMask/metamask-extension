import React, { useState } from 'react';
import { Meta } from '@storybook/react';
import { processSnapNotifications } from './snap/utils/utils';
import { Box } from '../../components/component-library';
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

const {
  createMockNotificationERC1155Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC20Received,
  createMockNotificationERC20Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC721Sent,
  createMockNotificationEthReceived,
  createMockNotificationEthSent,
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
  createMockFeatureAnnouncementRaw,
} = NotificationServicesController.Mocks;

const notifications: Notification[] = [
  processNotification(createMockNotificationEthSent()),
  processNotification(createMockNotificationEthReceived()),
  processNotification(createMockNotificationERC20Sent()),
  processNotification(createMockNotificationERC20Received()),
  processNotification(createMockNotificationERC721Sent()),
  processNotification(createMockNotificationERC721Received()),
  processNotification(createMockNotificationERC1155Sent()),
  processNotification(createMockNotificationERC1155Received()),
  processNotification(createMockNotificationMetaMaskSwapsCompleted()),
  processNotification(createMockNotificationRocketPoolStakeCompleted()),
  processNotification(createMockNotificationRocketPoolUnStakeCompleted()),
  processNotification(createMockNotificationLidoStakeCompleted()),
  processNotification(createMockNotificationLidoWithdrawalRequested()),
  processNotification(createMockNotificationLidoReadyToBeWithdrawn()),
  processNotification(createMockNotificationLidoWithdrawalCompleted()),
  processNotification(createMockFeatureAnnouncementRaw()),
];

export default {
  title: 'Pages/Notifications/NotificationsListItems',
  component: NotificationsListItem,
  storyName: 'Default Matteo',
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
