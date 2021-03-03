import React, { useContext, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { I18nContext } from '../../../contexts/i18n';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import { MetaMetricsContext } from '../../../contexts/metametrics.new';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import { updateViewedNotifications } from '../../../store/actions';
import {
  UI_NOTIFICATIONS,
  notifcationActionFunctions,
  getSortedNotificationsToShow,
} from '../../../../../shared/notifications';

export default function WhatsNewPopup({ onClose }) {
  const dispatch = useDispatch(useDispatch);
  const history = useHistory();
  const metricsEvent = useContext(MetaMetricsContext);
  const t = useContext(I18nContext);
  const state = useSelector((_state) => _state);

  const getNotifcationActionFunctionsById = notifcationActionFunctions(
    dispatch,
    state,
    history,
    metricsEvent,
  );

  const notifications = useSelector(getSortedNotificationsToShow);

  const contentRef = useRef();

  const memoizedNotifications = useEqualityCheck(notifications);
  const idRefMap = useMemo(
    () =>
      memoizedNotifications.reduce(
        (_idRefMap, notification) => ({
          ..._idRefMap,
          [notification.id]: React.createRef(),
        }),
        {},
      ),
    [memoizedNotifications],
  );

  return (
    <div className="whats-new-popup">
      <Popover
        className="whats-new-popup__popover"
        title={t('whatsNew')}
        onClose={() => {
          const {
            bottom: containerBottom,
          } = contentRef.current.getBoundingClientRect();

          const currentlySeenNotifications = {};
          Object.keys(idRefMap).forEach((notificationId) => {
            const { bottom: descriptionBottom } = idRefMap[
              notificationId
            ].current.getBoundingClientRect();

            if (descriptionBottom < containerBottom) {
              currentlySeenNotifications[notificationId] = true;
            }
          });

          updateViewedNotifications(currentlySeenNotifications);

          onClose();
        }}
        contentRef={contentRef}
        mediumHeight
      >
        <div className="whats-new-popup__notifications">
          {notifications.map((notification, index) => {
            const isFirstNotification = index === 0;
            return (
              <div
                className={classnames('whats-new-popup__notification', {
                  'whats-new-popup__first-notification': isFirstNotification,
                })}
                key={`whats-new-popop-notificatiion-${index}`}
              >
                {isFirstNotification && notification.image && (
                  <img
                    className="whats-new-popup__notification-image"
                    src={notification.image}
                  />
                )}
                <div className="whats-new-popup__notification-title">
                  {notification.title}
                </div>
                <div
                  className="whats-new-popup__notification-description"
                  ref={idRefMap[notification.id]}
                >
                  {notification.description}
                </div>
                {isFirstNotification &&
                  UI_NOTIFICATIONS[notification.id].actionText && (
                    <Button
                      type="secondary"
                      className="whats-new-popup__button"
                      rounded
                      onClick={() =>
                        getNotifcationActionFunctionsById(notification.id)()
                      }
                    >
                      {UI_NOTIFICATIONS[notification.id].actionText}
                    </Button>
                  )}
                {!isFirstNotification &&
                  UI_NOTIFICATIONS[notification.id].actionText && (
                    <div
                      className="whats-new-popup__link"
                      onClick={() =>
                        getNotifcationActionFunctionsById(notification.id)()
                      }
                    >
                      {UI_NOTIFICATIONS[notification.id].actionText}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </Popover>
    </div>
  );
}

WhatsNewPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
};
