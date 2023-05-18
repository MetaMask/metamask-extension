import React, { useState, useContext, useRef } from 'react';
import browser from 'webextension-polyfill';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { getCustodianIconForAddress } from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IN
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
import {
  getOriginOfCurrentTab,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getSelectedAddress,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ButtonIcon, IconName } from '../../component-library';
import AccountOptionsMenu from './account-options-menu';

export default function MenuBar() {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const origin = useSelector(getOriginOfCurrentTab);
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const selectedAddress = useSelector(getSelectedAddress);
  const custodianIcon = useSelector((state) =>
    getCustodianIconForAddress(state, selectedAddress),
  );
  ///: END:ONLY_INCLUDE_IN
  const ref = useRef(false);

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
      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
        custodianIcon && (
          <div className="menu-bar__custody-logo" data-testid="custody-logo">
            <img
              src={custodianIcon}
              className="menu-bar__custody-logo--icon"
              alt=""
            />
          </div>
        )
        ///: END:ONLY_INCLUDE_IN
      }
      <SelectedAccount />
      <span style={{ display: 'inherit' }} ref={ref}>
        <ButtonIcon
          iconName={IconName.MoreVertical}
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
      {accountOptionsMenuOpen && (
        <AccountOptionsMenu
          anchorElement={ref.current}
          onClose={() => setAccountOptionsMenuOpen(false)}
        />
      )}
    </div>
  );
}
