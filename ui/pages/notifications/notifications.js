import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { SnapUIMarkdown } from '../../components/app/snaps/snap-ui-markdown';
import {
  formatDate,
  getSnapName,
  getSnapRoute,
} from '../../helpers/utils/util';
import {
  getNotifications,
  getTargetSubjectMetadata,
  getUnreadNotifications,
} from '../../selectors';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  deleteExpiredNotifications,
  markNotificationsAsRead,
} from '../../store/actions';
import Button from '../../components/ui/button';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import { Color } from '../../helpers/constants/design-system';

export function NotificationItem({ notification, onItemClick }) {
  const { message, origin, createdDate, readDate } = notification;
  const history = useHistory();
  const t = useI18nContext();
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, origin),
  );

  const snapName = getSnapName(origin, targetSubjectMetadata);

  const handleNameClick = (e) => {
    e.stopPropagation();
    history.push(getSnapRoute(origin));
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
        <div className="notifications__item__details__message">
          <SnapUIMarkdown markdown>{message}</SnapUIMarkdown>
        </div>
        <p className="notifications__item__details__infos">
          {t('notificationsInfos', [
            formatDate(createdDate, "LLLL d',' yyyy 'at' t"),
            <Button type="inline" onClick={handleNameClick} key="button">
              {snapName}
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
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Lg}
            color={Color.textDefault}
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
          disabled={unreadNotifications.length === 0}
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
  notification: PropTypes.exact({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    origin: PropTypes.string.isRequired,
    createdDate: PropTypes.number.isRequired,
    readDate: PropTypes.number,
  }),
  onItemClick: PropTypes.func.isRequired,
};
