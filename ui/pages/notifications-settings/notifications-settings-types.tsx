import React, { useMemo } from 'react';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getIsPerpsIncludedInBuild } from '../../../shared/lib/environment';

export type NotificationsSettingsSectionType =
  | 'walletActivity'
  | 'perps'
  | 'marketing';

export type NotificationsSettingsSectionConfig = {
  type: NotificationsSettingsSectionType;
  title: string;
  description: string;
  iconName: IconName;
};

type NotificationsSettingsTypesProps = {
  preferences?: NotificationPreferences | null;
  onSelectSection: (section: NotificationsSettingsSectionConfig) => void;
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

const NotificationSectionRow = ({
  section,
  status,
  onClick,
}: {
  section: NotificationsSettingsSectionConfig;
  status: string;
  onClick: () => void;
}) => {
  return (
    <button
      className="w-full border-0 bg-transparent p-0 text-left text-inherit cursor-pointer hover:bg-background-default-hover"
      data-testid={`notifications-settings-section-${section.type}`}
      onClick={onClick}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="w-full min-w-0 py-2"
        gap={4}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          className="min-w-0"
          gap={4}
        >
          <Icon
            name={section.iconName}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Start}
            className="min-w-0"
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
            >
              {section.title}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Regular}
              color={TextColor.TextAlternative}
            >
              {status}
            </Text>
          </Box>
        </Box>
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
        />
      </Box>
    </button>
  );
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
      iconName: IconName.Global,
    });
  }

  nextSections.push({
    type: 'marketing',
    title: t('notificationsSettingsMarketingTitle'),
    description: t('notificationsSettingsMarketingDescription'),
    iconName: IconName.Star,
  });

  return nextSections;
};

export function NotificationsSettingsTypes({
  preferences,
  onSelectSection,
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
      gap={0}
      data-testid="notifications-settings-per-types"
    >
      {sections.map((section) => (
        <NotificationSectionRow
          key={section.type}
          section={section}
          status={getStatusText(t, preferences?.[section.type])}
          onClick={() => onSelectSection(section)}
        />
      ))}
    </Box>
  );
}
