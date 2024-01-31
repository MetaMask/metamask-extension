import classnames from 'classnames';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  NOTIFICATION_BUY_SELL_BUTTON,
  NOTIFICATION_DROP_LEDGER_FIREFOX,
  NOTIFICATION_OPEN_BETA_SNAPS,
  NOTIFICATION_U2F_LEDGER_LIVE,
  getTranslatedUINotifications,
} from '../../../../shared/notifications';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { TextVariant } from '../../../helpers/constants/design-system';
import {
  ADVANCED_ROUTE,
  BUILD_QUOTE_ROUTE,
  EXPERIMENTAL_ROUTE,
  PREPARE_SWAP_ROUTE,
  SECURITY_ROUTE,
} from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import { getSortedAnnouncementsToShow } from '../../../selectors';
import { updateViewedNotifications } from '../../../store/actions';
import { ButtonPrimary, Text } from '../../component-library';
import Popover from '../../ui/popover';

function getActionFunctionById(id, history) {
  const actionFunctions = {
    2: () => {
      global.platform.openTab({
        url: 'https://survey.alchemer.com/s3/6173069/MetaMask-Extension-NPS-January-2021',
      });
    },
    3: () => {
      global.platform.openTab({
        url: 'https://community.metamask.io/t/about-the-security-category/72',
      });
    },
    4: () => {
      updateViewedNotifications({ 4: true });
      history.push(BUILD_QUOTE_ROUTE);
    },
    5: () => {
      updateViewedNotifications({ 5: true });
      global.platform.openTab({
        url: ZENDESK_URLS.SECRET_RECOVERY_PHRASE,
      });
    },
    8: () => {
      updateViewedNotifications({ 8: true });
      history.push(ADVANCED_ROUTE);
    },
    10: () => {
      updateViewedNotifications({ 10: true });
      history.push(`${SECURITY_ROUTE}#token-description`);
    },
    12: () => {
      updateViewedNotifications({ 12: true });
      history.push(EXPERIMENTAL_ROUTE);
    },
    14: () => {
      updateViewedNotifications({ 14: true });
      history.push(`${ADVANCED_ROUTE}#backup-userdata`);
    },
    16: () => {
      updateViewedNotifications({ 16: true });
    },
    17: () => {
      updateViewedNotifications({ 17: true });
    },
    18: () => {
      updateViewedNotifications({ 18: true });
      history.push(`${EXPERIMENTAL_ROUTE}#security-alerts`);
    },
    19: () => {
      updateViewedNotifications({ 19: true });
      history.push(`${EXPERIMENTAL_ROUTE}#autodetect-nfts`);
    },
    20: () => {
      updateViewedNotifications({ 20: true });
      global.platform.openTab({
        url: ZENDESK_URLS.LEDGER_FIREFOX_U2F_GUIDE,
      });
    },
    21: () => {
      updateViewedNotifications({ 21: true });
      history.push(PREPARE_SWAP_ROUTE);
    },
    22: () => {
      updateViewedNotifications({ 22: true });
    },
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    23: () => {
      updateViewedNotifications({ 23: true });
      history.push(`${EXPERIMENTAL_ROUTE}#security-alerts`);
    },
    ///: END:ONLY_INCLUDE_IF
    24: () => {
      updateViewedNotifications({ 24: true });
    },
    [NOTIFICATION_DROP_LEDGER_FIREFOX]: () => {
      updateViewedNotifications({ [NOTIFICATION_DROP_LEDGER_FIREFOX]: true });
    },
    [NOTIFICATION_OPEN_BETA_SNAPS]: () => {
      updateViewedNotifications({ [NOTIFICATION_OPEN_BETA_SNAPS]: true });
      global.platform.openTab({
        url: 'https://metamask.io/snaps/',
      });
    },
    [NOTIFICATION_BUY_SELL_BUTTON]: () => {
      updateViewedNotifications({ [NOTIFICATION_BUY_SELL_BUTTON]: true });
      global.platform.openTab({
        url: 'https://portfolio.metamask.io/sell/build-quote',
      });
    },
    [NOTIFICATION_U2F_LEDGER_LIVE]: () => {
      updateViewedNotifications({ [NOTIFICATION_U2F_LEDGER_LIVE]: true });
    },
  };

  return actionFunctions[id];
}

const renderDescription = (description) => {
  if (!Array.isArray(description)) {
    return <Text variant={TextVariant.bodyMd}>{description}</Text>;
  }

  return (
    <>
      {description.map((piece, index) => {
        const isLast = index === description.length - 1;
        return (
          <Text
            data-testid={`whats-new-description-item-${index}`}
            key={`item-${index}`}
            variant={TextVariant.bodyMd}
            marginBottom={isLast ? 0 : 4}
          >
            {piece}
          </Text>
        );
      })}
    </>
  );
};

