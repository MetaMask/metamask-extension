import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import log from 'loglevel';
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

  /**
   * WIP
   *
   * @todo update MetaMetrics for onSign and onCancel
   * Currently, we're tracking the events similarily to how we track the events with the SignatureRequest component
   * in which the action names differ. We want to revisit this to add properties mentioned in the related, internal Slack thread.
   * We would also want to ensure that we are tracking the event appropriatedly should an error be thrown.
   *
   * Follow-up Questions:
   * 1. Are we utilizing MetaMetrics sensitive_properties?
   * 2. Are we captureing the "Signature Request" event name elsewhere?
   * 3. Should we spend time to include account_hardware_type? We might be able to create a selector to perform findKeyringForAddress
   * 4. Should we add validation_errors? what is this in the context of transactions?
   * @see {@link ui/components/app/signature-request/signature-request.component.js}
   * @see {@link https://consensys.slack.com/archives/C031PSFHQER/p1654811895007879?thread_ts=1654805714.261689&cid=C031PSFHQER}
   */
  const onSign = useCallback(
    async (event) => {
      let response;

      try {
        response = await signPersonalMessage(event);
      } catch (e) {
        log.error(e);
      } finally {
        console.log(parsedMessage);
        console.log(response);

        trackEvent({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          event: 'Signature Signed',
          properties: {
            action: 'SIWE Request',

            // signature_type
            type,

            // this is url orrr we could use parsedMessage.domain. this would be without "https://".
            // e.g.
            // origin = https://spruceid.github.io. I believe this should be the same as parsedMessage.uri: "https://spruceid.github.io"
            // parsedMessage.domain = spruceid.github.io
            url: origin,

            // account type? need to verify
            // why is version resulting in undefined here, but parsedMessage.version === "1"?
            version, // is this account type?

            // NEW
            // chain_id
            chainId: parsedMessage.chainId,

            // ✓ account_type - [default, imported, undefined, hardware] - version?
            // account_hardware_type - [ledger, trezor, lattice, qr_code]
            // ✓ chain_id - [0x1, ...]
            // ✓ signature_type - [personal_sign, eth_signTypedData, eth_sign, encrypt, decrypt] - type
            // ✓ url - full url - origin
            // ? validation_errors (list) - []
          },
        });
      }
    },
    [origin, parsedMessage, signPersonalMessage, trackEvent, type, version],
  );

  const onCancel = useCallback(
    async (event) => {
      let response;

      try {
        response = await cancelPersonalMessage(event);
      } catch (e) {
        log.error(e);
      } finally {
        console.log(parsedMessage);
        console.log(response);

        trackEvent({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          event: 'Signature Canceled',
          properties: {
            action: 'SIWE Request',

            // signature_type
            type,

            // this is url orrr we could use parsedMessage.domain. this would be without "https://".
            // e.g.
            // origin = https://spruceid.github.io. I believe this should be the same as parsedMessage.uri: "https://spruceid.github.io"
            // parsedMessage.domain = spruceid.github.io
            url: origin,

            // account type? need to verify
            // why is version resulting in undefined here, but parsedMessage.version === "1"?
            version, // is this account type?

            // NEW
            // chain_id
            chainId: parsedMessage.chainId,

            // ✓ account_type - [default, imported, undefined, hardware] - version?
            // account_hardware_type - [ledger, trezor, lattice, qr_code]
            // ✓ chain_id - [0x1, ...]
            // ✓ signature_type - [personal_sign, eth_signTypedData, eth_sign, encrypt, decrypt] - type
            // ✓ url - full url - origin
            // ? validation_errors (list) - []
          },
        });
      }
    },
    [cancelPersonalMessage, origin, parsedMessage, trackEvent, type, version],
  );

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
        />
      )}
      {!isSIWEDomainValid && (
        <ActionableMessage
          className="signature-request-siwe__actionable-message"
          type="danger"
          message={t('SIWEDomainInvalid', [parsedMessage.domain])}
          iconFillColor="var(--color-error-default)"
          useIcon
          withRightButton
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
