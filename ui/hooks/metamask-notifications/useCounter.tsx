import { useSelector } from 'react-redux';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
  getFeatureAnnouncementsUnreadCount,
  getOnChainMetamaskNotificationsUnreadCount,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { getUnreadNotificationsCount } from '../../selectors';

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

export function useCounter() {
  const snapNotificationCount = useSnapNotificationCount();
  const featureAnnouncementCount = useFeatureAnnouncementCount();
  const walletNotificationCount = useWalletNotificationCount();

  const notificationsCount =
    snapNotificationCount + featureAnnouncementCount + walletNotificationCount;

  return {
    notificationsCount,
  };
}
