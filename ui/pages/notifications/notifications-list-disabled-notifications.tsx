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
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../helpers/constants/routes';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';

export const NotificationsListDisabledNotifications = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  // `notificationsSettingsPageAllowNotifications` includes a `$1` substitution
  // for the privacy link; pass it here too so the empty state doesn't render a
  // literal "$1".
  const privacyLink = (
    <Text asChild color={TextColor.InfoDefault} key="privacy-link">
      <a
        href={ZENDESK_URLS.PROFILE_PRIVACY}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('notificationsSettingsPageAllowNotificationsLink')}
      </a>
    </Text>
  );

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
          {t('notificationsSettingsPageAllowNotifications', [privacyLink])}
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
