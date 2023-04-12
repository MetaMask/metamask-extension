import React, { useState, useContext, useRef } from 'react';
import browser from 'webextension-polyfill';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SelectedAccount from '../selected-account';
import ConnectedStatusIndicator from '../connected-status-indicator';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { CONNECTED_ACCOUNTS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getOriginOfCurrentTab } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ButtonIcon } from '../../component-library/button-icon/deprecated';
import { ICON_NAMES } from '../../component-library/icon/deprecated';
import { GlobalMenu } from '../../multichain/global-menu';
import AccountOptionsMenu from './account-options-menu';

export default function MenuBar() {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const origin = useSelector(getOriginOfCurrentTab);
  const ref = useRef(false);

  const showStatus =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    origin &&
    origin !== browser.runtime.id;

  return (
    <div className="menu-bar">
      {showStatus ? ( // TODO: Move the connection status menu icon to the correct position in header once we implement the new header
        <ConnectedStatusIndicator
          onClick={() => history.push(CONNECTED_ACCOUNTS_ROUTE)}
        />
      ) : null}
      <SelectedAccount />
      <span style={{ display: 'inherit' }} ref={ref}>
        <ButtonIcon
          iconName={ICON_NAMES.MORE_VERTICAL}
          className="menu-bar__account-options"
          data-testid="account-options-menu-button"
          ariaLabel={t('accountOptions')}
          onClick={() => {
            trackEvent({
              event: MetaMetricsEventName.NavAccountMenuOpened,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                location: 'Home',
              },
            });
            setAccountOptionsMenuOpen(true);
          }}
        />
      </span>
      {accountOptionsMenuOpen &&
        (process.env.MULTICHAIN ? (
          <GlobalMenu
            anchorElement={ref.current}
            closeMenu={() => setAccountOptionsMenuOpen(false)}
          />
        ) : (
          <AccountOptionsMenu
            anchorElement={ref.current}
            onClose={() => setAccountOptionsMenuOpen(false)}
          />
        ))}
    </div>
  );
}
