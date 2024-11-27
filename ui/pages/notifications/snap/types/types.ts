import { SNAP_TRIGGER } from '../../notification-components';

export type SnapNotificationExpandedView = {
  title: string;
  interfaceId: string;
  footerLink?: { href: string; text: string };
};

export type RawSnapNotification = {
  id: string;
  message: string;
  expandedView?: SnapNotificationExpandedView;
  origin: string;
  createdDate: number;
  readDate?: number;
};

export type SnapNotification = {
  id: string;
  createdAt: string;
  isRead: boolean;
  type: SNAP_TRIGGER.SNAP;
  data: RawSnapNotification;
};
