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
import type {
  NotificationPreferenceChannelKey,
  NotificationPreferenceSection,
} from '../../hooks/metamask-notifications/useNotificationPreferences';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import type { NotificationCategoryMetadata } from '../notifications/notification-categories-types';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { SettingsSelectItem } from '../settings/shared';
import { getNotificationsSettingsSectionRoute } from './notifications-settings-routes';

export type NotificationsSettingsSectionConfig = {
  /** BE-assigned, free-form category id - only used for routing/keys. */
  categoryId: string;
  /** AUS preference keys this category's toggles read/write - see `getAusKeyPreferences`. */
  ausKeys: string[];
  title: string;
  description: string;
  iconName: IconName;
};

const isAusKey = (
  key: string,
  preferences: NotificationPreferences,
): key is NotificationPreferenceSection => key in preferences;

/**
 * Resolves a category's `ausKeys` to their actual preference objects,
 * skipping any key the current `NotificationPreferences` shape doesn't
 * recognize (e.g. a BE-added key the client hasn't been told about yet).
 *
 * @param preferences - The user's notification preferences.
 * @param ausKeys - The AUS preference keys backing a category.
 * @returns The resolved preference object for each known key.
 */
export const getAusKeyPreferences = (
  preferences: NotificationPreferences | null | undefined,
  ausKeys: string[],
): NotificationPreferences[NotificationPreferenceSection][] => {
  if (!preferences) {
    return [];
  }
  return ausKeys
    .filter((key): key is NotificationPreferenceSection =>
      isAusKey(key, preferences),
    )
    .map((key) => preferences[key]);
};

/**
 * A category can span multiple AUS preferences - its push/in-app toggle
 * reads as "on" only when every one of them is on, and (see
 * `notification-settings-section.tsx`) toggling writes that value to all of
 * them at once.
 *
 * @param preferences - The user's notification preferences.
 * @param ausKeys - The AUS preference keys backing a category.
 * @param channelKey - Which channel (push or in-app) to check.
 * @returns Whether every backing preference has that channel enabled.
 */
export const isChannelEnabledForAusKeys = (
  preferences: NotificationPreferences | null | undefined,
  ausKeys: string[],
  channelKey: NotificationPreferenceChannelKey,
): boolean => {
  const entries = getAusKeyPreferences(preferences, ausKeys);
  return (
    entries.length > 0 && entries.every((entry) => Boolean(entry?.[channelKey]))
  );
};

type NotificationsSettingsTypesProps = {
  preferences?: NotificationPreferences | null;
};

const getStatusText = (
  t: ReturnType<typeof useI18nContext>,
  preferences: NotificationPreferences | null | undefined,
  ausKeys: string[],
) => {
  const active = [];
  if (
    isChannelEnabledForAusKeys(preferences, ausKeys, 'pushNotificationsEnabled')
  ) {
    active.push(t('notificationsSettingsStatusPush'));
  }
  if (
    isChannelEnabledForAusKeys(
      preferences,
      ausKeys,
      'inAppNotificationsEnabled',
    )
  ) {
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
 * (`categories` starts empty while the fetch is in flight). Which AUS keys
 * a category's toggles affect is BE-driven via `ausKeys`, not hardcoded on
 * the client.
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
        !category.ausKeys.includes('perps') || getIsPerpsIncludedInBuild(),
    )
    .map((category) => ({
      categoryId: category.categoryId,
      ausKeys: category.ausKeys,
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
            key={section.categoryId}
            label={section.title}
            value={getStatusText(t, preferences, section.ausKeys)}
            to={getNotificationsSettingsSectionRoute(section.categoryId)}
            dataTestId={`notifications-settings-section-${section.categoryId}`}
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
