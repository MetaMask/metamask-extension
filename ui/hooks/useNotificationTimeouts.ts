import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { deleteNotificationsById } from '../store/actions';
import { NOTIFICATIONS_EXPIRATION_DELAY } from '../helpers/constants/notifications';

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
  const ids: string[] = [];

  const setNotificationTimeout = (id: string) => {
    ids.push(id);
    setTimeout(() => {
      dispatch(deleteNotificationsById([id]));
    }, NOTIFICATIONS_EXPIRATION_DELAY);
  };

  useEffect(() => {
    return () => {
      dispatch(deleteNotificationsById(ids));
    };
  }, [dispatch]);

  return { setNotificationTimeout };
};
