import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useEnableNotifications } from '../../hooks/metamask-notifications/useNotifications';
import { selectIsCreatingMetamaskNotifications } from '../../selectors/metamask-notifications/metamask-notifications';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  Box,
  Button,
  ButtonSize,
  Text,
} from '../../components/component-library';
import {
  TextAlign,
  BlockSize,
  Display,
  FontWeight,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';

export const NotificationsListTurnOnNotifications = () => {
  const t = useI18nContext();

  const { listNotifications } = useMetamaskNotificationsContext();

  const { enableNotifications, error: errorEnableNotifications } =
    useEnableNotifications();

  const error = errorEnableNotifications;

  const isCreatingMetamaskNotifications = useSelector(
    selectIsCreatingMetamaskNotifications,
  );

  const [loading, setLoading] = useState<boolean>(
    isCreatingMetamaskNotifications || false,
  );

  useEffect(() => {
    setLoading(isCreatingMetamaskNotifications);
  }, [isCreatingMetamaskNotifications]);

  const handleTurnOnNotifications = async () => {
    await enableNotifications();
    if (!error && !isCreatingMetamaskNotifications) {
      listNotifications();
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
      {t('turnOnMetamaskNotificationsMessagePrivacyLink')}
    </Text>
  );

  const strongText = (
    <Text as="span" fontWeight={FontWeight.Bold} key="strong-text">
      {t('turnOnMetamaskNotificationsMessagePrivacyBold')}
    </Text>
  );

  return (
    <Box
      height={BlockSize.Full}
      width={BlockSize.Full}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      gap={2}
      data-testid="notifications-list-turn-on-notifications"
      textAlign={TextAlign.Center}
      paddingLeft={4}
      paddingRight={4}
    >
      <Text variant={TextVariant.headingSm}>
        {t('metamaskNotificationsAreOff')}
      </Text>
      <Text as="p" paddingTop={4}>
        {t('turnOnMetamaskNotificationsMessageSecond', [privacyLink])}
      </Text>
      <Text as="p" paddingTop={4}>
        {t('turnOnMetamaskNotificationsMessageThird', [strongText])}
      </Text>
      <Box paddingTop={4}>
        <Button
          onClick={() => handleTurnOnNotifications()}
          size={ButtonSize.Md}
          disabled={loading}
          loading={loading}
        >
          {t('turnOnMetamaskNotificationsButton')}
        </Button>
        {error && (
          <Text as="p" color={TextColor.errorDefault} paddingTop={4}>
            {t('turnOnMetamaskNotificationsError')}
          </Text>
        )}
      </Box>
    </Box>
  );
};
