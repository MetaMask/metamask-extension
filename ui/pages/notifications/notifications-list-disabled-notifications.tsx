import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useEnableNotifications } from '../../hooks/metamask-notifications/useNotifications';
import { getIsUpdatingMetamaskNotifications } from '../../selectors/metamask-notifications/metamask-notifications';

export const NotificationsListDisabledNotifications = () => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const { listNotifications } = useMetamaskNotificationsContext();
  const { enableNotifications, error: errorEnableNotifications } =
    useEnableNotifications();
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const [loading, setLoading] = useState(isUpdatingMetamaskNotifications);

  useEffect(() => {
    setLoading(isUpdatingMetamaskNotifications);
  }, [isUpdatingMetamaskNotifications]);

  const handleTurnOnNotifications = useCallback(async () => {
    trackEvent({
      category: MetaMetricsEventCategory.NotificationSettings,
      event: MetaMetricsEventName.NotificationsSettingsUpdated,
      properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        settings_type: 'master',
        notification_channel: 'all',
        enabled: true,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });
    setLoading(true);
    try {
      await enableNotifications();
      listNotifications();
    } finally {
      setLoading(false);
    }
  }, [enableNotifications, listNotifications, trackEvent]);

  return (
    <Box
      className="h-full w-full px-4 pt-4 text-center"
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Column}
      gap={3}
      data-testid="notifications-list-disabled-notifications"
    >
      <Icon name={IconName.Notification} size={IconSize.Xl} />
      <Box>
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
          {t('metamaskNotificationsAreOff')}
        </Text>
        <Text variant={TextVariant.BodySm}>
          {t('notificationsSettingsPageAllowNotifications')}
        </Text>
      </Box>
      <Button
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick={handleTurnOnNotifications}
        size={ButtonSize.Md}
        variant={ButtonVariant.Secondary}
        disabled={loading}
        data-testid="notifications-list-turn-on-notifications-button"
      >
        {t('turnOnMetamaskNotificationsButton')}
      </Button>
      {errorEnableNotifications && (
        <Text color={TextColor.ErrorDefault}>
          {t('turnOnMetamaskNotificationsError')}
        </Text>
      )}
    </Box>
  );
};
