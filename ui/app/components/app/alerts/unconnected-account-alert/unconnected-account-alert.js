import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ALERT_STATE } from '../../../../ducks/alerts';
import {
  connectAccount,
  dismissAlert,
  dismissAndDisableAlert,
  getAlertState,
  switchToAccount,
} from '../../../../ducks/alerts/unconnected-account';
import {
  getOriginOfCurrentTab,
  getOrderedConnectedAccountsForActiveTab,
  getSelectedAddress,
  getSelectedIdentity,
} from '../../../../selectors';
import { isExtensionUrl } from '../../../../helpers/utils/util';
import Popover from '../../../ui/popover';
import Button from '../../../ui/button';
import Checkbox from '../../../ui/check-box';
import Tooltip from '../../../ui/tooltip';
import ConnectedAccountsList from '../../connected-accounts-list';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const { ERROR, LOADING } = ALERT_STATE;

const UnconnectedAccountAlert = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const alertState = useSelector(getAlertState);
  const connectedAccounts = useSelector(
    getOrderedConnectedAccountsForActiveTab,
  );
  const origin = useSelector(getOriginOfCurrentTab);
  const selectedIdentity = useSelector(getSelectedIdentity);
  const selectedAddress = useSelector(getSelectedAddress);
  const [dontShowThisAgain, setDontShowThisAgain] = useState(false);

  const onClose = async () => {
    return dontShowThisAgain
      ? await dispatch(dismissAndDisableAlert())
      : dispatch(dismissAlert());
  };

  const footer = (
    <>
      {alertState === ERROR ? (
        <div className="unconnected-account-alert__error">
          {t('failureMessage')}
        </div>
      ) : null}
      <div className="unconnected-account-alert__footer-row">
        <div className="unconnected-account-alert__checkbox-wrapper">
          <Checkbox
            id="unconnectedAccount_dontShowThisAgain"
            checked={dontShowThisAgain}
            className="unconnected-account-alert__checkbox"
            onClick={() => setDontShowThisAgain((checked) => !checked)}
          />
          <label
            className="unconnected-account-alert__checkbox-label"
            htmlFor="unconnectedAccount_dontShowThisAgain"
          >
            {t('dontShowThisAgain')}
            <Tooltip
              position="top"
              title={t('alertDisableTooltip')}
              wrapperClassName="unconnected-account-alert__checkbox-label-tooltip"
            >
              <i className="fa fa-info-circle" />
            </Tooltip>
          </label>
        </div>
        <Button
          disabled={alertState === LOADING}
          onClick={onClose}
          type="primary"
          rounded
          className="unconnected-account-alert__dismiss-button"
        >
          {t('dismiss')}
        </Button>
      </div>
    </>
  );

  return (
    <Popover
      title={
        isExtensionUrl(origin) ? t('currentExtension') : new URL(origin).host
      }
      subtitle={t('currentAccountNotConnected')}
      onClose={onClose}
      className="unconnected-account-alert"
      contentClassName="unconnected-account-alert__content"
      footerClassName="unconnected-account-alert__footer"
      footer={footer}
    >
      <ConnectedAccountsList
        accountToConnect={selectedIdentity}
        connectAccount={() => dispatch(connectAccount(selectedAddress))}
        connectedAccounts={connectedAccounts}
        selectedAddress={selectedAddress}
        setSelectedAddress={(address) => dispatch(switchToAccount(address))}
        shouldRenderListOptions={false}
      />
    </Popover>
  );
};

export default UnconnectedAccountAlert;
