import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { formatDate } from '../../helpers/utils/util';
import {
  getNotifications,
  getSnapsRouteObjects,
  getUnreadNotifications,
} from '../../selectors';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  deleteExpiredNotifications,
  markNotificationsAsRead,
} from '../../store/actions';
import IconCaretLeft from '../../components/ui/icon/icon-caret-left';
import Button from '../../components/ui/button';
import { useI18nContext } from '../../hooks/useI18nContext';

export function NotificationItem({ notification, snaps, onItemClick }) {
  const { message, origin, createdDate, readDate } = notification;
  const history = useHistory();
  const t = useI18nContext();

  const snap = snaps.find(({ id: snapId }) => {
    return snapId === origin;
  });

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
          {t('notificationsInfos', [
            formatDate(createdDate, "LLLL d',' yyyy 'at' t"),
            <Button type="inline" onClick={handleNameClick} key="button">
              {snap.tabMessage()}
            </Button>,
          ])}
        </p>
      </div>
    </div>
  );
}

export default function Notifications() {
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const notifications = useSelector(getNotifications);
  const snapsRouteObject = useSelector(getSnapsRouteObjects);
  const unreadNotifications = useSelector(getUnreadNotifications);

  const markAllAsRead = () => {
    const unreadNotificationIds = unreadNotifications.map(({ id }) => id);

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
            {t('notificationsHeader')}
          </div>
        </div>
        <Button
          type="secondary"
          className="notifications__header_button"
          onClick={markAllAsRead}
        >
          {t('notificationsMarkAllAsRead')}
        </Button>
      </div>
      <div
        className={classnames(
          'notifications__container',
          notifications.length === 0 && 'empty',
        )}
      >
        {notifications.length > 0 ? (
          notifications.map((notification, id) => (
            <NotificationItem
              notification={notification}
              snaps={snapsRouteObject}
              key={id}
              onItemClick={markAsRead}
            />
          ))
        ) : (
          <div className="notifications__container__text">
            {t('notificationsEmptyText')}
          </div>
        )}
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
