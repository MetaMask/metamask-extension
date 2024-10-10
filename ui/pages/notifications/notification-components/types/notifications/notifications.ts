import type { FC } from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';
import { SnapNotification } from '../../../snap/types/types';

export type Notification =
  | NotificationServicesController.Types.INotification
  | SnapNotification;

/**
 * NotificationFC is the shared component interface for all notification components
 */
type NotificationFC<N = Notification> = FC<{
  notification: N;
  onClick?: () => void;
}>;

export enum NotificationComponentType {
  AnnouncementBody = 'body_feature_announcement',
  AnnouncementFooter = 'footer_feature_announcement',
  OnChainBody = 'body_onchain_notification',
  OnChainFooter = 'footer_onchain_notification',
  SnapBody = 'body_snap_notification',
  SnapFooter = 'footer_snap_notification',
}

type BodyOnChainNotification<N = Notification> = {
  type: NotificationComponentType.OnChainBody;
  Image?: NotificationFC<N>;
  From?: NotificationFC<N>;
  To?: NotificationFC<N>;
  Account?: NotificationFC<N>;
  Status: NotificationFC<N>;
  Asset?: NotificationFC<N>;
  AssetReceived?: NotificationFC<N>;
  Network?: NotificationFC<N>;
  Provider?: NotificationFC<N>;
  Rate?: NotificationFC<N>;
  NetworkFee?: NotificationFC<N>;
};

type BodyFeatureAnnouncement<N = Notification> = {
  type: NotificationComponentType.AnnouncementBody;
  Image: NotificationFC<N>;
  Description: NotificationFC<N>;
};

type BodySnapNotification<N = Notification> = {
  type: NotificationComponentType.SnapBody;
  Content: NotificationFC<N>;
};

type FooterOnChainNotification<N = Notification> = {
  type: NotificationComponentType.OnChainFooter;
  ScanLink: NotificationFC<N>;
};

type FooterFeatureAnnouncement<N = Notification> = {
  type: NotificationComponentType.AnnouncementFooter;
  ExtensionLink: NotificationFC<N>;
};

type FooterSnapNotification<N = Notification> = {
  type: NotificationComponentType.SnapFooter;
  Link: NotificationFC<N>;
};

/**
 * This is the object shape that contains all the components of the particular notification.
 * the `guardFn` can be used to narrow a wide notification into the specific notification required.
 */
export type NotificationComponent<N extends Notification = Notification> = {
  guardFn: (n: Notification) => n is N;
  item: NotificationFC<N>;
  details: {
    title: NotificationFC<N>;
    body:
      | BodyFeatureAnnouncement<N>
      | BodyOnChainNotification<N>
      | BodySnapNotification<N>;
  };
  footer:
    | FooterFeatureAnnouncement<N>
    | FooterOnChainNotification<N>
    | FooterSnapNotification<N>;
};
