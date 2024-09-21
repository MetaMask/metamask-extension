import React from 'react';
import { useUnreadNotificationsCounter } from '../../../hooks/metamask-notifications/useCounter';
import { Box, Text } from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  BorderStyle,
  Display,
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
        display={Display.Block}
        className="notification-list-item__unread-dot__wrapper"
        style={{
          position: 'absolute',
          cursor: 'pointer',
          top: '-5px',
          left: '10px',
          zIndex: 1,
        }}
        backgroundColor={BackgroundColor.errorDefault}
        borderStyle={BorderStyle.none}
        borderRadius={BorderRadius.LG}
        paddingTop={0}
        paddingBottom={0}
        paddingLeft={0}
        paddingRight={0}
      >
        <Text
          color={TextColor.errorInverse}
          variant={TextVariant.bodyXs}
          className="notifications-tag-counter__unread-dot"
          textAlign={TextAlign.Center}
        >
          {notificationsUnreadCount > 10 ? '9+' : notificationsUnreadCount}
        </Text>
      </Box>
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
        {notificationsUnreadCount > 10 ? '9+' : notificationsUnreadCount}
      </Text>
    </Box>
  );
};
