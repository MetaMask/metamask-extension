import React from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { Box } from '../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import type { NotificationComponent } from '../../notifications/notification-components/types/notifications/notifications';

type Notification = NotificationServicesController.Types.INotification;

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
      {footer.type === 'footer_onchain_notification' && (
        <>
          <footer.ScanLink notification={notification} />
        </>
      )}
      {footer.type === 'footer_feature_announcement' && (
        <>
          <footer.ExtensionLink notification={notification} />
        </>
      )}
    </Box>
  );
};
