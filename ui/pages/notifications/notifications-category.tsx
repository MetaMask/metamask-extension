import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { FilterTabBar, type FilterTab } from '../../components/ui/filter-tab-bar';

/**
 * Identifiers for the notification categories surfaced in the category tab bar.
 */
export enum NotificationCategoryId {
  All = 'all',
  WalletActivity = 'wallet-activity',
  Perps = 'perps',
  Marketing = 'marketing',
}

export const NOTIFICATIONS_CATEGORY_TEST_IDS = {
  ALL: 'notifications-category-all',
  WALLET_ACTIVITY: 'notifications-category-wallet-activity',
  PERPS: 'notifications-category-perps',
  MARKETING: 'notifications-category-marketing',
} as const;

type NotificationsCategoryProps = {
  /** Called with the selected category whenever the user picks a tab. */
  onSelect: (category: NotificationCategoryId) => void;
};

/**
 * Horizontally scrollable category filter for the notifications list. The
 * activity-related categories only appear when MetaMask notifications are
 * enabled.
 *
 * NOTE: the mobile app also exposes a "Trading Signals" (social) category gated
 * on a social-leaderboard feature flag. The extension has no equivalent flag
 * yet, so that category is intentionally omitted here.
 *
 * @param props - The component props.
 * @param props.onSelect - Called with the selected category when a tab is picked.
 * @returns The rendered category tab bar.
 */
export const NotificationsCategory = ({
  onSelect,
}: NotificationsCategoryProps) => {
  const t = useI18nContext();
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const [selectedCategory, setSelectedCategory] =
    useState<NotificationCategoryId>(NotificationCategoryId.All);

  const tabs = useMemo<FilterTab[]>(() => {
    const items: FilterTab[] = [
      {
        key: NotificationCategoryId.All,
        label: t('all'),
        testId: NOTIFICATIONS_CATEGORY_TEST_IDS.ALL,
      },
    ];

    if (isMetamaskNotificationsEnabled) {
      items.push(
        {
          key: NotificationCategoryId.WalletActivity,
          label: t('notificationCategoryWalletActivity'),
          testId: NOTIFICATIONS_CATEGORY_TEST_IDS.WALLET_ACTIVITY,
        },
        {
          key: NotificationCategoryId.Perps,
          label: t('notificationCategoryPerps'),
          testId: NOTIFICATIONS_CATEGORY_TEST_IDS.PERPS,
        },
        {
          key: NotificationCategoryId.Marketing,
          label: t('notificationCategoryMarketing'),
          testId: NOTIFICATIONS_CATEGORY_TEST_IDS.MARKETING,
        },
      );
    }

    return items;
  }, [isMetamaskNotificationsEnabled, t]);

  const handleSelect = (key: string) => {
    const category = key as NotificationCategoryId;
    setSelectedCategory(category);
    onSelect(category);
  };

  return (
    <FilterTabBar
      tabs={tabs}
      selectedKey={selectedCategory}
      onSelect={handleSelect}
    />
  );
};
