import type { TRIGGER_TYPES } from '../../constants/notification-schema';
import type { TypeFeatureAnnouncement } from './type-feature-announcement';

export type { TypeFeatureAnnouncement };
export type { TypeFeatureAnnouncementFields } from './type-feature-announcement';

export type FeatureAnnouncementRawNotificationData = Omit<
  TypeFeatureAnnouncement['fields'],
  'image' | 'longDescription' | 'extensionLink'
> & {
  longDescription: string;
  image: {
    title?: string;
    description?: string;
    url: string;
  };
  extensionLink?: {
    extensionLinkText: string;
    extensionLinkRoute: string;
  };
};

export type FeatureAnnouncementRawNotification = {
  type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT;
  createdAt: string;
  data: FeatureAnnouncementRawNotificationData;
};
