import type { FeatureAnnouncementRawNotification } from './feature-announcement/feature-announcement';
import type { Compute } from './type-utils';
import type { OnChainRawNotification } from './on-chain-notification/on-chain-notification';

export type NotificationUnion =
  | FeatureAnnouncementRawNotification
  | OnChainRawNotification;

/**
 * The shape of a "generic" notification.
 * Other than the fields listed below, tt will also contain:
 * - `type` field (declared in the Raw shapes)
 * - `data` field (declared in the Raw shapes)
 */
export type Notification = Compute<
  NotificationUnion & {
    id: string;
    createdAt: string;
    isRead: boolean;
  }
>;
