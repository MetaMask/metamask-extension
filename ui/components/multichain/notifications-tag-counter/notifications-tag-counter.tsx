import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsSnapNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
  getFeatureAnnouncementsUnreadCount,
  getOnChainMetamaskNotificationsUnreadCount,
} from '../../../selectors/metamask-notifications/metamask-notifications';
import { Box, IconName, Icon, Text } from '../../component-library';
import { getUnreadNotificationsCount } from '../../../selectors';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  TextColor,
  TextVariant,
  IconColor,
} from '../../../helpers/constants/design-system';

type NotificationsTagCounterProps = {
  noLabel?: boolean;
};

export const NotificationsTagCounter = ({
  noLabel = false,
}: NotificationsTagCounterProps) => {
  const unreadNotificationsCount = useSelector(getUnreadNotificationsCount);
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isSnapNotificationsEnabled = useSelector(
    selectIsSnapNotificationsEnabled,
  );
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );
  const featureAnnouncementsUnreadCount = useSelector(
    getFeatureAnnouncementsUnreadCount,
  );
  const onChainMetamaskNotificationsUnreadCount = useSelector(
    getOnChainMetamaskNotificationsUnreadCount,
  );

  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    const totalUnreadCount = () => {
      const snaps = isSnapNotificationsEnabled ? unreadNotificationsCount : 0;
      const featureAnnouncements = isFeatureAnnouncementsEnabled
        ? featureAnnouncementsUnreadCount
        : 0;
      const onChainMetamaskNotifications =
        onChainMetamaskNotificationsUnreadCount;

      return snaps + featureAnnouncements + onChainMetamaskNotifications;
    };
    setNotificationsCount(totalUnreadCount);
  }, [
    isMetamaskNotificationsEnabled,
    isSnapNotificationsEnabled,
    unreadNotificationsCount,
    isFeatureAnnouncementsEnabled,
    featureAnnouncementsUnreadCount,
    onChainMetamaskNotificationsUnreadCount,
  ]);

  if (!isMetamaskNotificationsEnabled || notificationsCount === 0) {
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
          left: '9px',
          zIndex: 1,
        }}
      >
        <Icon
          borderColor={BorderColor.backgroundDefault}
          borderStyle={BorderStyle.solid}
          borderWidth={4}
          borderRadius={BorderRadius.full}
          name={IconName.FullCircle}
          color={IconColor.errorDefault}
          style={{
            height: '15px',
            width: '15px',
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      backgroundColor={BackgroundColor.errorDefault}
      borderStyle={BorderStyle.none}
      borderRadius={BorderRadius.MD}
      paddingTop={0}
      paddingBottom={0}
      paddingLeft={2}
      paddingRight={2}
    >
      <Text color={TextColor.errorInverse} variant={TextVariant.bodySm}>
        {notificationsCount > 99 ? '99+' : notificationsCount}
      </Text>
    </Box>
  );
};
