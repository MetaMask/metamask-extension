import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useContext,
} from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  useEnableNotifications,
  useDisableNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import {
  selectIsNotificationServicesEnabled,
  getIsUpdatingMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { Box, Text } from '../../components/component-library';
import {
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

export function NotificationsSettingsAllowNotifications({
  loading,
  setLoading,
  disabled,
}: {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  disabled: boolean;
}) {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { listNotifications } = useMetamaskNotificationsContext();
  const isNotificationServicesEnabled = useSelector(
    selectIsNotificationServicesEnabled,
  );
  const [toggleValue, setToggleValue] = useState(isNotificationServicesEnabled);
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

  const { enableNotifications, error: errorEnableNotifications } =
    useEnableNotifications();
  const { disableNotifications, error: errorDisableNotifications } =
    useDisableNotifications();
  const error = errorEnableNotifications || errorDisableNotifications;

  useEffect(() => {
    setLoading(isUpdatingMetamaskNotifications);
  }, [isUpdatingMetamaskNotifications, setLoading]);

  useEffect(() => {
    setToggleValue(isNotificationServicesEnabled);
  }, [isNotificationServicesEnabled]);

  useEffect(() => {
    if (isNotificationServicesEnabled && !error) {
      listNotifications();
    }
  }, [isNotificationServicesEnabled, error, listNotifications]);

  const toggleNotifications = useCallback(async () => {
    setLoading(true);
    if (isNotificationServicesEnabled) {
      await disableNotifications();
      trackEvent({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.DisablingNotifications,
      });
    } else {
      await enableNotifications();
      trackEvent({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.EnablingNotifications,
        properties: {
          isProfileSyncingEnabled,
        },
      });
    }
    setLoading(false);
    setToggleValue(!toggleValue);
  }, [
    setLoading,
    isNotificationServicesEnabled,
    disableNotifications,
    enableNotifications,
    toggleValue,
  ]);

  const privacyLink = useMemo(
    () => (
      <Text
        as="a"
        href="https://support.metamask.io/privacy-and-security/profile-privacy"
        target="_blank"
        rel="noopener noreferrer"
        key="privacy-link"
        color={TextColor.infoDefault}
      >
        {t('notificationsSettingsPageAllowNotificationsLink')}
      </Text>
    ),
    [t],
  );

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.flexStart}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.flexStart}
      gap={4}
      paddingLeft={8}
      paddingRight={8}
      paddingBottom={8}
      data-testid="notifications-settings-allow-notifications"
    >
      <NotificationsSettingsBox
        value={toggleValue}
        onToggle={toggleNotifications}
        disabled={disabled}
        loading={loading}
      >
        <NotificationsSettingsType title={t('allowNotifications')} />
      </NotificationsSettingsBox>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {t('notificationsSettingsPageAllowNotifications', [privacyLink])}
      </Text>
      {error && (
        <Box>
          <Text as="p" color={TextColor.errorDefault}>
            {isNotificationServicesEnabled
              ? t('turnOffMetamaskNotificationsError')
              : t('turnOnMetamaskNotificationsError')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