const renderFirstNotification = ({
  notification,
  idRefMap,
  history,
  isLast,
  trackEvent,
}) => {
  const { id, date, title, description, image, actionText } = notification;
  const actionFunction = getActionFunctionById(id, history);

  const imageComponent = image && (
    <img
      className="whats-new-popup__notification-image"
      src={image.src}
      height={image.height}
      width={image.width}
    />
  );
  const placeImageBelowDescription = image?.placeImageBelowDescription;

  return (
    <div
      className={classnames(
        'whats-new-popup__notification whats-new-popup__first-notification',
        {
          'whats-new-popup__last-notification': isLast,
        },
      )}
      key={`whats-new-popop-notification-${id}`}
    >
      <Text variant={TextVariant.bodyLgMedium} marginBottom={2}>
        {title}
      </Text>
      {!placeImageBelowDescription && imageComponent}
      <div className="whats-new-popup__description-and-date">
        <div className="whats-new-popup__notification-description">
          {renderDescription(description)}
        </div>

        <div className="whats-new-popup__notification-date">{date}</div>
      </div>
      {placeImageBelowDescription && imageComponent}
      {actionText && (
        <ButtonPrimary
          className="whats-new-popup__button"
          onClick={() => {
            actionFunction();
            trackEvent({
              category: MetaMetricsEventCategory.Home,
              event: MetaMetricsEventName.WhatsNewClicked,
            });
          }}
          block
        >
          {actionText}
        </ButtonPrimary>
      )}
      <div
        className="whats-new-popup__intersection-observable"
        ref={idRefMap[id]}
      />
    </div>
  );
};

const renderSubsequentNotification = ({
  notification,
  idRefMap,
  history,
  isLast,
}) => {
  const { id, date, title, description, actionText } = notification;

  const actionFunction = getActionFunctionById(id, history);
  return (
    <div
      className={classnames('whats-new-popup__notification', {
        'whats-new-popup__last-notification': isLast,
      })}
      key={`whats-new-popop-notification-${id}`}
    >
      <div className="whats-new-popup__notification-title">{title}</div>
      <div className="whats-new-popup__description-and-date">
        <div className="whats-new-popup__notification-description">
          {renderDescription(description)}
        </div>
        <div className="whats-new-popup__notification-date">{date}</div>
      </div>
      {actionText && (
        <div className="whats-new-popup__link" onClick={actionFunction}>
          {`${actionText} >`}
        </div>
      )}
      <div
        className="whats-new-popup__intersection-observable"
        ref={idRefMap[id]}
      />
    </div>
  );
};

export default function WhatsNewPopup({ onClose }) {
  const t = useContext(I18nContext);
  const history = useHistory();

  const notifications = useSelector(getSortedAnnouncementsToShow);
  const locale = useSelector(getCurrentLocale);

  const [seenNotifications, setSeenNotifications] = useState({});
  const [shouldShowScrollButton, setShouldShowScrollButton] = useState(true);

  const popoverRef = useRef();

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

  const trackEvent = useContext(MetaMetricsContext);

  const handleDebouncedScroll = debounce((target) => {
    setShouldShowScrollButton(
      target.scrollHeight - target.scrollTop !== target.clientHeight,
    );
  }, 100);

  const handleScroll = (e) => {
    handleDebouncedScroll(e.target);
  };

  const handleScrollDownClick = (e) => {
    e.stopPropagation();
    idRefMap[notifications[notifications.length - 1].id].current.scrollIntoView(
      {
        behavior: 'smooth',
      },
    );
  };

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries, _observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const [id, ref] = Object.entries(idRefMap).find(([_, _ref]) =>
              _ref.current.isSameNode(entry.target),
            );

            setSeenNotifications((_seenNotifications) => ({
              ..._seenNotifications,
              [id]: true,
            }));

            _observer.unobserve(ref.current);
          }
        });
      },
      {
        root: popoverRef.current,
        threshold: 1.0,
      },
    );

    Object.values(idRefMap).forEach((ref) => {
      observer.observe(ref.current);
    });

    return () => {
      observer.disconnect();
    };
  }, [idRefMap, setSeenNotifications]);

  // Display the swaps notification with full image
  // Displays the NFTs & OpenSea notifications 18,19 with full image
  const notificationRenderers = {
    0: renderFirstNotification,
    1: renderFirstNotification,
    18: renderFirstNotification,
    19: renderFirstNotification,
    21: renderFirstNotification,
    22: renderFirstNotification,
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    23: renderFirstNotification,
    ///: END:ONLY_INCLUDE_IF
    24: renderFirstNotification,
    // This syntax is unusual, but very helpful here.  It's equivalent to `notificationRenderers[NOTIFICATION_DROP_LEDGER_FIREFOX] =`
    [NOTIFICATION_DROP_LEDGER_FIREFOX]: renderFirstNotification,
    [NOTIFICATION_OPEN_BETA_SNAPS]: renderFirstNotification,
    [NOTIFICATION_BUY_SELL_BUTTON]: renderFirstNotification,
    [NOTIFICATION_U2F_LEDGER_LIVE]: renderFirstNotification,
  };

  return (
    <Popover
      title={t('whatsNew')}
      headerProps={{ padding: [4, 4, 4] }}
      className="whats-new-popup__popover"
      onClose={() => {
        updateViewedNotifications(seenNotifications);
        trackEvent({
          category: MetaMetricsEventCategory.Home,
          event: MetaMetricsEventName.WhatsNewViewed,
          properties: {
            number_viewed: Object.keys(seenNotifications).pop(),
            completed_all: true,
          },
        });
        onClose();
      }}
      popoverRef={popoverRef}
      showScrollDown={shouldShowScrollButton && notifications.length > 1}
      onScrollDownButtonClick={handleScrollDownClick}
      onScroll={handleScroll}
    >
      <div className="whats-new-popup__notifications">
        {notifications.map(({ id }, index) => {
          const notification = getTranslatedUINotifications(t, locale)[id];
          const isLast = index === notifications.length - 1;
          // Choose the appropriate rendering function based on the id
          const renderNotification =
            notificationRenderers[id] || renderSubsequentNotification;

          return renderNotification({
            notification,
            idRefMap,
            history,
            isLast,
            trackEvent,
          });
        })}
      </div>
    </Popover>
  );
}

WhatsNewPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
};
