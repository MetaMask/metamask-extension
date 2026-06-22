import { useSelector } from 'react-redux';
import {
  selectIsMetamaskNotificationsEnabled,
  getFeatureAnnouncementsReadCount,
  getFeatureAnnouncementsUnreadCount,
  getOnChainMetamaskNotificationsReadCount,
  getOnChainMetamaskNotificationsUnreadCount,
  getSnapNotificationsReadCount,
  getSnapNotificationsUnreadCount,
} from '../../selectors/metamask-notifications/metamask-notifications';

const useSnapNotificationsCount = () => {
  const unreadSnapNotificationsCount = useSelector(
    getSnapNotificationsUnreadCount,
  );
  const readSnapNotificationsCount = useSelector(getSnapNotificationsReadCount);
  return { unreadSnapNotificationsCount, readSnapNotificationsCount };
};

const useFeatureAnnouncementCount = () => {
  const featureAnnouncementsUnreadCount = useSelector(
    getFeatureAnnouncementsUnreadCount,
  );

  const featureAnnouncementsReadCount = useSelector(
    getFeatureAnnouncementsReadCount,
  );

  return { featureAnnouncementsUnreadCount, featureAnnouncementsReadCount };
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
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const { unreadSnapNotificationsCount } = useSnapNotificationsCount();
  const { featureAnnouncementsUnreadCount } = useFeatureAnnouncementCount();
  const { onChainMetamaskNotificationsUnreadCount } =
    useWalletNotificationCount();

  const notificationsUnreadCount = isMetamaskNotificationsEnabled
    ? unreadSnapNotificationsCount +
      featureAnnouncementsUnreadCount +
      onChainMetamaskNotificationsUnreadCount
    : 0;

  return {
    notificationsUnreadCount,
  };
}

export function useReadNotificationsCounter() {
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const { readSnapNotificationsCount } = useSnapNotificationsCount();
  const { featureAnnouncementsReadCount } = useFeatureAnnouncementCount();
  const { onChainMetamaskNotificationsReadCount } =
    useWalletNotificationCount();

  const notificationsReadCount = isMetamaskNotificationsEnabled
    ? readSnapNotificationsCount +
      featureAnnouncementsReadCount +
      onChainMetamaskNotificationsReadCount
    : 0;

  return {
    notificationsReadCount,
  };
}
