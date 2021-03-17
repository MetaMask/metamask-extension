import React, { useContext, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
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
} from '../../../../../shared/notifications';
import { getSortedNotificationsToShow } from '../../../selectors';

export default function WhatsNewPopup({ onClose }) {
  const metricsEvent = useContext(MetaMetricsContext);
  const t = useContext(I18nContext);

  const getNotifcationActionFunctionsById = notifcationActionFunctions(
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
          {notifications.map(({ id, date }, index) => {
            const notification = UI_NOTIFICATIONS[id];
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
                  {t(notification.title)}
                </div>
                <div
                  className="whats-new-popup__description-and-date"
                  ref={idRefMap[id]}
                >
                  <div className="whats-new-popup__notification-description">
                    {t(notification.description)}
                  </div>
                  <div className="whats-new-popup__notification-date">
                    {date}
                  </div>
                </div>
                {isFirstNotification && notification.actionText && (
                  <Button
                    type="secondary"
                    className="whats-new-popup__button"
                    rounded
                    onClick={() =>
                      getNotifcationActionFunctionsById(notification.id)()
                    }
                  >
                    {t(notification.actionText)}
                  </Button>
                )}
                {!isFirstNotification && UI_NOTIFICATIONS[id].actionText && (
                  <div
                    className="whats-new-popup__link"
                    onClick={getNotifcationActionFunctionsById(notification.id)}
                  >
                    {t(notification.actionText)}
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
