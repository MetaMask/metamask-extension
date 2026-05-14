import React from 'react';
import { useUnreadNotificationsCounter } from '../../../hooks/metamask-notifications/useCounter';
import { Box, BoxBackgroundColor } from '@metamask/design-system-react';
import { Text } from '../../component-library';
import {
  TextColor,
  TextVariant,
  TextAlign,
} from '../../../helpers/constants/design-system';

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
      <Box
        className="notification-list-item__unread-dot__wrapper block border-none rounded-lg p-0"
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: '50%',
          zIndex: 1,
        }}
        backgroundColor={BoxBackgroundColor.ErrorDefault}
      >
        <Text
          color={TextColor.errorInverse}
          variant={TextVariant.bodyXs}
          className="notifications-tag-counter__unread-dot"
          data-testid="notifications-tag-counter__unread-dot"
          textAlign={TextAlign.Center}
        >
          {notificationsUnreadCount > 10 ? '9+' : notificationsUnreadCount}
        </Text>
      </Box>
    );
  }

  return (
    <Box
      backgroundColor={BoxBackgroundColor.ErrorDefault}
      className="notifications-tag-counter border-none rounded-lg py-0"
    >
      <Text
        color={TextColor.errorInverse}
        variant={TextVariant.bodySm}
        data-testid="global-menu-notification-count"
        className="notifications-tag-counter__text"
        textAlign={TextAlign.Center}
      >
        {notificationsUnreadCount > 10 ? '9+' : notificationsUnreadCount}
      </Text>
    </Box>
  );
};
