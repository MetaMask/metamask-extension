import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import ActionableMessage from '../../ui/actionable-message';
import Popover from '../../ui/popover';
import Checkbox from '../../ui/check-box';
import { I18nContext } from '../../../contexts/i18n';
import { PageContainerFooter } from '../../ui/page-container';
import {
  accountsWithSendEtherInfoSelector,
  getSubjectMetadata,
} from '../../../selectors';
import { getAccountByAddress } from '../../../helpers/utils/util';
import { formatMessageParams } from '../../../../shared/modules/siwe';
import { Icon } from '../../component-library/icon/icon';
import { COLORS } from '../../../helpers/constants/design-system';

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
    },
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);
  const targetSubjectMetadata = subjectMetadata[origin];

  const t = useContext(I18nContext);

  const isMatchingAddress =
    from.toLowerCase() === parsedMessage.address.toLowerCase();

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

  const onSign = useCallback(
    async (event) => {
      try {
        await signPersonalMessage(event);
      } catch (e) {
        log.error(e);
      }
    },
    [signPersonalMessage],
  );

  const onCancel = useCallback(
    async (event) => {
      try {
        await cancelPersonalMessage(event);
      } catch (e) {
        log.error(e);
      }
    },
    [cancelPersonalMessage],
  );

  return (
    <div className="signature-request-siwe">
      <Header
        fromAccount={fromAccount}
        domain={parsedMessage.domain}
        isSIWEDomainValid={isSIWEDomainValid}
        subjectMetadata={targetSubjectMetadata}
      />
      <Message data={formatMessageParams(parsedMessage, t)} />
      {!isMatchingAddress && (
        <ActionableMessage
          className="signature-request-siwe__actionable-message"
          type="warning"
          message={t('SIWEAddressInvalid', [
            parsedMessage.address,
            fromAccount.address,
          ])}
          iconFillColor="var(--color-warning-default)"
          useIcon
          withRightButton
          icon={<Icon name="danger" color={COLORS.WARNING_DEFAULT} />}
        />
      )}
      {!isSIWEDomainValid && (
        <ActionableMessage
          className="signature-request-siwe__actionable-message"
          type="danger"
          message={
            <>
              <p
                className="typography--weight-bold"
                style={{ display: 'inline' }}
              >
                {t('SIWEDomainInvalidTitle')}
              </p>{' '}
              {t('SIWEDomainInvalidText')}
            </>
          }
          iconFillColor="var(--color-error-default)"
          useIcon
          withRightButton
          icon={<Icon name="danger" color={COLORS.ERROR_DEFAULT} />}
        />
      )}
      <PageContainerFooter
        footerClassName="signature-request-siwe__page-container-footer"
        onCancel={onCancel}
        onSubmit={
          isSIWEDomainValid ? onSign : () => setIsShowingDomainWarning(true)
        }
        cancelText={t('cancel')}
        submitText={t('signin')}
        submitButtonType={isSIWEDomainValid ? 'primary' : 'danger-primary'}
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
