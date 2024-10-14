import React from 'react';
import { Box } from '../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  Notification,
  NotificationComponentType,
  type NotificationComponent,
} from '../../notifications/notification-components/types/notifications/notifications';

type NotificationDetailsFooterProps = {
  footer: NotificationComponent['footer'];
  notification: Notification;
};

export const NotificationDetailsFooter = ({
  footer,
  notification,
}: NotificationDetailsFooterProps) => {
  return (
    <Box
      width={BlockSize.Full}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      padding={4}
      gap={4}
    >
      {footer.type === NotificationComponentType.OnChainFooter && (
        <footer.ScanLink notification={notification} />
      )}
      {footer.type === NotificationComponentType.AnnouncementFooter && (
        <footer.ExtensionLink notification={notification} />
      )}
      {footer.type === NotificationComponentType.SnapFooter && (
        <footer.Link notification={notification} />
      )}
    </Box>
  );
};
