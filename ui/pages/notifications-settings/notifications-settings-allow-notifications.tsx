import React, { useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import {
  useEnableNotifications,
  useDisableNotifications,
  useSafeState,
} from '../../hooks/metamask-notifications/useNotifications';
import {
  selectIsMetamaskNotificationsEnabled,
  getIsUpdatingMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { selectIsBackupAndSyncEnabled } from '../../selectors/identity/backup-and-sync';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  NotificationsSettingsBox,
  NotificationsSettingsType,
} from '../../components/multichain';

export function NotificationsSettingsAllowNotifications({
  loading,
  setLoading,
  disabled,
  dataTestId,
  refetchPreferences,
}: {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  disabled: boolean;
  dataTestId: string;
  refetchPreferences?: () => Promise<unknown>;
}) {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { listNotifications } = useMetamaskNotificationsContext();
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const [toggleValue, setToggleValue] = useSafeState(
    isMetamaskNotificationsEnabled,
  );
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const { enableNotifications, error: errorEnableNotifications } =
    useEnableNotifications();
  const { disableNotifications, error: errorDisableNotifications } =
    useDisableNotifications();
  const error = errorEnableNotifications || errorDisableNotifications;

  useEffect(() => {
    setLoading(isUpdatingMetamaskNotifications);
  }, [isUpdatingMetamaskNotifications, setLoading]);

  useEffect(() => {
    setToggleValue(isMetamaskNotificationsEnabled);
  }, [isMetamaskNotificationsEnabled]);

  useEffect(() => {
    if (!error && isMetamaskNotificationsEnabled) {
      listNotifications();
    }
  }, [isMetamaskNotificationsEnabled, error, listNotifications]);

  const toggleNotifications = useCallback(async () => {
    setLoading(true);
    if (isMetamaskNotificationsEnabled) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NotificationsSettingsUpdated)
          .addCategory(MetaMetricsEventCategory.NotificationSettings)
          .addProperties({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            settings_type: 'notifications',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            was_profile_syncing_on: isBackupAndSyncEnabled,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            old_value: true,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_value: false,
          })
          .build(),
      );
      await disableNotifications();
    } else {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NotificationsSettingsUpdated)
          .addCategory(MetaMetricsEventCategory.NotificationSettings)
          .addProperties({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            settings_type: 'notifications',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            was_profile_syncing_on: isBackupAndSyncEnabled,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            old_value: false,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_value: true,
          })
          .build(),
      );
      await enableNotifications();
      await refetchPreferences?.();
    }
    setLoading(false);
    setToggleValue(!toggleValue);
  }, [
    createEventBuilder,
    setLoading,
    isMetamaskNotificationsEnabled,
    disableNotifications,
    enableNotifications,
    refetchPreferences,
    toggleValue,
    isBackupAndSyncEnabled,
    trackEvent,
  ]);

  const privacyLink = useMemo(
    () => (
      <Text asChild color={TextColor.InfoDefault}>
        <a
          href={ZENDESK_URLS.PROFILE_PRIVACY}
          target="_blank"
          rel="noopener noreferrer"
          key="privacy-link"
        >
          {t('notificationsSettingsPageAllowNotificationsLink')}
        </a>
      </Text>
    ),
    [t],
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Start}
      alignItems={BoxAlignItems.Stretch}
      gap={1}
    >
      <NotificationsSettingsBox
        value={toggleValue}
        onToggle={toggleNotifications}
        disabled={disabled}
        loading={loading}
        dataTestId={dataTestId}
      >
        <NotificationsSettingsType title={t('allowNotifications')} />
      </NotificationsSettingsBox>
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Regular}
        color={TextColor.TextAlternative}
      >
        {t('notificationsSettingsPageAllowNotifications', [privacyLink])}
      </Text>
      {error && (
        <Box>
          <Text color={TextColor.ErrorDefault}>
            {isMetamaskNotificationsEnabled
              ? t('turnOffMetamaskNotificationsError')
              : t('turnOnMetamaskNotificationsError')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
