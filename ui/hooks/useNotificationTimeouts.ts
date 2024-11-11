import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteNotificationsById } from '../store/actions';
import { NOTIFICATIONS_EXPIRATION_DELAY } from '../helpers/constants/notifications';
import { getSnapNotifications } from '../selectors/metamask-notifications/metamask-notifications';
import { SnapNotification } from '../pages/notifications/notification-components/snap/snap';

/**
 * This hook is used to enforce lifecycles for snap notifications.
 * Upon dismount, the hook will clear timeouts for notifications
 * that don't exist anymore.
 *
 * @returns A function that creates a timeout to delete a notification
 * and stores the timeout id.
 */
export const useSnapNotificationTimeouts = () => {
  const dispatch = useDispatch();
  const snapNotifications = useSelector(
    getSnapNotifications,
  ) as SnapNotification[];

  const setNotificationTimeout = (id: string) => {
    setTimeout(() => {
      dispatch(deleteNotificationsById([id]));
    }, NOTIFICATIONS_EXPIRATION_DELAY);
  };

  useEffect(() => {
    return () => {
      const ids: string[] = [];
      snapNotifications.forEach((notification) => {
        if (
          notification.readDate &&
          new Date(notification.readDate) <
            new Date(Date.now() - NOTIFICATIONS_EXPIRATION_DELAY)
        ) {
          ids.push(notification.id);
        }
      });
      dispatch(deleteNotificationsById(ids));
    };
  }, [dispatch]);

  return { setNotificationTimeout };
};
