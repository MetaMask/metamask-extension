import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import copyToClipboard from 'copy-to-clipboard';
import classnames from 'classnames';
import log from 'loglevel';

import AccountListItem from '../../components/app/account-list-item';
import Identicon from '../../components/ui/identicon';
import Tooltip from '../../components/ui/tooltip';
import { PageContainerFooter } from '../../components/ui/page-container';

import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { SECOND } from '../../../shared/constants/time';
import { Numeric } from '../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../shared/constants/common';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Icon,
} from '../../components/component-library';
import { formatCurrency } from '../../helpers/utils/confirm-tx.util';
import { getValueFromWeiHex } from '../../../shared/modules/conversion.utils';
import { COPY_OPTIONS } from '../../../shared/constants/copy';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useScrollRequired } from '../../hooks/useScrollRequired';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
} from '../../helpers/constants/design-system';

const Header = () => {
  const t = useI18nContext();
  return (
    <div className="request-decrypt-message__header">
      <div className="request-decrypt-message__header-background" />
      <div className="request-decrypt-message__header__text">
        {t('decryptRequest')}
      </div>
      <div className="request-decrypt-message__header__tip-container">
        <div className="request-decrypt-message__header__tip" />
      </div>
    </div>
  );
};

const Account = ({
  conversionRate,
  currentCurrency,
  fromAccount,
  nativeCurrency,
  requesterAddress,
}) => {
  const t = useI18nContext();

  const nativeCurrencyBalance = conversionRate
    ? formatCurrency(
        getValueFromWeiHex({
          value: fromAccount.balance,
          fromCurrency: nativeCurrency,
          toCurrency: currentCurrency,
          conversionRate,
          numberOfDecimals: 6,
          toDenomination: EtherDenomination.ETH,
        }),
        currentCurrency,
      )
    : new Numeric(fromAccount.balance, 16, EtherDenomination.WEI)
        .toDenomination(EtherDenomination.ETH)
        .round(6)
        .toBase(10)
        .toString();

  return (
    <div className="request-decrypt-message__account-info">
      <div className="request-decrypt-message__account">
        <div className="request-decrypt-message__account-text">
          {`${t('account')}:`}
        </div>
        <div className="request-decrypt-message__account-item">
          <AccountListItem account={fromAccount} />
        </div>
      </div>
      <div className="request-decrypt-message__request-icon">
        <Identicon diameter={40} address={requesterAddress} />
      </div>
      <div className="request-decrypt-message__balance">
        <div className="request-decrypt-message__balance-text">
          {`${t('balance')}:`}
        </div>
        <div className="request-decrypt-message__balance-value">
          {`${nativeCurrencyBalance} ${
            conversionRate ? currentCurrency?.toUpperCase() : nativeCurrency
          }`}
        </div>
      </div>
    </div>
  );
};

const VisualSection = ({ name, notice, targetSubjectMetadata }) => (
  <div className="request-decrypt-message__visual">
    <section>
      {targetSubjectMetadata?.iconUrl ? (
        <img
          className="request-decrypt-message__visual-identicon"
          src={targetSubjectMetadata.iconUrl}
          alt=""
        />
      ) : (
        <i className="request-decrypt-message__visual-identicon--default">
          {name.charAt(0).toUpperCase()}
        </i>
      )}
      <div className="request-decrypt-message__notice">{notice}</div>
    </section>
  </div>
);

// const MessageContainer = ({
//   copyMessage,
//   copyToClipboardPressed,
//   decryptMessageInline,
//   errorMessage,
//   hasCopied,
//   hasDecrypted,
//   hasError,
//   isScrollable,
//   isScrolledToBottom,
//   onScroll,
//   rawMessage,
//   ref,
//   scrollToBottom,
//   setCopyToClipboardPressed,
//   setErrorMessage,
//   setHasDecrypted,
//   setHasError,
//   setRawMessage,
//   txData,
// }) => {
//   const t = useI18nContext();

//   console.log({ hasDecrypted, hasError, isScrollable, isScrolledToBottom });

//   return (

//   );
// };

const Footer = ({
  cancelDecryptMessage,
  clearConfirmTransaction,
  decryptMessage,
  hasScrolledToBottom,
  history,
  isScrollable,
  mostRecentOverviewPage,
  txData,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <PageContainerFooter
      cancelText={t('cancel')}
      submitText={t('decrypt')}
      disabled={isScrollable && !hasScrolledToBottom}
      onCancel={async (event) => {
        await cancelDecryptMessage(txData, event);
        trackEvent({
          category: MetaMetricsEventCategory.Messages,
          event: 'Cancel',
          properties: {
            action: 'Decrypt Message Request',
            legacy_event: true,
          },
        });
        clearConfirmTransaction();
        history.push(mostRecentOverviewPage);
      }}
      onSubmit={async (event) => {
        await decryptMessage(txData, event);
        trackEvent({
          category: MetaMetricsEventCategory.Messages,
          event: 'Confirm',
          properties: {
            action: 'Decrypt Message Request',
            legacy_event: true,
          },
        });
        clearConfirmTransaction();
        history.push(mostRecentOverviewPage);
      }}
    />
  );
};

