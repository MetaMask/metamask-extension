import type { FeatureAnnouncementRawNotification } from '../feature-announcement/feature-announcement';
import type { OnChainRawNotification } from '../on-chain-notification/on-chain-notification';
import type { Compute } from '../type-utils';

/**
 * The shape of a "generic" notification.
 * Other than the fields listed below, tt will also contain:
 * - `type` field (declared in the Raw shapes)
 * - `data` field (declared in the Raw shapes)
 */
export type Notification = Compute<
  (FeatureAnnouncementRawNotification | OnChainRawNotification) & {
    id: string;
    createdAt: string;
    isRead: boolean;
  }
>;

// NFT
export type NFT = {
  token_id: string;
  image: string;
  collection?: {
    name: string;
    image: string;
  };
};

export type MarkAsReadNotificationsParam = Pick<
  Notification,
  'id' | 'type' | 'isRead'
>[];
