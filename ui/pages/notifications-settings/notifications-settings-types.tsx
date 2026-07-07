import React, { useState, useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  IconName,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { useSwitchFeatureAnnouncementsChange } from '../../hooks/metamask-notifications/useSwitchNotifications';
import {
  NotificationsSettingsBox,
  NotificationsSettingsType,
} from '../../components/multichain';
import { selectIsFeatureAnnouncementsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function NotificationsSettingsTypes({
  disabled,
}: {
  disabled: boolean;
}) {
  // Context
  const t = useI18nContext();
  const { listNotifications } = useMetamaskNotificationsContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  // Selectors
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );

  // Hooks
  const {
    onChange: onChangeFeatureAnnouncements,
    error: errorFeatureAnnouncements,
  } = useSwitchFeatureAnnouncementsChange();

  // States
  const [featureAnnouncementsEnabled, setFeatureAnnouncementsEnabled] =
    useState<boolean>(isFeatureAnnouncementsEnabled);

  const onToggleFeatureAnnouncements = async () => {
    setFeatureAnnouncementsEnabled(!featureAnnouncementsEnabled);
    try {
      onChangeFeatureAnnouncements(!featureAnnouncementsEnabled);
      trackEvent({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.NotificationsSettingsUpdated,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          settings_type: 'product_announcements',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          old_value: featureAnnouncementsEnabled,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_value: !featureAnnouncementsEnabled,
        },
      });
      listNotifications();
    } catch (error) {
      setFeatureAnnouncementsEnabled(featureAnnouncementsEnabled);
    }
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Stretch}
      gap={0}
      data-testid="notifications-settings-per-types"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={2}
        paddingBottom={4}
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
        >
          {t('customizeYourNotifications')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Regular}
          color={TextColor.TextAlternative}
        >
          {t('customizeYourNotificationsText')}
        </Text>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Start}
        alignItems={BoxAlignItems.Stretch}
        gap={6}
      >
        {/* Product announcements */}
        <NotificationsSettingsBox
          value={featureAnnouncementsEnabled}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onToggle={onToggleFeatureAnnouncements}
          error={errorFeatureAnnouncements}
          disabled={disabled}
          dataTestId="product-announcements"
        >
          <NotificationsSettingsType
            icon={IconName.Star}
            title={t('productAnnouncements')}
          />
        </NotificationsSettingsBox>
      </Box>
    </Box>
  );
}
