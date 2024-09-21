import React from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { Box } from '../../../components/component-library';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import type { NotificationComponent } from '../../notifications/notification-components/types/notifications/notifications';

type Notification = NotificationServicesController.Types.INotification;

type NotificationDetailsBodyProps = {
  body: NotificationComponent['details']['body'];
  notification: Notification;
};

export const NotificationDetailsBody = ({
  body,
  notification,
}: NotificationDetailsBodyProps) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      padding={0}
    >
      {body.type === 'body_feature_announcement' && (
        <>
          <body.Image notification={notification} />
          <body.Description notification={notification} />
        </>
      )}
      {body.type === 'body_onchain_notification' && (
        <>
          {body.Image && <body.Image notification={notification} />}
          {body.From && <body.From notification={notification} />}
          {body.To && <body.To notification={notification} />}
          {body.Account && <body.Account notification={notification} />}
          {body.Asset && <body.Asset notification={notification} />}
          {body.AssetReceived && (
            <body.AssetReceived notification={notification} />
          )}
          {body.Status && <body.Status notification={notification} />}
          {body.Network && <body.Network notification={notification} />}
          {body.Rate && <body.Rate notification={notification} />}
          {body.Provider && <body.Provider notification={notification} />}
          {body.NetworkFee && <body.NetworkFee notification={notification} />}
        </>
      )}
    </Box>
  );
};
