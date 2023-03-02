import React, { useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import { I18nContext } from '../../../contexts/i18n';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import Button from '../../ui/button';
import Popover from '../../ui/popover';
import Typography from '../../ui/typography';
import { updateViewedNotifications } from '../../../store/actions';
import { getTranslatedUINotifications } from '../../../../shared/notifications';
import { getSortedAnnouncementsToShow } from '../../../selectors';
import {
  BUILD_QUOTE_ROUTE,
  ADVANCED_ROUTE,
  EXPERIMENTAL_ROUTE,
  SECURITY_ROUTE,
} from '../../../helpers/constants/routes';
import { TypographyVariant } from '../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
///: BEGIN:ONLY_INCLUDE_IN(mmi)
import PortfolioDashboardIcon from '../../ui/mmi/icon/portfolio-dashboard-icon.component';
import { MetaMetricsContext } from '../../../contexts/metametrics';
///: END:ONLY_INCLUDE_IN

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
    17: () => {
      updateViewedNotifications({ 17: true });
      history.push(SECURITY_ROUTE);
    },
  };

  return actionFunctions[id];
}

const renderDescription = (
  description, ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  descriptionInBullets,
  ///: END:ONLY_INCLUDE_IN
) => {
  if (!Array.isArray(description)) {
    return (
      <Typography variant={TypographyVariant.paragraph}>
        {description}
      </Typography>
    );
  }

  return (
    <>
      {description.map((piece, index) => {
        const isLast = index === description.length - 1;
        return (
          <Typography
            key={`item-${index}`}
            variant={TypographyVariant.paragraph}
            boxProps={{ marginBottom: isLast ? 0 : 2 }}
            ///: BEGIN:ONLY_INCLUDE_IN(mmi)
            className={classnames({
              'whats-new-popup__notification-description-bullets':
                descriptionInBullets,
            })}
            ///: END:ONLY_INCLUDE_IN
          >
            {piece}
          </Typography>
        );
      })}
    </>
  );
};

const renderFirstNotification = (
  notification,
  idRefMap,
  history,
  isLast,
  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  mmiPortfolioUrl,
  closeAndViewPortfolioDashboard,
  ///: END:ONLY_INCLUDE_IN
) => {
  const {
    id,
    date,
    title,
    description,
    image,
    actionText, ///: BEGIN:ONLY_INCLUDE_IN(mmi)
    hideDate,
    customButton,
    descriptionInBullets,
    ///: END:ONLY_INCLUDE_IN
  } = notification;
  let showNotificationDate = true;

  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  showNotificationDate = !hideDate;
  ///: END:ONLY_INCLUDE_IN
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
      {!placeImageBelowDescription && imageComponent}
      <div className="whats-new-popup__notification-title">{title}</div>
      <div className="whats-new-popup__description-and-date">
        <div className="whats-new-popup__notification-description">
          {renderDescription(
            description,
            ///: BEGIN:ONLY_INCLUDE_IN(mmi)
            descriptionInBullets,
            ///: END:ONLY_INCLUDE_IN
          )}
        </div>
        {showNotificationDate && (
          <div className="whats-new-popup__notification-date">{date}</div>
        )}
      </div>
      {placeImageBelowDescription && imageComponent}
      {actionText && (
        <Button
          type="secondary"
          className="whats-new-popup__button"
          onClick={actionFunction}
        >
          {actionText}
        </Button>
      )}
      {
        ///: BEGIN:ONLY_INCLUDE_IN(mmi)
        customButton && customButton.name === 'mmi-portfolio' && (
          <Button
            type="secondary"
            className="whats-new-popup__button"
            data-testid="view-mmi-portfolio"
            onClick={() => {
              closeAndViewPortfolioDashboard();
              window.open(mmiPortfolioUrl, '_blank');
            }}
          >
            {customButton.logo && (
              <PortfolioDashboardIcon
                className="whats-new-popup__button-icon"
                fill="var(--color-primary-default)"
              />
            )}
            {customButton.text}
          </Button>
        )
        ///: END:ONLY_INCLUDE_IN
      }
      <div
        className="whats-new-popup__intersection-observable"
        ref={idRefMap[id]}
      />
    </div>
  );
};

const renderSubsequentNotification = (
  notification,
  idRefMap,
  history,
  isLast,
) => {
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

export default function WhatsNewPopup({
  onClose,
  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  mmiPortfolioUrl,
  ///: END:ONLY_INCLUDE_IN
}) {
  const t = useContext(I18nContext);
  const history = useHistory();

  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  const trackEvent = useContext(MetaMetricsContext);
  ///: END:ONLY_INCLUDE_IN

  const notifications = useSelector(getSortedAnnouncementsToShow);
  const locale = useSelector(getCurrentLocale);

  const [seenNotifications, setSeenNotifications] = useState({});

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

    ///: BEGIN:ONLY_INCLUDE_IN(mmi)
    trackEvent({
      category: 'Task Success/Engagement',
      event: 'Portfolio Dashboard Modal Open',
      properties: {
        action: 'Modal was opened',
      },
    });
    ///: END:ONLY_INCLUDE_IN

    return () => {
      observer.disconnect();
    };
  }, [idRefMap, setSeenNotifications]);

  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  const closeAndViewPortfolioDashboard = () => {
    updateViewedNotifications(seenNotifications);

    trackEvent({
      category: 'Task Success/Engagement',
      event: 'Portfolio Dashboard Modal Button',
      properties: {
        action: 'Button was clicked',
      },
    });

    onClose();
  };
  ///: END:ONLY_INCLUDE_IN

  return (
    <Popover
      className="whats-new-popup__popover"
      title={t('whatsNew')}
      onClose={() => {
        updateViewedNotifications(seenNotifications);
        onClose();
      }}
      popoverRef={popoverRef}
    >
      <div className="whats-new-popup__notifications">
        {notifications.map(({ id }, index) => {
          const notification = getTranslatedUINotifications(t, locale)[id];
          const isLast = index === notifications.length - 1;

          let renderNotification = renderSubsequentNotification;

          if (index === 0 || id === 1) {
            renderNotification = renderFirstNotification;
          }

          ///: BEGIN:ONLY_INCLUDE_IN(mmi)
          renderNotification = renderFirstNotification;
          ///: END:ONLY_INCLUDE_IN

          // Display the swaps notification with full image
          return renderNotification(
            notification,
            idRefMap,
            history,
            isLast,
            ///: BEGIN:ONLY_INCLUDE_IN(mmi)
            mmiPortfolioUrl,
            closeAndViewPortfolioDashboard,
            ///: END:ONLY_INCLUDE_IN
          );
        })}
      </div>
    </Popover>
  );
}

WhatsNewPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  mmiPortfolioUrl: PropTypes.string.isRequired,
  ///: END:ONLY_INCLUDE_IN
};
