import React, { useMemo } from 'react';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  BoxFlexDirection,
  BoxAlignItems,
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
  const { categories } = useNotificationCategories();

  const sections = useMemo<NotificationsSettingsSectionConfig[]>(
    () => getNotificationsSettingsSectionConfigs(categories),
    [categories],
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      className="-mx-4"
      data-testid="notifications-settings-per-types"
    >
      {sections.map((section) => (
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
