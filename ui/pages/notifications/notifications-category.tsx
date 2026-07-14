import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Skeleton } from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useNotificationCategories } from '../../hooks/metamask-notifications/useNotificationCategories';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
import {
  FilterTabBar,
  type FilterTab,
} from '../../components/ui/filter-tab-bar';
import { ALL_NOTIFICATIONS_CATEGORY_ID } from './notification-categories-types';

export const NOTIFICATIONS_CATEGORY_TEST_IDS = {
  ALL: 'notifications-category-all',
} as const;

const SKELETON_TAB_WIDTHS = [41, 117, 124, 123, 140];

const CategoryTabsSkeleton = () => (
  <>
    {SKELETON_TAB_WIDTHS.map((width, index) => (
      <Skeleton
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        height={32}
        width={width}
        className="flex-shrink-0 rounded-lg"
        data-testid="notifications-category-skeleton"
      />
    ))}
  </>
);

type NotificationsCategoryProps = {
  /** Called with the selected category id whenever the user picks a tab. */
  onSelect: (categoryId: string) => void;
};

/**
 * Horizontally scrollable category filter for the notifications list. Tabs
 * (besides "All") are driven entirely by the BE notification-categories
 * catalog and only appear when MetaMask notifications are enabled.
 *
 * @param props - The component props.
 * @param props.onSelect - Called with the selected category id when a tab is picked.
 * @returns The rendered category tab bar.
 */
export const NotificationsCategory = ({
  onSelect,
}: NotificationsCategoryProps) => {
  const t = useI18nContext();
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const { categories, isLoading: isLoadingCategories } =
    useNotificationCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ALL_NOTIFICATIONS_CATEGORY_ID,
  );

  const tabs = useMemo<FilterTab[]>(() => {
    const items: FilterTab[] = [
      {
        key: ALL_NOTIFICATIONS_CATEGORY_ID,
        label: t('all'),
        testId: NOTIFICATIONS_CATEGORY_TEST_IDS.ALL,
      },
    ];

    if (isMetamaskNotificationsEnabled) {
      items.push(
        ...categories.map((category) => ({
          key: category.categoryId,
          label: category.label,
          testId: `notifications-category-${category.categoryId}`,
        })),
      );
    }

    return items;
  }, [categories, isMetamaskNotificationsEnabled, t]);

  const handleSelect = (key: string) => {
    setSelectedCategory(key);
    onSelect(key);
  };

  const isLoadingCategoryTabs =
    isMetamaskNotificationsEnabled &&
    isLoadingCategories &&
    categories.length === 0;

  if (!isMetamaskNotificationsEnabled) {
    return null;
  }

  return (
    <Box className="flex flex-shrink-0 flex-row gap-2 overflow-x-auto px-4 py-1">
      {isLoadingCategoryTabs ? (
        <CategoryTabsSkeleton />
      ) : (
        <FilterTabBar
          tabs={tabs}
          selectedKey={selectedCategory}
          onSelect={handleSelect}
        />
      )}
    </Box>
  );
};
