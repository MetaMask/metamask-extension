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
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { SettingsSelectItem } from '../settings/shared';
import {
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
  type NotificationsSettingsSectionType,
} from '../../../shared/lib/notifications-settings';

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

export const getNotificationsSettingsSectionConfigs = (
  t: ReturnType<typeof useI18nContext>,
): NotificationsSettingsSectionConfig[] => {
  const nextSections: NotificationsSettingsSectionConfig[] = [
    {
      type: 'walletActivity',
      title: t('notificationsSettingsWalletActivityTitle'),
      description: t('notificationsSettingsWalletActivityDescription'),
      iconName: IconName.Clock,
    },
  ];

  nextSections.push({
    type: 'perps',
    title: t('notificationsSettingsPerpsTitle'),
    description: t('notificationsSettingsPerpsDescription'),
    iconName: IconName.Candlestick,
  });

  nextSections.push({
    type: 'agenticCli',
    title: t('notificationsSettingsAgenticCliTitle'),
    description: t('notificationsSettingsAgenticCliDescription'),
    iconName: IconName.Code,
  });

  nextSections.push({
    type: 'marketing',
    title: t('notificationsSettingsMarketingTitle'),
    description: t('notificationsSettingsMarketingDescription'),
    iconName: IconName.Campaign,
  });
  // WARNING: This marketing section must ALWAYS remain the very last item in the array.
  // New sections must be added ABOVE this entry (never below).
  return nextSections;
};

export function NotificationsSettingsTypes({
  preferences,
}: NotificationsSettingsTypesProps) {
  const t = useI18nContext();

  const sections = useMemo<NotificationsSettingsSectionConfig[]>(
    () => getNotificationsSettingsSectionConfigs(t),
    [t],
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
          value={
            section.type === 'walletActivity'
              ? ''
              : getStatusText(t, preferences?.[section.type])
          }
          to={NOTIFICATIONS_SETTINGS_SECTION_ROUTES[section.type]}
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
