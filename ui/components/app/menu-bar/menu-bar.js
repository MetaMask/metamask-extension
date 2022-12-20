import React, { useState, useContext } from 'react';
import browser from 'webextension-polyfill';
import { useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import SelectedAccount from '../selected-account';
import ConnectedStatusIndicator from '../connected-status-indicator';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';
import { CONNECTED_ACCOUNTS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getOriginOfCurrentTab,
  getPrivacyModeEnabled,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Icon } from '../../component-library';
import { setPrivacyModeEnabled } from '../../../store/actions';
import {
  COLORS,
  DISPLAY,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box';
import AccountOptionsMenu from './account-options-menu';

export default function MenuBar() {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const [accountOptionsButtonElement, setAccountOptionsButtonElement] =
    useState(null);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const origin = useSelector(getOriginOfCurrentTab);
  const privacyModeEnabled = useSelector(getPrivacyModeEnabled);

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

      <Box
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        className="menu-bar__buttons-container"
      >
        <button
          title={t('togglePrivacyMode')}
          className="menu-bar__buttons-container__privacy-mode"
          onClick={() => dispatch(setPrivacyModeEnabled(!privacyModeEnabled))}
        >
          <Icon
            name={privacyModeEnabled ? 'eye-slash-filled' : 'eye-filled'}
            color={
              privacyModeEnabled ? COLORS.PRIMARY_DEFAULT : COLORS.TEXT_DEFAULT
            }
          />
        </button>

        <button
          className="fas fa-ellipsis-v menu-bar__buttons-container__account-options"
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
      </Box>

      {accountOptionsMenuOpen && (
        <AccountOptionsMenu
          anchorElement={accountOptionsButtonElement}
          onClose={() => setAccountOptionsMenuOpen(false)}
        />
      )}
    </div>
  );
}
