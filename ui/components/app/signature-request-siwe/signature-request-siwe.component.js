import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import convertMsg from '../../../helpers/utils/format-message-params';
import ErrorMessage from '../../ui/error-message';

import { MetaMetricsContext } from '../../../contexts/metametrics.new';
import { I18nContext } from '../../../contexts/i18n';
import Header from './signature-request-header';
import Footer from './signature-request-footer';
import Message from './signature-request-message';

export default function SignatureRequestSIWE({
  txData: {
    msgParams: {
      version,
      siwe: { isSIWEDomainValid, messageData },
    },
    type,
  },
  cancel,
  sign,
  fromAccount,
}) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  const onSign = (event) => {
    sign(event);
    trackEvent({
      category: 'Transactions',
      event: 'Confirm',
      properties: {
        action: 'Sign Request',
        legacy_event: true,
        type,
        version,
      },
    });
  };

  const onCancel = (event) => {
    cancel(event);
    trackEvent({
      category: 'Transactions',
      event: 'Cancel',
      properties: {
        action: 'Sign Request',
        legacy_event: true,
        type,
        version,
      },
    });
  };

  return (
    <div className="signature-request page-container">
      <Header fromAccount={fromAccount} domain={messageData.domain} />
      <Message data={convertMsg(messageData)} />
      {!isSIWEDomainValid && (
        <div className="domain-mismatch-warning">
          <ErrorMessage errorKey="SIWEDomainInvalid" />
        </div>
      )}
      <Footer cancelAction={onCancel} signAction={onSign} />
    </div>
  );
}

SignatureRequestSIWE.propTypes = {
  /**
   * The display content of transaction data
   */
  txData: PropTypes.object.isRequired,
  /**
   * The display content of sender account
   */
  fromAccount: PropTypes.shape({
    address: PropTypes.string.isRequired,
    balance: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  /**
   * Check if the wallet is ledget wallet or not
   */
  isLedgerWallet: PropTypes.bool,
  /**
   * Handler for cancel button
   */
  cancel: PropTypes.func.isRequired,
  /**
   * Handler for sign button
   */
  sign: PropTypes.func.isRequired,
};
