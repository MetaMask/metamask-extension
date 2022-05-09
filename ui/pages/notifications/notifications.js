import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getNotifications, getSnapsRouteObjects } from '../../selectors';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  deleteExpiredNotifications,
  markNotificationsAsRead,
} from '../../store/actions';
import IconCaretLeft from '../../components/ui/icon/icon-caret-left';
import Button from '../../components/ui/button';

function NotificationItem({ notification, snaps, onItemClick }) {
  const { message, origin, createdDate, readDate } = notification;
  const history = useHistory();

  const snap = snaps.find(({ id: snapId }) => {
    return snapId === origin;
  });

  const date = new Date(createdDate).toDateString();

  const handleNameClick = (e) => {
    e.stopPropagation();
    history.push(snap.route);
  };

  const handleItemClick = () => onItemClick(notification);

  return (
    <div className="notifications__item" onClick={handleItemClick}>
      <div
        className={classnames(
          'notifications__item__unread-dot',
          !readDate && 'unread',
        )}
      />
      <div className="notifications__item__details">
        <p className="notifications__item__details__message">{message}</p>
        <p className="notifications__item__details__infos">
          {date} from{' '}
          <Button type="inline" onClick={handleNameClick}>
            {snap.tabMessage()}
          </Button>
        </p>
      </div>
    </div>
  );
}

export default function Notifications() {
  const history = useHistory();
  const dispatch = useDispatch();
  const notifications = useSelector(getNotifications);
  const snapsRouteObject = useSelector(getSnapsRouteObjects);

  const markAllAsRead = () => {
    const unreadNotificationIds = notifications
      .filter(({ readDate }) => readDate === null)
      .map(({ id }) => id);

    dispatch(markNotificationsAsRead(unreadNotificationIds));
  };

  const markAsRead = (notificationToMark) => {
    if (!notificationToMark.readDate) {
      dispatch(markNotificationsAsRead([notificationToMark.id]));
    }
  };

  useEffect(() => {
    return () => dispatch(deleteExpiredNotifications());
  }, [dispatch]);

  return (
    <div className="main-container notifications">
      <div className="notifications__header">
        <div className="notifications__header__title-container">
          <IconCaretLeft
            className="notifications__header__title-container__back-button"
            color="var(--color-text-default)"
            size={23}
            onClick={() => history.push(DEFAULT_ROUTE)}
          />
          <div className="notifications__header__title-container__title">
            Notifications
          </div>
        </div>
        <Button
          type="secondary"
          className="notifications__header_button"
          onClick={markAllAsRead}
        >
          Mark all as read
        </Button>
      </div>

      <div className="notifications__container">
        {notifications.map((notification, id) => (
          <NotificationItem
            notification={notification}
            snaps={snapsRouteObject}
            key={id}
            onItemClick={markAsRead}
          />
        ))}
      </div>
    </div>
  );
}

NotificationItem.propTypes = {
  notification: {
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    origin: PropTypes.string.isRequired,
    createdDate: PropTypes.number.isRequired,
    readDate: PropTypes.number.isRequired,
  },
  snaps: PropTypes.array.isRequired,
  onItemClick: PropTypes.func.isRequired,
};
