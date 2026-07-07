import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useNotificationCategories } from '../../hooks/metamask-notifications/useNotificationCategories';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import { FilterTabBar, type FilterTab } from '../../components/ui/filter-tab-bar';
import { NotificationCategoryId } from './notification-categories-types';

export const NOTIFICATIONS_CATEGORY_TEST_IDS = {
  ALL: 'notifications-category-all',
} as const;

type NotificationsCategoryProps = {
  /** Called with the selected category whenever the user picks a tab. */
  onSelect: (category: NotificationCategoryId) => void;
};

/**
 * Horizontally scrollable category filter for the notifications list. Tabs
 * (besides "All") are driven entirely by the BE notification-categories
 * catalog and only appear when MetaMask notifications are enabled.
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
  const { categories } = useNotificationCategories();
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
        ...categories.map((category) => ({
          key: category.id,
          label: category.label,
          testId: `notifications-category-${category.id}`,
        })),
      );
    }

    return items;
  }, [categories, isMetamaskNotificationsEnabled, t]);

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
      className="flex-shrink-0"
    />
  );
};
