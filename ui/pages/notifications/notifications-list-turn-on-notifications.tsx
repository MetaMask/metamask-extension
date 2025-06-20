import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useEnableNotifications } from '../../hooks/metamask-notifications/useNotifications';
import { getIsUpdatingMetamaskNotifications } from '../../selectors/metamask-notifications/metamask-notifications';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  Box,
  Button,
  ButtonSize,
  Container,
  ContainerMaxWidth,
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
  BorderRadius,
} from '../../helpers/constants/design-system';

export const NotificationsListTurnOnNotifications = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const { listNotifications } = useMetamaskNotificationsContext();

  const { enableNotifications, error: errorEnableNotifications } =
    useEnableNotifications();

  const error = errorEnableNotifications;

  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );

  const [loading, setLoading] = useState<boolean>(
    isUpdatingMetamaskNotifications || false,
  );

  useEffect(() => {
    setLoading(isUpdatingMetamaskNotifications);
  }, [isUpdatingMetamaskNotifications]);

  const handleTurnOnNotifications = async () => {
    await enableNotifications();
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.EnablingNotifications,
    });
    if (!error && !isUpdatingMetamaskNotifications) {
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
    <Container
      maxWidth={ContainerMaxWidth.Sm}
      height={BlockSize.Full}
      margin="auto"
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      gap={4}
      data-testid="notifications-list-turn-on-notifications"
      textAlign={TextAlign.Center}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={4}
    >
      <Text variant={TextVariant.headingSm}>
        {t('metamaskNotificationsAreOff')}
      </Text>
      <Box
        as="img"
        src="./images/turn-on-metamask-notifications.png"
        width={BlockSize.Full}
        borderRadius={BorderRadius.MD}
      />

      <Text as="p">
        {t('turnOnMetamaskNotificationsMessageSecond', [privacyLink])}
      </Text>
      <Text as="p">
        {t('turnOnMetamaskNotificationsMessageThird', [strongText])}
      </Text>
      <Box>
        <Button
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onClick={() => handleTurnOnNotifications()}
          size={ButtonSize.Md}
          disabled={loading}
          loading={loading}
        >
          {t('turnOnMetamaskNotificationsButton')}
        </Button>
        {error && (
          <Text as="p" color={TextColor.errorDefault}>
            {t('turnOnMetamaskNotificationsError')}
          </Text>
        )}
      </Box>
    </Container>
  );
};
