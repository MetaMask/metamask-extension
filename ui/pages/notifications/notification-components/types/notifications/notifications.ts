import type { FC } from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';

export type Notification = NotificationServicesController.Types.INotification;

/**
 * NotificationFC is the shared component interface for all notification components
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type BodyOnChainNotification<N = Notification> = {
  type: NotificationComponentType.OnChainBody;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Image?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  From?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  To?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Account?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Status: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Asset?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AssetReceived?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Network?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Provider?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Rate?: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NetworkFee?: NotificationFC<N>;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type BodyFeatureAnnouncement<N = Notification> = {
  type: NotificationComponentType.AnnouncementBody;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Image: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Description: NotificationFC<N>;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type BodySnapNotification<N = Notification> = {
  type: NotificationComponentType.SnapBody;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Content: NotificationFC<N>;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type FooterOnChainNotification<N = Notification> = {
  type: NotificationComponentType.OnChainFooter;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ScanLink: NotificationFC<N>;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type FooterFeatureAnnouncement<N = Notification> = {
  type: NotificationComponentType.AnnouncementFooter;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ExtensionLink: NotificationFC<N>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ExternalLink: NotificationFC<N>;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type FooterSnapNotification<N = Notification> = {
  type: NotificationComponentType.SnapFooter;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Link: NotificationFC<N>;
};

/**
 * This is the object shape that contains all the components of the particular notification.
 * the `guardFn` can be used to narrow a wide notification into the specific notification required.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
