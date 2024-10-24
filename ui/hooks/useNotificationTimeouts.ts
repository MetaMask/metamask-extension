import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { INotification } from '@metamask/notification-services-controller/notification-services';
import { deleteNotificationsById } from '../store/actions';
import { NOTIFICATIONS_EXPIRATION_DELAY } from '../helpers/constants/notifications';

/**
 * This hook is used to enforce lifecycles for snap notifications.
 * Upon dismount, the hook will clear timeouts for notifications
 * that don't exist anymore.
 *
 * @param notifications - The current list of notifications
 * @returns A function that creates a timeout to delete a notification
 * and stores the timeout id.
 */
export const useSnapNotificationTimeouts = (notifications: INotification[]) => {
  const timerMap = new Map<string, ReturnType<typeof setTimeout>>();
  const dispatch = useDispatch();

  const setNotificationTimeout = (id: string) => {
    const timerId = setTimeout(async () => {
      await dispatch(deleteNotificationsById([id]));
    }, NOTIFICATIONS_EXPIRATION_DELAY);
    timerMap.set(id, timerId);
  };

  const clearTimeouts = () => {
    [...timerMap.keys()].forEach((id) => {
      if (!notifications.find((notification) => notification.id === id)) {
        clearTimeout(timerMap.get(id));
      }
    });
  };

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  return { setNotificationTimeout };
};
