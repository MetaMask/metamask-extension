import React, { useState } from 'react';
import extension from 'extensionizer';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SelectedAccount from '../selected-account';
import ConnectedStatusIndicator from '../connected-status-indicator';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { CONNECTED_ACCOUNTS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMetricEvent } from '../../../hooks/useMetricEvent';
import { getOriginOfCurrentTab } from '../../../selectors';
import AccountOptionsMenu from './account-options-menu';

export default function MenuBar() {
  const t = useI18nContext();
  const openAccountOptionsEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Opened Account Options',
    },
  });
  const history = useHistory();
  const [
    accountOptionsButtonElement,
    setAccountOptionsButtonElement,
  ] = useState(null);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const origin = useSelector(getOriginOfCurrentTab);

  const showStatus =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    origin &&
    origin !== extension.runtime.id;

  return (
    <div className="menu-bar">
      {showStatus ? (
        <ConnectedStatusIndicator
          onClick={() => history.push(CONNECTED_ACCOUNTS_ROUTE)}
        />
      ) : null}

      <SelectedAccount />

      <button
        className="fas fa-ellipsis-v menu-bar__account-options"
        data-testid="account-options-menu-button"
        ref={setAccountOptionsButtonElement}
        title={t('accountOptions')}
        onClick={() => {
          openAccountOptionsEvent();
          setAccountOptionsMenuOpen(true);
        }}
      />

      {accountOptionsMenuOpen && (
        <AccountOptionsMenu
          anchorElement={accountOptionsButtonElement}
          onClose={() => setAccountOptionsMenuOpen(false)}
        />
      )}
    </div>
  );
}
