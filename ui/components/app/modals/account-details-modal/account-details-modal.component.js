import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { getAccountLink } from '@metamask/etherscan-link';

import AccountModalContainer from '../account-modal-container';
import QrView from '../../../ui/qr-code';
import EditableLabel from '../../../ui/editable-label';
import Button from '../../../ui/button';

export default function AccountDetailsModal(props, context) {
  const {
    selectedIdentity,
    chainId,
    showExportPrivateKeyModal,
    setAccountLabel,
    keyrings,
    rpcPrefs,
    tryReverseResolveAddress,
    ensName,
  } = props;

  const { name, address } = selectedIdentity;

  useEffect(() => {
    if (address) {
      tryReverseResolveAddress(address);
    }
  });

  const keyring = keyrings.find((kr) => {
    return kr.accounts.includes(address);
  });

  let exportPrivateKeyFeatureEnabled = true;
  // This feature is disabled for hardware wallets
  if (keyring?.type?.search('Hardware') !== -1) {
    exportPrivateKeyFeatureEnabled = false;
  }

  const hasNickName = (accountLabel) => {
    const regExp = /Account [1-9][0-9]*$/u;
    return regExp.test(accountLabel);
  };

  return (
    <AccountModalContainer className="account-details-modal">
      <EditableLabel
        className="account-details-modal__name"
        defaultValue={hasNickName(name) ? ensName || name : name}
        onSubmit={(label) => setAccountLabel(address, label)}
      />

      <QrView
        Qr={{
          data: address,
        }}
      />

      <div className="account-details-modal__divider" />

      <Button
        type="secondary"
        className="account-details-modal__button"
        onClick={() => {
          const accountLink = getAccountLink(address, chainId, rpcPrefs);
          context.trackEvent({
            category: 'Navigation',
            event: 'Clicked Block Explorer Link',
            properties: {
              link_type: 'Account Tracker',
              action: 'Account Details Modal',
              block_explorer_domain: accountLink
                ? new URL(accountLink)?.hostname
                : '',
            },
          });
          global.platform.openTab({
            url: accountLink,
          });
        }}
      >
        {rpcPrefs.blockExplorerUrl
          ? context.t('blockExplorerView', [
              rpcPrefs.blockExplorerUrl.match(/^https?:\/\/(.+)/u)[1],
            ])
          : context.t('viewOnEtherscan')}
      </Button>

      {exportPrivateKeyFeatureEnabled ? (
        <Button
          type="secondary"
          className="account-details-modal__button"
          onClick={() => showExportPrivateKeyModal()}
        >
          {context.t('exportPrivateKey')}
        </Button>
      ) : null}
    </AccountModalContainer>
  );
}

AccountDetailsModal.contextTypes = {
  t: PropTypes.func,
  trackEvent: PropTypes.func,
};

AccountDetailsModal.propTypes = {
  selectedIdentity: PropTypes.object,
  chainId: PropTypes.string,
  showExportPrivateKeyModal: PropTypes.func,
  setAccountLabel: PropTypes.func,
  keyrings: PropTypes.array,
  rpcPrefs: PropTypes.object,
  tryReverseResolveAddress: PropTypes.func.isRequired,
  ensName: PropTypes.string,
};
