import React, { useMemo } from 'react';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Skeleton,
} from '@metamask/design-system-react';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getIsPerpsIncludedInBuild } from '../../../shared/lib/environment';
import { useNotificationCategories } from '../../hooks/metamask-notifications/useNotificationCategories';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { NotificationCategoryId, type NotificationCategoryMetadata } from '../notifications/notification-categories-types';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { SettingsSelectItem } from '../settings/shared';
import { getNotificationsSettingsSectionRoute } from './notifications-settings-routes';

// Any category the BE catalog returns is routable via the generic
// notifications settings sub-page - the section type is just its id.
export type NotificationsSettingsSectionType = Exclude<
  NotificationCategoryId,
  NotificationCategoryId.All
>;

export type NotificationsSettingsSectionConfig = {
  type: NotificationsSettingsSectionType;
  title: string;
  description: string;
  iconName: IconName;
};

type NotificationsSettingsTypesProps = {
  preferences?: NotificationPreferences | null;
};

const getStatusText = (
  t: ReturnType<typeof useI18nContext>,
  prefs?: NotificationPreferences[NotificationsSettingsSectionType],
) => {
  const active = [];
  if (prefs?.pushNotificationsEnabled) {
    active.push(t('notificationsSettingsStatusPush'));
  }
  if (prefs?.inAppNotificationsEnabled) {
    active.push(t('notificationsSettingsStatusInApp'));
  }

  return active.length > 0
    ? active.join(', ')
    : t('notificationsSettingsStatusOff');
};

const getIconNameFromCategoryIcon = (icon: string): IconName =>
  (IconName as unknown as Record<string, IconName>)[icon] ?? IconName.Setting;

// Matches the real category count (walletActivity/perps/socialAI/marketing/
// agenticCli); title widths vary per row so the skeleton doesn't look like a
// repeated tile.
const SKELETON_TITLE_WIDTHS = [159, 120, 140, 100, 86];

const NotificationsSettingsRowSkeleton = ({
  titleWidth,
}: {
  titleWidth: number;
}) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    justifyContent={BoxJustifyContent.Between}
    alignItems={BoxAlignItems.Center}
    paddingVertical={3}
    paddingHorizontal={4}
  >
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
    >
      <Skeleton height={24} width={24} className="rounded" />
      <Skeleton height={24} width={titleWidth} className="rounded" />
    </Box>
    <Skeleton height={24} width={110} className="rounded" />
  </Box>
);

/**
 * Builds the section list for the notifications settings screen from the BE
 * category catalog. A section is omitted until its category has loaded
 * (`categories` starts empty while the fetch is in flight).
 *
 * @param categories - The fetched BE notification category catalog.
 * @returns The section configs to render, in display order.
 */
export const getNotificationsSettingsSectionConfigs = (
  categories: NotificationCategoryMetadata[],
): NotificationsSettingsSectionConfig[] =>
  categories
    .filter(
      (category) =>
        category.id !== NotificationCategoryId.Perps ||
        getIsPerpsIncludedInBuild(),
    )
    .map((category) => ({
      type: category.id,
      title: category.label,
      description: category.description,
      iconName: getIconNameFromCategoryIcon(category.icon),
    }));

export function NotificationsSettingsTypes({
  preferences,
}: NotificationsSettingsTypesProps) {
  const t = useI18nContext();
  const { categories, isLoading: isLoadingCategories } =
    useNotificationCategories();

  const sections = useMemo<NotificationsSettingsSectionConfig[]>(
    () => getNotificationsSettingsSectionConfigs(categories),
    [categories],
  );

  const isLoadingSections = isLoadingCategories && sections.length === 0;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      className="-mx-4"
      data-testid="notifications-settings-per-types"
    >
      {isLoadingSections &&
        SKELETON_TITLE_WIDTHS.map((titleWidth, index) => (
          <NotificationsSettingsRowSkeleton
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            titleWidth={titleWidth}
          />
        ))}
      {!isLoadingSections &&
        sections.map((section) => (
          <SettingsSelectItem
            key={section.type}
            label={section.title}
            value={getStatusText(t, preferences?.[section.type])}
            to={getNotificationsSettingsSectionRoute(section.type)}
            dataTestId={`notifications-settings-section-${section.type}`}
            startAccessory={
              <Icon
                name={section.iconName}
                size={IconSize.Lg}
                color={IconColor.IconAlternative}
              />
            }
          />
        ))}
    </Box>
  );
}
