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
import { UI_NOTIFICATIONS } from '../../../../../shared/notifications';
import {
  getSortedNotificationsToShow,
  getSwapsEthToken,
} from '../../../selectors';
import { BUILD_QUOTE_ROUTE } from '../../../helpers/constants/routes';

function notifcationActionFunctions(state, metricsEvent) {
  const swapsEthToken = getSwapsEthToken(state);

  const actionFunctions = {
    1: () => {
      metricsEvent({
        event: 'Swaps Opened',
        properties: { source: 'Main View', active_currency: 'ETH' },
        category: 'swaps',
      });
      global.platform.openExtensionInBrowser(
        BUILD_QUOTE_ROUTE,
        `fromAddress=${swapsEthToken.address}`,
      );
    },
    2: () => {
      global.platform.openTab({
        url: 'https://metamask.io/download.html',
      });
    },
    3: () => {
      global.platform.openTab({
        url:
          'https://survey.alchemer.com/s3/6173069/MetaMask-Extension-NPS-January-2021',
      });
    },
  };

  return (id) => {
    return actionFunctions[id];
  };
}

export default function WhatsNewPopup({ onClose }) {
  const metricsEvent = useContext(MetaMetricsContext);
  const t = useContext(I18nContext);
  const state = useSelector((_state) => _state);

  const getNotifcationActionFunctionsById = notifcationActionFunctions(
    state,
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
                  {t(notification.title)}
                </div>
                <div
                  className="whats-new-popup__notification-description"
                  ref={idRefMap[notification.id]}
                >
                  {t(notification.description)}
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
                      {t(UI_NOTIFICATIONS[notification.id].actionText)}
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
                      {t(UI_NOTIFICATIONS[notification.id].actionText)}
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
