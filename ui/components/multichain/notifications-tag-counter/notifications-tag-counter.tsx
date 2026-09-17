import React from 'react';
import { BadgeCount } from '@metamask/design-system-react';
import { useUnreadNotificationsCounter } from '../../../hooks/metamask-notifications/useCounter';
import { Box, Text } from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  BorderStyle,
  TextColor,
  TextVariant,
  TextAlign,
} from '../../../helpers/constants/design-system';

const MAX_DISPLAYED_COUNT = 9;

type NotificationsTagCounterProps = {
  noLabel?: boolean;
};

export const NotificationsTagCounter = ({
  noLabel = false,
}: NotificationsTagCounterProps) => {
  const { notificationsUnreadCount } = useUnreadNotificationsCounter();

  if (notificationsUnreadCount === 0) {
    return null;
  }

  if (noLabel) {
    return (
      <BadgeCount
        count={notificationsUnreadCount}
        max={MAX_DISPLAYED_COUNT}
        data-testid="notifications-tag-counter__unread-dot"
      />
    );
  }

  return (
    <Box
      backgroundColor={BackgroundColor.errorDefault}
      borderStyle={BorderStyle.none}
      borderRadius={BorderRadius.LG}
      paddingTop={0}
      paddingBottom={0}
      className="notifications-tag-counter"
    >
      <Text
        color={TextColor.errorInverse}
        variant={TextVariant.bodySm}
        data-testid="global-menu-notification-count"
        className="notifications-tag-counter__text"
        textAlign={TextAlign.Center}
      >
        {notificationsUnreadCount > MAX_DISPLAYED_COUNT
          ? `${MAX_DISPLAYED_COUNT}+`
          : notificationsUnreadCount}
      </Text>
    </Box>
  );
};
