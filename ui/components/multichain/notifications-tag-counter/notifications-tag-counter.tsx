import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
  getFeatureAnnouncementsUnreadCount,
  getOnChainMetamaskNotificationsUnreadCount,
  selectIsMetamaskNotificationsFeatureSeen,
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
import { NewFeatureTag } from '../../../pages/notifications/NewFeatureTag';

type NotificationsTagCounterProps = {
  noLabel?: boolean;
};

const useSnapNotificationCount = () => {
  const unreadNotificationsCount = useSelector(getUnreadNotificationsCount);
  return unreadNotificationsCount;
};

const useFeatureAnnouncementCount = () => {
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );

  const featureAnnouncementsUnreadCount = useSelector(
    getFeatureAnnouncementsUnreadCount,
  );

  return isFeatureAnnouncementsEnabled ? featureAnnouncementsUnreadCount : 0;
};

const useWalletNotificationCount = () => {
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const onChainMetamaskNotificationsUnreadCount = useSelector(
    getOnChainMetamaskNotificationsUnreadCount,
  );

  return isMetamaskNotificationsEnabled
    ? onChainMetamaskNotificationsUnreadCount
    : 0;
};

export const NotificationsTagCounter = ({
  noLabel = false,
}: NotificationsTagCounterProps) => {
  const snapNotificationCount = useSnapNotificationCount();
  const featureAnnouncementCount = useFeatureAnnouncementCount();
  const walletNotificationCount = useWalletNotificationCount();
  const isMetamaskNotificationFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );

  const notificationsCount =
    snapNotificationCount + featureAnnouncementCount + walletNotificationCount;

  if (notificationsCount === 0) {
    if (!isMetamaskNotificationFeatureSeen) {
      return <NewFeatureTag />;
    }
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
      <Text
        color={TextColor.errorInverse}
        variant={TextVariant.bodySm}
        data-testid="global-menu-notification-count"
      >
        {notificationsCount > 99 ? '99+' : notificationsCount}
      </Text>
    </Box>
  );
};
