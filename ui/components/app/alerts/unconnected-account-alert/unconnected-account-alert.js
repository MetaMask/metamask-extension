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
  getSelectedInternalAccount,
  getInternalAccounts,
} from '../../../../selectors';
import { isExtensionUrl, getURLHost } from '../../../../helpers/utils/util';
import Popover from '../../../ui/popover';
import Button from '../../../ui/button';
import Checkbox from '../../../ui/check-box';
import Tooltip from '../../../ui/tooltip';
import ConnectedAccountsList from '../../connected-accounts-list';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Icon, IconName, Text } from '../../../component-library';

const { ERROR, LOADING } = ALERT_STATE;

const UnconnectedAccountAlert = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const alertState = useSelector(getAlertState);
  const connectedAccounts = useSelector(
    getOrderedConnectedAccountsForActiveTab,
  );
  const internalAccounts = useSelector(getInternalAccounts);
  // Temporary fix until https://github.com/MetaMask/metamask-extension/pull/21553
  const internalAccountsMap = new Map(
    internalAccounts.map((acc) => [acc.address, acc]),
  );

  const connectedAccountsWithName = connectedAccounts.map((account) => ({
    ...account,
    name: internalAccountsMap.get(account.address)?.metadata.name,
  }));

  const origin = useSelector(getOriginOfCurrentTab);
  const account = useSelector(getSelectedInternalAccount);
  const { address: selectedAddress } = account;
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
            <Text>{t('dontShowThisAgain')}</Text>
            <Tooltip
              position="top"
              title={t('alertDisableTooltip')}
              wrapperClassName="unconnected-account-alert__checkbox-label-tooltip"
            >
              <Icon name={IconName.Info} />
            </Tooltip>
          </label>
        </div>
        <Button
          disabled={alertState === LOADING}
          onClick={onClose}
          type="primary"
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
        isExtensionUrl(origin) ? t('currentExtension') : getURLHost(origin)
      }
      subtitle={t('currentAccountNotConnected')}
      onClose={onClose}
      className="unconnected-account-alert"
      contentClassName="unconnected-account-alert__content"
      footerClassName="unconnected-account-alert__footer"
      footer={footer}
    >
      <ConnectedAccountsList
        accountToConnect={account}
        connectAccount={() => dispatch(connectAccount(selectedAddress))}
        connectedAccounts={connectedAccountsWithName}
        selectedAddress={selectedAddress}
        setSelectedAddress={(address) => {
          const { id: accountId } = internalAccounts.find(
            (internalAccount) => internalAccount.address === address,
          );
          dispatch(switchToAccount(accountId));
        }}
        shouldRenderListOptions={false}
      />
    </Popover>
  );
};

export default UnconnectedAccountAlert;
