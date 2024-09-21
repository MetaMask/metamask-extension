import { useSelector } from 'react-redux';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
  getFeatureAnnouncementsReadCount,
  getFeatureAnnouncementsUnreadCount,
  getOnChainMetamaskNotificationsReadCount,
  getOnChainMetamaskNotificationsUnreadCount,
} from '../../selectors/metamask-notifications/metamask-notifications';
import {
  getReadNotificationsCount,
  getUnreadNotificationsCount,
} from '../../selectors';

const useSnapNotificationdCount = () => {
  const unreadSnapNotificationsCount = useSelector(getUnreadNotificationsCount);
  const readSnapNotificationsCount = useSelector(getReadNotificationsCount);
  return { unreadSnapNotificationsCount, readSnapNotificationsCount };
};

const useFeatureAnnouncementCount = () => {
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );

  const featureAnnouncementsUnreadCount = useSelector(
    getFeatureAnnouncementsUnreadCount,
  );

  const featureAnnouncementsReadCount = useSelector(
    getFeatureAnnouncementsReadCount,
  );

  return isFeatureAnnouncementsEnabled
    ? { featureAnnouncementsUnreadCount, featureAnnouncementsReadCount }
    : { featureAnnouncementsUnreadCount: 0, featureAnnouncementsReadCount: 0 };
};

const useWalletNotificationCount = () => {
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );

  const onChainMetamaskNotificationsUnreadCount = useSelector(
    getOnChainMetamaskNotificationsUnreadCount,
  );

  const onChainMetamaskNotificationsReadCount = useSelector(
    getOnChainMetamaskNotificationsReadCount,
  );

  return isMetamaskNotificationsEnabled
    ? {
        onChainMetamaskNotificationsUnreadCount,
        onChainMetamaskNotificationsReadCount,
      }
    : {
        onChainMetamaskNotificationsUnreadCount: 0,
        onChainMetamaskNotificationsReadCount: 0,
      };
};

export function useUnreadNotificationsCounter() {
  const { unreadSnapNotificationsCount } = useSnapNotificationdCount();
  const { featureAnnouncementsUnreadCount } = useFeatureAnnouncementCount();
  const { onChainMetamaskNotificationsUnreadCount } =
    useWalletNotificationCount();

  const notificationsUnreadCount =
    unreadSnapNotificationsCount +
    featureAnnouncementsUnreadCount +
    onChainMetamaskNotificationsUnreadCount;

  return {
    notificationsUnreadCount,
  };
}

export function useReadNotificationsCounter() {
  const { readSnapNotificationsCount } = useSnapNotificationdCount();
  const { featureAnnouncementsReadCount } = useFeatureAnnouncementCount();
  const { onChainMetamaskNotificationsReadCount } =
    useWalletNotificationCount();

  const notificationsReadCount =
    readSnapNotificationsCount +
    featureAnnouncementsReadCount +
    onChainMetamaskNotificationsReadCount;

  return {
    notificationsReadCount,
  };
}
