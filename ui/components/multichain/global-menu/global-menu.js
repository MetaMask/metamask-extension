import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CONNECTED_ROUTE,
  SETTINGS_ROUTE,
  DEFAULT_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  NOTIFICATIONS_ROUTE,
  ///: END:ONLY_INCLUDE_IN(snaps)
} from '../../../helpers/constants/routes';
import { lockMetamask } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  IconName,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  Text,
  ///: END:ONLY_INCLUDE_IN(snaps)
} from '../../component-library';
import { Menu, MenuItem } from '../../ui/menu';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
///: BEGIN:ONLY_INCLUDE_IN(build-beta,build-flask)
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
///: END:ONLY_INCLUDE_IN

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsContextProp,
} from '../../../../shared/constants/metametrics';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import {
  getMetaMetricsId,
  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  getUnreadNotificationsCount,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
///: BEGIN:ONLY_INCLUDE_IN(snaps)
import {
  AlignItems,
  BackgroundColor,
  Display,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
///: END:ONLY_INCLUDE_IN

export const GlobalMenu = ({ closeMenu, anchorElement }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const metaMetricsId = useSelector(getMetaMetricsId);

  ///: BEGIN:ONLY_INCLUDE_IN(snaps)
  const unreadNotificationsCount = useSelector(getUnreadNotificationsCount);
  ///: END:ONLY_INCLUDE_IN

  let supportText = t('support');
  let supportLink = SUPPORT_LINK;
  ///: BEGIN:ONLY_INCLUDE_IN(build-beta,build-flask)
  supportText = t('needHelpSubmitTicket');
  supportLink = SUPPORT_REQUEST_LINK;
  ///: END:ONLY_INCLUDE_IN

  return (
    <Menu anchorElement={anchorElement} onHide={closeMenu}>
      <MenuItem
        iconName={IconName.Connect}
        onClick={() => {
          history.push(CONNECTED_ROUTE);
          trackEvent({
            event: MetaMetricsEventName.NavConnectedSitesOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              location: 'Global Menu',
            },
          });
          closeMenu();
        }}
      >
        {t('connectedSites')}
      </MenuItem>
      <MenuItem
        iconName={IconName.Diagram}
        onClick={() => {
          const portfolioUrl = getPortfolioUrl('', 'ext', metaMetricsId);
          global.platform.openTab({
            url: portfolioUrl,
          });
          trackEvent(
            {
              category: MetaMetricsEventCategory.Home,
              event: MetaMetricsEventName.PortfolioLinkClicked,
              properties: {
                url: portfolioUrl,
                location: 'Global Menu',
              },
            },
            {
              contextPropsIntoEventProperties: [
                MetaMetricsContextProp.PageTitle,
              ],
            },
          );
          closeMenu();
        }}
        data-testid="global-menu-portfolio"
      >
        {t('portfolioView')}
      </MenuItem>
      {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? null : (
        <MenuItem
          iconName={IconName.Expand}
          onClick={() => {
            global.platform.openExtensionInBrowser();
            trackEvent({
              event: MetaMetricsEventName.AppWindowExpanded,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                location: 'Global Menu',
              },
            });
            closeMenu();
          }}
          data-testid="global-menu-expand"
        >
          {t('expandView')}
        </MenuItem>
      )}
      {
        ///: BEGIN:ONLY_INCLUDE_IN(snaps)
        <>
          <MenuItem
            iconName={IconName.Notification}
            onClick={() => {
              closeMenu();
              history.push(NOTIFICATIONS_ROUTE);
            }}
          >
            <Text as="span">{t('notifications')}</Text>
            {unreadNotificationsCount > 0 && (
              <Text
                as="span"
                display={Display.InlineBlock}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
                backgroundColor={BackgroundColor.primaryDefault}
                color={TextColor.primaryInverse}
                padding={[0, 1, 0, 1]}
                variant={TextVariant.bodyXs}
                textAlign={TextAlign.Center}
                data-testid="global-menu-notification-count"
                style={{
                  borderRadius: '16px',
                  minWidth: '24px',
                }}
                marginInlineStart={2}
              >
                {unreadNotificationsCount > 99
                  ? '99+'
                  : unreadNotificationsCount}
              </Text>
            )}
          </MenuItem>
        </>
        ///: END:ONLY_INCLUDE_IN(snaps)
      }
      <MenuItem
        iconName={IconName.MessageQuestion}
        onClick={() => {
          global.platform.openTab({ url: supportLink });
          trackEvent(
            {
              category: MetaMetricsEventCategory.Home,
              event: MetaMetricsEventName.SupportLinkClicked,
              properties: {
                url: supportLink,
                location: 'Global Menu',
              },
            },
            {
              contextPropsIntoEventProperties: [
                MetaMetricsContextProp.PageTitle,
              ],
            },
          );
          closeMenu();
        }}
        data-testid="global-menu-support"
      >
        {supportText}
      </MenuItem>
      <MenuItem
        iconName={IconName.Setting}
        onClick={() => {
          history.push(SETTINGS_ROUTE);
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.NavSettingsOpened,
            properties: {
              location: 'Global Menu',
            },
          });
          closeMenu();
        }}
      >
        {t('settings')}
      </MenuItem>
      <MenuItem
        iconName={IconName.Lock}
        onClick={() => {
          dispatch(lockMetamask());
          history.push(DEFAULT_ROUTE);
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.AppLocked,
            properties: {
              location: 'Global Menu',
            },
          });
          closeMenu();
        }}
        data-testid="global-menu-lock"
      >
        {t('lockMetaMask')}
      </MenuItem>
    </Menu>
  );
};

GlobalMenu.propTypes = {
  /**
   * The element that the menu should display next to
   */
  anchorElement: PropTypes.instanceOf(window.Element),
  /**
   * Function that closes this menu
   */
  closeMenu: PropTypes.func.isRequired,
};
