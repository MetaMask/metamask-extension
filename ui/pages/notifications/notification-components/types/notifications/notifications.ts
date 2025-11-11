import type { FC } from 'react';
import type { NotificationServicesController } from '@metamask/notification-services-controller';

export type Notification = NotificationServicesController.Types.INotification;

/**
 * Computes and combines intersection types for a more "prettier" type (more human readable)
 */
type Compute<Item> = Item extends Item ? { [K in keyof Item]: Item[K] } : never;

// eslint-disable-next-line @typescript-eslint/ban-types
type EmptyObj = {};

/**
 * NotificationFC is the shared component interface for all notification components
 */
type NotificationFC<
  Notif = Notification,
  AdditionalProps extends Record<string, unknown> = EmptyObj,
> = FC<Compute<{ notification: Notif } & AdditionalProps>>;

export enum NotificationComponentType {
  AnnouncementBody = 'body_feature_announcement',
  AnnouncementFooter = 'footer_feature_announcement',
  OnChainBody = 'body_onchain_notification',
  OnChainFooter = 'footer_onchain_notification',
  SnapBody = 'body_snap_notification',
  SnapFooter = 'footer_snap_notification',
}

type BodyOnChainNotification<Notif = Notification> = {
  type: NotificationComponentType.OnChainBody;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Image?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  From?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  To?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Account?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Status: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Asset?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AssetReceived?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Network?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Provider?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Rate?: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  NetworkFee?: NotificationFC<Notif>;
};

type BodyFeatureAnnouncement<Notif = Notification> = {
  type: NotificationComponentType.AnnouncementBody;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Image: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Description: NotificationFC<Notif>;
};

type BodySnapNotification<Notif = Notification> = {
  type: NotificationComponentType.SnapBody;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Content: NotificationFC<Notif>;
};

type FooterOnChainNotification<Notif = Notification> = {
  type: NotificationComponentType.OnChainFooter;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ScanLink: NotificationFC<Notif>;
};

type FooterFeatureAnnouncement<Notif = Notification> = {
  type: NotificationComponentType.AnnouncementFooter;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ExtensionLink: NotificationFC<Notif>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ExternalLink: NotificationFC<Notif>;
};

type FooterSnapNotification<Notif = Notification> = {
  type: NotificationComponentType.SnapFooter;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Link: NotificationFC<Notif>;
};

/**
 * This is the object shape that contains all the components of the particular notification.
 * the `guardFn` can be used to narrow a wide notification into the specific notification required.
 */
export type NotificationComponent<Notif extends Notification = Notification> = {
  guardFn: (n: Notification) => n is Notif;
  item: NotificationFC<Notif, { onClick: () => void }>;
  details?: {
    title: NotificationFC<Notif>;
    body:
      | BodyFeatureAnnouncement<Notif>
      | BodyOnChainNotification<Notif>
      | BodySnapNotification<Notif>;
    footer:
      | FooterFeatureAnnouncement<Notif>
      | FooterOnChainNotification<Notif>
      | FooterSnapNotification<Notif>;
  };
};
