import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useContext,
} from 'react';
import { useSelector } from 'react-redux';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { Box, Text } from '../../components/component-library';
import {
  NotificationsSettingsBox,
  NotificationsSettingsType,
} from '../../components/multichain';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextColor,
} from '../../helpers/constants/design-system';
import {
  useEnableNotifications,
  useDisableNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import { useI18nContext } from '../../hooks/useI18nContext';
import { selectIsProfileSyncingEnabled } from '../../selectors/identity/profile-syncing';
import {
  selectIsMetamaskNotificationsEnabled,
  getIsUpdatingMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';

export function NotificationsSettingsAllowNotifications({
  loading,
  setLoading,
  disabled,
  dataTestId,
}: {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  disabled: boolean;
  dataTestId: string;
}) {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { listNotifications } = useMetamaskNotificationsContext();
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const [toggleValue, setToggleValue] = useState(
    isMetamaskNotificationsEnabled,
  );
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

  const { enableNotifications, error: errorEnableNotifications } =
    useEnableNotifications();
  const { disableNotifications, error: errorDisableNotifications } =
    useDisableNotifications();
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31880
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
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      trackEvent({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.NotificationsSettingsUpdated,
        properties: {
          settings_type: 'notifications',
          was_profile_syncing_on: isProfileSyncingEnabled,
          old_value: true,
          new_value: false,
        },
      });
      await disableNotifications();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      trackEvent({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.NotificationsSettingsUpdated,
        properties: {
          settings_type: 'notifications',
          was_profile_syncing_on: isProfileSyncingEnabled,
          old_value: false,
          new_value: true,
        },
      });
      await enableNotifications();
    }
    setLoading(false);
    setToggleValue(!toggleValue);
  }, [
    setLoading,
    isMetamaskNotificationsEnabled,
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
    >
      <NotificationsSettingsBox
        value={toggleValue}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31879
        onToggle={toggleNotifications}
        disabled={disabled}
        loading={loading}
        dataTestId={dataTestId}
      >
        <NotificationsSettingsType title={t('allowNotifications')} />
      </NotificationsSettingsBox>
      <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
        {t('notificationsSettingsPageAllowNotifications', [privacyLink])}
      </Text>
      {error && (
        <Box>
          <Text as="p" color={TextColor.errorDefault}>
            {isMetamaskNotificationsEnabled
              ? t('turnOffMetamaskNotificationsError')
              : t('turnOnMetamaskNotificationsError')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
