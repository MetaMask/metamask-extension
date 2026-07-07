import {
  TRIGGER_TYPES,
  type INotification,
} from '@metamask/notification-services-controller/notification-services';
import { NotificationCategoryId } from './notification-categories-types';

// eslint-disable-next-line @typescript-eslint/naming-convention
type PlatformNotificationLike = { notification_type?: string };

const WALLET_ACTIVITY_TRIGGER_TYPES: ReadonlySet<TRIGGER_TYPES> = new Set([
  TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
  TRIGGER_TYPES.ERC20_SENT,
  TRIGGER_TYPES.ERC20_RECEIVED,
  TRIGGER_TYPES.ETH_SENT,
  TRIGGER_TYPES.ETH_RECEIVED,
  TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
  TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED,
  TRIGGER_TYPES.LIDO_STAKE_COMPLETED,
  TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
  TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED,
  TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
  TRIGGER_TYPES.ERC721_SENT,
  TRIGGER_TYPES.ERC721_RECEIVED,
  TRIGGER_TYPES.ERC1155_SENT,
  TRIGGER_TYPES.ERC1155_RECEIVED,
]);

// Notification API v4 (MetaMask/core#9384) replaces the collapsed v3
// "platform" bucket with a producer-set `notification_type` (e.g. "perps"),
// which `toRawAPINotification` carries through verbatim alongside the
// normalized `type: TRIGGER_TYPES.PLATFORM`. The extension's controller
// dependency is still v3, so `notification_type` is always the literal
// "platform" today and every platform notification falls through to the
// Marketing default below - this starts discriminating correctly the moment
// the extension upgrades to a v4-aware controller, with no further changes.
const PLATFORM_NOTIFICATION_TYPE_TO_CATEGORY: Record<
  string,
  NotificationCategoryId
> = {
  [NotificationCategoryId.Perps]: NotificationCategoryId.Perps,
  [NotificationCategoryId.SocialAI]: NotificationCategoryId.SocialAI,
  [NotificationCategoryId.Marketing]: NotificationCategoryId.Marketing,
};

export function deriveNotificationCategory(
  notification: INotification,
): NotificationCategoryId | undefined {
  if (WALLET_ACTIVITY_TRIGGER_TYPES.has(notification.type)) {
    return NotificationCategoryId.WalletActivity;
  }

  if (notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT) {
    return NotificationCategoryId.Marketing;
  }

  if (notification.type === TRIGGER_TYPES.PLATFORM) {
    const { notification_type: rawNotificationType } =
      notification as unknown as PlatformNotificationLike;
    const mappedCategory = rawNotificationType
      ? PLATFORM_NOTIFICATION_TYPE_TO_CATEGORY[rawNotificationType]
      : undefined;
    return mappedCategory ?? NotificationCategoryId.Marketing;
  }

  return undefined;
}