const ConfirmDecryptMessage = ({
  cancelDecryptMessage,
  clearConfirmTransaction,
  conversionRate,
  currentCurrency,
  decryptMessage,
  decryptMessageInline,
  fromAccount,
  history,
  mostRecentOverviewPage,
  nativeCurrency,
  requesterAddress,
  subjectMetadata,
  txData,
}) => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  const [copyToClipboardPressed, setCopyToClipboardPressed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [hasDecrypted, setHasDecrypted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [rawMessage, setRawMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    hasScrolledToBottom,
    isScrollable,
    isScrolledToBottom,
    onScroll,
    scrollToBottom,
    ref,
  } = useScrollRequired([rawMessage], {
    offsetPxFromBottom: 0,
  });

  const copyMessage = () => {
    copyToClipboard(rawMessage, COPY_OPTIONS);
    trackEvent({
      category: MetaMetricsEventCategory.Messages,
      event: 'Copy',
      properties: {
        action: 'Decrypt Message Copy',
        legacy_event: true,
      },
    });
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), SECOND * 3);
  };

  const targetSubjectMetadata = subjectMetadata[txData.msgParams.origin];
  const name = targetSubjectMetadata?.name || txData.msgParams.origin;
  const notice = t('decryptMessageNotice', [txData.msgParams.origin]);

  if (!txData) {
    log.warn('ConfirmDecryptMessage Page: Missing txData prop.');
    return null;
  }

  return (
    <div className="request-decrypt-message__container">
      <Header />
      <div className="request-decrypt-message__body">
        <Account
          conversionRate={conversionRate}
          currentCurrency={currentCurrency}
          fromAccount={fromAccount}
          nativeCurrency={nativeCurrency}
          requesterAddress={requesterAddress}
        />
        <VisualSection
          name={name}
          notice={notice}
          targetSubjectMetadata={targetSubjectMetadata}
        />
        <div className="request-decrypt-message__message-container">
          <div className="request-decrypt-message__message">
            <div
              className="request-decrypt-message__message-text"
              ref={ref}
              onScroll={onScroll}
            >
              {!hasDecrypted && !hasError ? txData.msgParams.data : rawMessage}
              {hasError ? errorMessage : ''}
            </div>
            <div
              className={classnames('request-decrypt-message__message-cover', {
                'request-decrypt-message__message-lock--pressed':
                  hasDecrypted || hasError,
              })}
            />
            <div
              className={classnames('request-decrypt-message__message-lock', {
                'request-decrypt-message__message-lock--pressed':
                  hasDecrypted || hasError,
              })}
              onClick={(event) => {
                decryptMessageInline(txData, event).then((result) => {
                  if (result.error) {
                    setHasError(true);
                    setErrorMessage(t('decryptInlineError', [result.error]));
                  } else {
                    setHasDecrypted(true);
                    setRawMessage(result.rawSig);
                  }
                });
              }}
            >
              <div className="request-decrypt-message__message-lock__container">
                <i className="fa fa-lock fa-lg request-decrypt-message__message-lock__container__icon" />
                <div className="request-decrypt-message__message-lock__container__text">
                  {t('decryptMetamask')}
                </div>
              </div>
            </div>
          </div>
          {hasDecrypted && !hasError && isScrollable && !isScrolledToBottom && (
            <ButtonIcon
              className="scroll-to-bottom__button"
              onClick={scrollToBottom}
              iconName={IconName.Arrow2Down}
              ariaLabel={t('scrollDown')}
              backgroundColor={BackgroundColor.primaryDefault}
              borderRadius={BorderRadius.full}
              color={IconColor.primaryInverse}
              display={Display.Flex}
              size={ButtonIconSize.Md}
            />
          )}
          {hasDecrypted ? (
            <div
              className={classnames({
                'request-decrypt-message__message-copy': true,
                'request-decrypt-message__message-copy--pressed':
                  copyToClipboardPressed,
              })}
              onClick={copyMessage}
              onMouseDown={() => setCopyToClipboardPressed(true)}
              onMouseUp={() => setCopyToClipboardPressed(false)}
            >
              <Tooltip
                position="bottom"
                title={
                  hasCopied ? t('copiedExclamation') : t('copyToClipboard')
                }
                wrapperClassName="request-decrypt-message__message-copy-tooltip"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <div className="request-decrypt-message__message-copy-text">
                  {t('decryptCopy')}
                </div>
                <Icon
                  name={hasCopied ? IconName.CopySuccess : IconName.Copy}
                  color={IconColor.primaryDefault}
                />
              </Tooltip>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
      <Footer
        cancelDecryptMessage={cancelDecryptMessage}
        clearConfirmTransaction={clearConfirmTransaction}
        decryptMessage={decryptMessage}
        hasScrolledToBottom={hasScrolledToBottom}
        history={history}
        isScrollable={isScrollable}
        mostRecentOverviewPage={mostRecentOverviewPage}
        txData={txData}
      />
    </div>
  );
};

ConfirmDecryptMessage.propTypes = {
  cancelDecryptMessage: PropTypes.func.isRequired,
  clearConfirmTransaction: PropTypes.func.isRequired,
  conversionRate: PropTypes.number,
  currentCurrency: PropTypes.string.isRequired,
  decryptMessage: PropTypes.func.isRequired,
  decryptMessageInline: PropTypes.func.isRequired,
  fromAccount: PropTypes.shape({
    address: PropTypes.string.isRequired,
    balance: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  history: PropTypes.object.isRequired,
  mostRecentOverviewPage: PropTypes.string.isRequired,
  nativeCurrency: PropTypes.string.isRequired,
  requesterAddress: PropTypes.string,
  subjectMetadata: PropTypes.object,
  txData: PropTypes.object,
};

export default ConfirmDecryptMessage;
