import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import { NotificationCategoryId } from './notification-categories-types';
import { deriveNotificationCategory } from './derive-notification-category';

const buildNotification = (overrides: Record<string, unknown>) =>
  ({
    id: 'notification-id',
    createdAt: new Date().toISOString(),
    isRead: false,
    ...overrides,
  }) as never;

const buildPlatformNotification = (rawNotificationType: string) =>
  buildNotification({
    type: TRIGGER_TYPES.PLATFORM,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    notification_type: rawNotificationType,
  });

const ON_CHAIN_TRIGGER_TYPES: TRIGGER_TYPES[] = [
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
];

describe('deriveNotificationCategory', () => {
  ON_CHAIN_TRIGGER_TYPES.forEach((type) => {
    it(`categorizes on-chain trigger type ${type} as WalletActivity`, () => {
      expect(deriveNotificationCategory(buildNotification({ type }))).toBe(
        NotificationCategoryId.WalletActivity,
      );
    });
  });

  it('categorizes feature announcements as Marketing', () => {
    expect(
      deriveNotificationCategory(
        buildNotification({ type: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT }),
      ),
    ).toBe(NotificationCategoryId.Marketing);
  });

  it('categorizes snap notifications as uncategorized', () => {
    expect(
      deriveNotificationCategory(
        buildNotification({ type: TRIGGER_TYPES.SNAP }),
      ),
    ).toBeUndefined();
  });

  it('defaults today’s v3 platform notifications to Marketing', () => {
    expect(
      deriveNotificationCategory(buildPlatformNotification('platform')),
    ).toBe(NotificationCategoryId.Marketing);
  });

  it('discriminates future v4-shaped platform notifications by notification_type', () => {
    expect(
      deriveNotificationCategory(buildPlatformNotification('perps')),
    ).toBe(NotificationCategoryId.Perps);

    expect(
      deriveNotificationCategory(buildPlatformNotification('socialAI')),
    ).toBe(NotificationCategoryId.SocialAI);
  });
});
