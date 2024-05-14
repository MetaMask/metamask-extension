import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  useSwitchFeatureAnnouncementsChange,
  useSwitchSnapNotificationsChange,
} from '../../hooks/metamask-notifications/useSwitchNotifications';
import { Box, IconName, Text } from '../../components/component-library';
import {
  BlockSize,
  BorderColor,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextColor,
} from '../../helpers/constants/design-system';
import {
  NotificationsSettingsBox,
  NotificationsSettingsType,
} from '../../components/multichain';
import {
  selectIsSnapNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
} from '../../selectors/metamask-notifications/metamask-notifications';

export function NotificationsSettingsTypes({
  disabled,
}: {
  disabled: boolean;
}) {
  // Context
  const t = useI18nContext();
  const { listNotifications } = useMetamaskNotificationsContext();

  // Selectors
  const isSnapNotificationsEnabled = useSelector(
    selectIsSnapNotificationsEnabled,
  );
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );

  // Hooks
  const { onChange: onChangeSnapNotifications, error: errorSnapNotifications } =
    useSwitchSnapNotificationsChange();
  const {
    onChange: onChangeFeatureAnnouncements,
    error: errorFeatureAnnouncements,
  } = useSwitchFeatureAnnouncementsChange();

  // States
  const [snapNotificationsEnabled, setSnapNotificationsEnabled] =
    useState<boolean>(isSnapNotificationsEnabled);
  const [featureAnnouncementsEnabled, setFeatureAnnouncementsEnabled] =
    useState<boolean>(isFeatureAnnouncementsEnabled);

  const onToggleSnapNotifications = async () => {
    setSnapNotificationsEnabled(!snapNotificationsEnabled);
    try {
      onChangeSnapNotifications(!snapNotificationsEnabled);
      listNotifications();
    } catch (error) {
      setSnapNotificationsEnabled(snapNotificationsEnabled);
    }
  };

  const onToggleFeatureAnnouncements = async () => {
    setFeatureAnnouncementsEnabled(!featureAnnouncementsEnabled);
    try {
      onChangeFeatureAnnouncements(!featureAnnouncementsEnabled);
      listNotifications();
    } catch (error) {
      setFeatureAnnouncementsEnabled(featureAnnouncementsEnabled);
    }
  };

  return (
    <>
      <Box
        paddingLeft={8}
        paddingRight={8}
        paddingBottom={4}
        paddingTop={4}
        data-testid="notifications-settings-per-types"
      >
        <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
          {t('customizeYourNotifications')}
        </Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          {t('customizeYourNotificationsText')}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexStart}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        gap={6}
        paddingLeft={8}
        paddingRight={8}
        paddingBottom={4}
      >
        {/* Snap notifications */}
        <NotificationsSettingsBox
          value={snapNotificationsEnabled}
          onToggle={onToggleSnapNotifications}
          error={errorSnapNotifications}
          disabled={disabled}
        >
          <NotificationsSettingsType icon={IconName.Snaps} title={t('snaps')} />
        </NotificationsSettingsBox>

        {/* Product announcements */}
        <NotificationsSettingsBox
          value={featureAnnouncementsEnabled}
          onToggle={onToggleFeatureAnnouncements}
          error={errorFeatureAnnouncements}
          disabled={disabled}
        >
          <NotificationsSettingsType
            icon={IconName.Star}
            title={t('productAnnouncements')}
          />
        </NotificationsSettingsBox>
      </Box>
      <Box
        borderColor={BorderColor.borderMuted}
        width={BlockSize.Full}
        style={{ height: '1px', borderBottomWidth: 0 }}
      ></Box>
    </>
  );
}
