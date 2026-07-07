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
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { SettingsSelectItem } from '../settings/shared';
import { getNotificationsSettingsSectionRoute } from './notifications-settings-routes';

export type NotificationsSettingsSectionType =
  | 'walletActivity'
  | 'perps'
  | 'marketing'
  | 'agenticCli';

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

  if (getIsPerpsIncludedInBuild()) {
    nextSections.push({
      type: 'perps',
      title: t('notificationsSettingsPerpsTitle'),
      description: t('notificationsSettingsPerpsDescription'),
      iconName: IconName.Candlestick,
    });
  }

  nextSections.push({
    type: 'marketing',
    title: t('notificationsSettingsMarketingTitle'),
    description: t('notificationsSettingsMarketingDescription'),
    iconName: IconName.Campaign,
  });

  nextSections.push({
    type: 'agenticCli',
    title: t('notificationsSettingsAgenticCliTitle'),
    description: t('notificationsSettingsAgenticCliDescription'),
    iconName: IconName.Code,
  });

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
