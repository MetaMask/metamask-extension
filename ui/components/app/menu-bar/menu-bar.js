import React, { useState, useContext } from 'react';
import browser from 'webextension-polyfill';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SelectedAccount from '../selected-account';
import ConnectedStatusIndicator from '../connected-status-indicator';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import { CONNECTED_ACCOUNTS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getOriginOfCurrentTab } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import AccountOptionsMenu from './account-options-menu';
import { Icon } from '../../component-library';

export default function MenuBar() {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const [accountOptionsButtonElement, setAccountOptionsButtonElement] =
    useState(null);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const origin = useSelector(getOriginOfCurrentTab);

  const showStatus =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    origin &&
    origin !== browser.runtime.id;

  return (
    <div className="menu-bar">
      {showStatus ? (
        <ConnectedStatusIndicator
          onClick={() => history.push(CONNECTED_ACCOUNTS_ROUTE)}
        />
      ) : null}

      <SelectedAccount />

      <div style={{'place-self': 'center end'}}>
        <button
          title="Toggle Privacy Mode"
          style={{background: 'transparent', padding: '0', marginRight: '10px'}}>
            { /* Also "eye-slash-filled" */ }
            <Icon name="eye-filled" /> 
        </button>

        <button
          className="fas fa-ellipsis-v menu-bar__account-options"
          data-testid="account-options-menu-button"
          ref={setAccountOptionsButtonElement}
          title={t('accountOptions')}
          onClick={() => {
            trackEvent({
              event: EVENT_NAMES.NAV_ACCOUNT_MENU_OPENED,
              category: EVENT.CATEGORIES.NAVIGATION,
              properties: {
                location: 'Home',
              },
            });
            setAccountOptionsMenuOpen(true);
          }}
        />
      </div>

      {accountOptionsMenuOpen && (
        <AccountOptionsMenu
          anchorElement={accountOptionsButtonElement}
          onClose={() => setAccountOptionsMenuOpen(false)}
        />
      )}
    </div>
  );
}
