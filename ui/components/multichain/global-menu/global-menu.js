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
import { IconName } from '../../component-library';
import { Menu, MenuItem } from '../../ui/menu';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
  MetaMetricsContextProp,
} from '../../../../shared/constants/metametrics';

export const GlobalMenu = ({ closeMenu, anchorElement }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();

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
          const portfolioUrl = process.env.PORTFOLIO_URL;
          global.platform.openTab({
            url: `${portfolioUrl}?metamaskEntry=ext`,
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
      <MenuItem
        iconName={IconName.MessageQuestion}
        onClick={() => {
          global.platform.openTab({ url: SUPPORT_LINK });
          trackEvent(
            {
              category: MetaMetricsEventCategory.Home,
              event: MetaMetricsEventName.SupportLinkClicked,
              properties: {
                url: SUPPORT_LINK,
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
        {t('support')}
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
