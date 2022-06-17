import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { EVENT } from '../../../../shared/constants/metametrics';
import ActionableMessage from '../../ui/actionable-message';
import Popover from '../../ui/popover';
import Checkbox from '../../ui/check-box';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { I18nContext } from '../../../contexts/i18n';
import { PageContainerFooter } from '../../ui/page-container';
import {
  accountsWithSendEtherInfoSelector,
  getSubjectMetadata,
} from '../../../selectors';
import { getAccountByAddress } from '../../../helpers/utils/util';
import formatMessage from './format-message-params';
import Header from './signature-request-siwe-header';
import Message from './signature-request-siwe-message';

export default function SignatureRequestSIWE({
  txData,
  cancelPersonalMessage,
  signPersonalMessage,
}) {
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const subjectMetadata = useSelector(getSubjectMetadata);

  const {
    msgParams: {
      from,
      origin,
      siwe: { parsedMessage },
      version,
    },
    type,
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);
  const targetSubjectMetadata = subjectMetadata[origin];

  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  const isMatchingAddress = from === parsedMessage.address;

  const checkSIWEDomain = () => {
    let isSIWEDomainValid = false;

    if (origin) {
      const { host } = new URL(origin);
      isSIWEDomainValid = parsedMessage.domain === host;
    }
    return isSIWEDomainValid;
  };

  const isSIWEDomainValid = checkSIWEDomain();

  const [isShowingDomainWarning, setIsShowingDomainWarning] = useState(false);
  const [agreeToDomainWarning, setAgreeToDomainWarning] = useState(false);
  const onSign = (event) => {
    signPersonalMessage(event);
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
    cancelPersonalMessage(event);
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

  return (
    <div className="signature-request-siwe">
      <Header
        fromAccount={fromAccount}
        domain={parsedMessage.domain}
        isSIWEDomainValid={isSIWEDomainValid}
        subjectMetadata={targetSubjectMetadata}
      />
      <Message data={formatMessage(parsedMessage, t)} />
      {!isMatchingAddress && (
        <div className="signature-request-siwe__domain-mismatch-warning">
          <ActionableMessage
            type="warning"
            message={t('SIWEAddressInvalid', [
              parsedMessage.address,
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
          <ActionableMessage
            type="danger"
            message={t('SIWEDomainInvalid', [parsedMessage.domain])}
            iconFillColor="var(--color-error-default)"
            useIcon
            withRightButton
            className="no-margin-top"
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
          className="signature-request-siwe__warning-popover"
          footerClassName="signature-request-siwe__warning-popover__footer"
          footer={
            <PageContainerFooter
              footerClassName="signature-request-siwe__warning-popover__footer__warning-footer"
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
          <div className="signature-request-siwe__warning-popover__checkbox-wrapper">
            <Checkbox
              id="signature-request-siwe_domain-checkbox"
              checked={agreeToDomainWarning}
              className="signature-request-siwe__warning-popover__checkbox-wrapper__checkbox"
              onClick={() => setAgreeToDomainWarning((checked) => !checked)}
            />
            <label
              className="signature-request-siwe__warning-popover__checkbox-wrapper__label"
              htmlFor="signature-request-siwe_domain-checkbox"
            >
              {t('SIWEDomainWarningBody', [parsedMessage.domain])}
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
   * Handler for cancel button
   */
  cancelPersonalMessage: PropTypes.func.isRequired,
  /**
   * Handler for sign button
   */
  signPersonalMessage: PropTypes.func.isRequired,
};
