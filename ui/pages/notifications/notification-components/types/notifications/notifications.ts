import type { FC } from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';

type Notification = NotificationServicesController.Types.INotification;

/**
 * NotificationFC is the shared component interface for all notification components
 */
type NotificationFC<N = Notification> = FC<{
  notification: N;
  onClick?: () => void;
}>;

type BodyOnChainNotification<N = Notification> = {
  type: 'body_onchain_notification';
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
  type: 'body_feature_announcement';
  Image: NotificationFC<N>;
  Description: NotificationFC<N>;
};

type FooterOnChainNotification<N = Notification> = {
  type: 'footer_onchain_notification';
  ScanLink: NotificationFC<N>;
};

type FooterFeatureAnnouncement<N = Notification> = {
  type: 'footer_feature_announcement';
  ExtensionLink: NotificationFC<N>;
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
    body: BodyFeatureAnnouncement<N> | BodyOnChainNotification<N>;
  };
  footer: FooterFeatureAnnouncement<N> | FooterOnChainNotification<N>;
};
