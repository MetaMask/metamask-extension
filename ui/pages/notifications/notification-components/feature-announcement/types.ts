import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { ExtractedNotification } from '../node-guard';

export type FeatureAnnouncementNotification =
  ExtractedNotification<TRIGGER_TYPES.FEATURES_ANNOUNCEMENT>;
