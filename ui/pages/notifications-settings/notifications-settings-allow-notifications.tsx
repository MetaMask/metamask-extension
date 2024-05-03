import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  useEnableNotifications,
  useDisableNotifications,
} from '../../hooks/metamask-notifications/useNotifications';
import { selectIsMetamaskNotificationsEnabled } from '../../selectors/metamask-notifications/metamask-notifications';
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
  disabled,
}: {
  disabled: boolean;
}) {
  const t = useI18nContext();

  const { listNotifications } = useMetamaskNotificationsContext();
  const { enableNotifications, error: errorEnableNotifications } =
    useEnableNotifications();
  const { disableNotifications, error: errorDisableNotifications } =
    useDisableNotifications();

  const error = errorEnableNotifications || errorDisableNotifications;

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const [toggleState, setToggleState] = useState<boolean>(
    isMetamaskNotificationsEnabled,
  );

  useEffect(() => {
    if (isMetamaskNotificationsEnabled && !error) {
      listNotifications();
    }
  }, [isMetamaskNotificationsEnabled, error]);

  const toggleNotifications = async () => {
    setToggleState(!isMetamaskNotificationsEnabled);
    if (isMetamaskNotificationsEnabled) {
      await disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  const privacyLink = (
    <Text
      as="a"
      href="https://metamask.io/privacy.html"
      target="_blank"
      rel="noopener noreferrer"
      key="privacy-link"
      color={TextColor.infoDefault}
    >
      {t('notificationsSettingsPageAllowNotificationsLink')}
    </Text>
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
        value={toggleState}
        onToggle={toggleNotifications}
        disabled={disabled}
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
