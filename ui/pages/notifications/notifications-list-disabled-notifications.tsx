import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../helpers/constants/routes';

export const NotificationsListDisabledNotifications = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

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
        onClick={() => navigate(NOTIFICATIONS_SETTINGS_ROUTE)}
        size={ButtonSize.Md}
        variant={ButtonVariant.Secondary}
      >
        {t('notificationSettings')}
      </Button>
    </Box>
  );
};
