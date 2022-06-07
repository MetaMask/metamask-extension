import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { EVENT } from '../../../../shared/constants/metametrics';
import ErrorMessage from '../../ui/error-message';
import ActionableMessage from '../../ui/actionable-message';
import Popover from '../../ui/popover';
import Checkbox from '../../ui/check-box';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { I18nContext } from '../../../contexts/i18n';
import { PageContainerFooter } from '../../ui/page-container';
import formatMessageParams from './format-message-params';
import Header from './signature-request-siwe-header';
import Message from './signature-request-siwe-message';

export default function SignatureRequestSIWE({
  txData: {
    msgParams: {
      version,
      siwe: { isSIWEDomainValid, isMatchingAddress, messageData },
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
      category: EVENT.CATEGORIES.TRANSACTIONS,
      event: 'Confirm',
      properties: {
        action: 'SIWE Request',
        type,
        version,
      },
    });
  };

  const onCancel = (event) => {
    cancel(event);
    trackEvent({
      category: EVENT.CATEGORIES.TRANSACTIONS,
      event: 'Cancel',
      properties: {
        action: 'SIWE Request',
        type,
        version,
      },
    });
  };

  const generateSIWEWarning = () => {
    let showError = false;
    let errorMessage = '';
    let confirmErrorMessage = '';

    if (!isSIWEDomainValid) {
      showError = true;
      errorMessage += `${t('SIWEDomainInvalid', [messageData.domain])} `;
      confirmErrorMessage += `${t('SIWEDomainWarningBody', [
        messageData.domain,
      ])} `;
    }

    if (!isMatchingAddress) {
      showError = true;
      errorMessage += `${t('SIWEAddressInvalid', [
        messageData.address,
        fromAccount.address,
      ])} `;
      confirmErrorMessage += `${t('SIWEAddressInvalid', [
        messageData.address,
        fromAccount.address,
      ])} `;
    }

    return {
      showError,
      errorMessage: errorMessage.trim(),
      confirmErrorMessage: confirmErrorMessage.trim(),
    };
  };

  const {
    showError,
    errorMessage,
    confirmErrorMessage,
  } = generateSIWEWarning();

  console.log(showError, errorMessage, confirmErrorMessage);

  return (
    <div className="signature-request-siwe">
      <Header
        fromAccount={fromAccount}
        domain={messageData.domain}
        isSIWEDomainValid={isSIWEDomainValid}
        subjectMetadata={subjectMetadata}
      />
      <Message data={formatMessageParams(messageData, t)} />
      {!isMatchingAddress && (
        <div className="signature-request-siwe__domain-mismatch-warning">
          <ActionableMessage
            type="warning"
            message={t('SIWEAddressInvalid', [
              messageData.address,
              fromAccount.address,
            ])}
            iconFillColor="var(--color-warning-default)"
            useIcon
            withRightButton
            className="no-margin-top"
          />
        </div>
      )}
      {!isSIWEDomainValid && (
        <div className="signature-request-siwe__domain-mismatch-warning">
          <ErrorMessage
            errorMessage={t('SIWEDomainInvalid', [messageData.domain])}
          />
        </div>
      )}
      <PageContainerFooter
        footerClassName="signature-request-siwe__page-container-footer"
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
          className="signature-request-siwe__popover"
          footerClassName="signature-request-siwe__popover__footer"
          footer={
            <PageContainerFooter
              footerClassName="signature-request-siwe__popover__footer__warning-footer"
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
          <div className="signature-request-siwe__popover__checkbox-wrapper">
            <Checkbox
              id="domainWarning_checkbox"
              checked={agreeToDomainWarning}
              className="signature-request-siwe__popover__checkbox-wrapper__checkbox checkbox checkbox--error"
              onClick={() => setAgreeToDomainWarning((checked) => !checked)}
            />
            <label
              className="signature-request-siwe__popover__checkbox-wrapper__checkbox__label"
              htmlFor="domainWarning_checkbox"
            >
              {confirmErrorMessage}
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
