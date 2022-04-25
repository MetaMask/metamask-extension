import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import convertMsg from '../../../helpers/utils/format-message-params';
import ErrorMessage from '../../ui/error-message';
import Popover from '../../ui/popover';
import Checkbox from '../../ui/check-box';

import { MetaMetricsContext } from '../../../contexts/metametrics.new';
import { I18nContext } from '../../../contexts/i18n';
import { PageContainerFooter } from '../../ui/page-container';
import Header from './signature-request-header';
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
  subjectMetadata,
}) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  const [isShowingDomainWarning, setIsShowingDomainWarning] = useState(false);
  const [agreeToDomainWarning, setAgreeToDomainWarning] = useState(false);

  const onSign = (event) => {
    sign(event);
    trackEvent({
      category: 'Transactions',
      event: 'Confirm',
      properties: {
        action: 'SIWE Request',
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
        action: 'SIWE Request',
        legacy_event: true,
        type,
        version,
      },
    });
  };

  return (
    <div className="signature-request page-container">
      <Header
        fromAccount={fromAccount}
        domain={messageData.domain}
        isSIWEDomainValid={isSIWEDomainValid}
        subjectMetadata={subjectMetadata}
      />
      <Message data={convertMsg(messageData)} />
      {!isSIWEDomainValid && (
        <div className="domain-mismatch-warning">
          <ErrorMessage
            errorMessage={t('SIWEDomainInvalid', [messageData.domain])}
          />
        </div>
      )}
      <PageContainerFooter
        footerClassName="no-border"
        onCancel={onCancel}
        onSubmit={
          isSIWEDomainValid ? onSign : () => setIsShowingDomainWarning(true)
        }
        cancelText={t('cancel')}
        submitText={t('signin')}
      />
      {isShowingDomainWarning && (
        <Popover
          onClose={() => setIsShowingDomainWarning(false)}
          title={t('SIWEWarningTitle')}
          subtitle={t('SIWEWarningSubtitle')}
          footerClassName="no-padding"
          footer={
            <PageContainerFooter
              footerClassName="warning-footer no-border"
              onCancel={() => setIsShowingDomainWarning(false)}
              cancelText={t('cancel')}
              cancelButtonType="default"
              onSubmit={onSign}
              submitText={t('confirm')}
              submitButtonType="danger-primary"
              disabled={!agreeToDomainWarning}
            />
          }
        >
          <div className="checkbox-wrapper">
            <Checkbox
              id="domainWarning_checkbox"
              checked={agreeToDomainWarning}
              className="checkbox color-red"
              onClick={() => setAgreeToDomainWarning((checked) => !checked)}
            />
            <label className="checkbox-label" htmlFor="domainWarning_checkbox">
              {t('SIWEWarningBody', [messageData.domain])}
            </label>
          </div>
        </Popover>
      )}
    </div>
  );
}

SignatureRequestSIWE.propTypes = {
  /**
   * The display content of transaction data
   */
  txData: PropTypes.object.isRequired,
  /**
   * The metadata for the calling site
   */
  subjectMetadata: PropTypes.object.isRequired,
  /**
   * The display content of sender account
   */
  fromAccount: PropTypes.shape({
    address: PropTypes.string.isRequired,
    balance: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  /**
   * Handler for cancel button
   */
  cancel: PropTypes.func.isRequired,
  /**
   * Handler for sign button
   */
  sign: PropTypes.func.isRequired,

};
