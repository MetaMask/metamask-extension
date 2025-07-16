import { useDispatch } from 'react-redux';
import { deleteNotificationsById } from '../store/actions';
import { NOTIFICATIONS_EXPIRATION_DELAY } from '../helpers/constants/notifications';

/**
 * This hook is used to enforce lifecycles for snap notifications.
 *
 * NOTE: This hook initiates a timeout to delete a notification,
 * but doesn't have complete control over the lifecycle of the notification.
 * The handling of deletion of stale notifications should be handled at the component
 * level where the notifications are rendered.
 *
 * @returns A function that creates a timeout to delete a notification.
 */
export const useSnapNotificationTimeouts = () => {
  const dispatch = useDispatch();

  const setNotificationTimeout = (id: string) => {
    setTimeout(() => {
      dispatch(deleteNotificationsById([id]));
    }, NOTIFICATIONS_EXPIRATION_DELAY);
  };

  return { setNotificationTimeout };
};
