import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  CONNECTED_ROUTE,
  SETTINGS_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { lockMetamask } from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ICON_NAMES } from '../../component-library';
import { Menu, MenuItem } from '../../ui/menu';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  EVENT_NAMES,
  EVENT,
  CONTEXT_PROPS,
} from '../../../../shared/constants/metametrics';

export const GlobalMenu = ({ closeMenu, anchorElement }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();

  return (
    <Menu anchorElement={anchorElement} onHide={closeMenu}>
      <MenuItem
        iconName={ICON_NAMES.CONNECT}
        onClick={() => {
          history.push(CONNECTED_ROUTE);
          trackEvent({
            event: EVENT_NAMES.NAV_CONNECTED_SITES_OPENED,
            category: EVENT.CATEGORIES.NAVIGATION,
            properties: {
              location: 'Account Options',
            },
          });
          closeMenu();
        }}
      >
        {t('connectedSites')}
      </MenuItem>
      <MenuItem
        iconName={ICON_NAMES.DIAGRAM}
        onClick={() => {
          const portfolioUrl = process.env.PORTFOLIO_URL;
          global.platform.openTab({
            url: `${portfolioUrl}?metamaskEntry=ext`,
          });
          trackEvent(
            {
              category: EVENT.CATEGORIES.HOME,
              event: EVENT_NAMES.PORTFOLIO_LINK_CLICKED,
              properties: {
                url: portfolioUrl,
              },
            },
            {
              contextPropsIntoEventProperties: [CONTEXT_PROPS.PAGE_TITLE],
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
          iconName={ICON_NAMES.EXPAND}
          onClick={() => {
            global.platform.openExtensionInBrowser();
            trackEvent({
              event: EVENT_NAMES.APP_WINDOW_EXPANDED,
              category: EVENT.CATEGORIES.NAVIGATION,
              properties: {
                location: 'Account Options',
              },
            });
            closeMenu();
          }}
          data-testid="global-menu-expand"
        >
          {t('expandView')}
        </MenuItem>
      )}
      <MenuItem
        iconName={ICON_NAMES.MESSAGE_QUESTION}
        onClick={() => {
          global.platform.openTab({ url: SUPPORT_LINK });
          trackEvent(
            {
              category: EVENT.CATEGORIES.HOME,
              event: EVENT_NAMES.SUPPORT_LINK_CLICKED,
              properties: {
                url: SUPPORT_LINK,
              },
            },
            {
              contextPropsIntoEventProperties: [CONTEXT_PROPS.PAGE_TITLE],
            },
          );
          closeMenu();
        }}
        data-testid="global-menu-support"
      >
        {t('support')}
      </MenuItem>
      <MenuItem
        iconName={ICON_NAMES.SETTING}
        onClick={() => {
          history.push(SETTINGS_ROUTE);
          trackEvent({
            category: EVENT.CATEGORIES.NAVIGATION,
            event: EVENT_NAMES.NAV_SETTINGS_OPENED,
            properties: {
              location: 'Main Menu',
            },
          });
          closeMenu();
        }}
      >
        {t('settings')}
      </MenuItem>
      <MenuItem
        iconName={ICON_NAMES.LOCK}
        onClick={() => {
          dispatch(lockMetamask());
          history.push(DEFAULT_ROUTE);
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
