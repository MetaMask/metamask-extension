/* eslint-disable react/prop-types */
import React, { useState, useContext, forwardRef } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import classnames from 'classnames';
import log from 'loglevel';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { cloneDeep } from 'lodash';

import AccountListItem from '../../components/app/account-list-item';
import Tooltip from '../../components/ui/tooltip';
import { PageContainerFooter } from '../../components/ui/page-container';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getNativeCurrency } from '../../ducks/metamask/metamask';
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
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import {
  decryptMsg,
  cancelDecryptMsg,
  decryptMsgInline,
} from '../../store/actions';
import {
  getTargetAccountWithSendEtherInfo,
  unconfirmedTransactionsListSelector,
} from '../../selectors';

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

const Account = ({ fromAccount, nativeCurrency }) => {
  const t = useI18nContext();

  const nativeCurrencyBalance = new Numeric(
    fromAccount.balance,
    16,
    EtherDenomination.WEI,
  )
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
      <div className="request-decrypt-message__balance">
        <div className="request-decrypt-message__balance-text">
          {`${t('balance')}:`}
        </div>
        <div className="request-decrypt-message__balance-value">
          {`${nativeCurrencyBalance} ${nativeCurrency}`}
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

const ScrollToBottomButton = ({
  isScrollable,
  isScrolledToBottom,
  hasDecrypted,
  hasError,
  scrollToBottom,
}) => {
  const t = useI18nContext();

  const isScrollToBottomVisible =
    hasDecrypted && !hasError && isScrollable && !isScrolledToBottom;

  if (!isScrollToBottomVisible) {
    return null;
  }

  return (
    <ButtonIcon
      ariaLabel={t('scrollDown')}
      backgroundColor={BackgroundColor.primaryDefault}
      borderRadius={BorderRadius.full}
      className="scroll-to-bottom__button"
      color={IconColor.primaryInverse}
      data-testid="scroll-to-bottom"
      display={Display.Flex}
      iconName={IconName.Arrow2Down}
      onClick={scrollToBottom}
      size={ButtonIconSize.Md}
    />
  );
};

const MessageBody = forwardRef(
  (
    {
      isScrollable,
      isScrolledToBottom,
      onScroll,
      rawMessage,
      scrollToBottom,
      setRawMessage,
      txData,
    },
    ref,
  ) => {
    const dispatch = useDispatch();
    const trackEvent = useContext(MetaMetricsContext);
    const t = useI18nContext();

    const [copyToClipboardPressed, setCopyToClipboardPressed] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    const [hasDecrypted, setHasDecrypted] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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

    const onDecryptMessage = async (event) => {
      event.stopPropagation(event);

      const params = txData.msgParams;
      params.metamaskId = txData.id;

      const result = await dispatch(decryptMsgInline(params));
      if (result.error) {
        setHasError(true);
        setErrorMessage(t('decryptInlineError', [result.error]));
      } else {
        setHasDecrypted(true);
        setRawMessage(result.rawSig);
      }
    };

    return (
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
            data-testid="message-lock"
            onClick={onDecryptMessage}
          >
            <div className="request-decrypt-message__message-lock__container">
              <i className="fa fa-lock fa-lg request-decrypt-message__message-lock__container__icon" />
              <div className="request-decrypt-message__message-lock__container__text">
                {t('decryptMetamask')}
              </div>
            </div>
          </div>
        </div>
        <ScrollToBottomButton
          isScrollable={isScrollable}
          hasError={hasError}
          hasDecrypted={hasDecrypted}
          isScrolledToBottom={isScrolledToBottom}
          scrollToBottom={scrollToBottom}
        />
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
            data-testid="message-copy"
          >
            <Tooltip
              position="bottom"
              title={hasCopied ? t('copiedExclamation') : t('copyToClipboard')}
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
    );
  },
);
MessageBody.displayName = 'MessageBody';

const Footer = ({
  hasScrolledToBottom,
  isScrollable,
  mostRecentOverviewPage,
  txData,
}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const onCancelClick = async (event) => {
    event.stopPropagation(event);

    await dispatch(cancelDecryptMsg(txData));
    trackEvent({
      category: MetaMetricsEventCategory.Messages,
      event: 'Cancel',
      properties: {
        action: 'Decrypt Message Request',
        legacy_event: true,
      },
    });
    dispatch(clearConfirmTransaction());
    history.push(mostRecentOverviewPage);
  };

  const onSubmitClick = async (event) => {
    event.stopPropagation(event);
    const params = txData.msgParams;
    params.metamaskId = txData.id;

    await dispatch(decryptMsg(params));
    trackEvent({
      category: MetaMetricsEventCategory.Messages,
      event: 'Confirm',
      properties: {
        action: 'Decrypt Message Request',
        legacy_event: true,
      },
    });
    dispatch(clearConfirmTransaction());
    history.push(mostRecentOverviewPage);
  };

  return (
    <PageContainerFooter
      cancelText={t('cancel')}
      submitText={t('decrypt')}
      disabled={isScrollable && !hasScrolledToBottom}
      onCancel={onCancelClick}
      onSubmit={onSubmitClick}
    />
  );
};

const ConfirmDecryptMessage = () => {
  const t = useI18nContext();
  const [rawMessage, setRawMessage] = useState('');
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const nativeCurrency = useSelector(getNativeCurrency);

  const unconfirmedTransactions = useSelector(
    unconfirmedTransactionsListSelector,
  );
  const txData = cloneDeep(unconfirmedTransactions[0]);

  const fromAccount = useSelector((state) =>
    getTargetAccountWithSendEtherInfo(state, txData?.msgParams?.from),
  );

  const subjectMetadata = useSelector(
    (state) => state.metamask.subjectMetadata || {},
  );

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

  if (!txData) {
    log.warn('ConfirmDecryptMessage Page: Missing txData prop.');
    return null;
  }

  const targetSubjectMetadata = subjectMetadata[txData.msgParams.origin];
  const name = targetSubjectMetadata?.name || txData.msgParams.origin;
  const notice = t('decryptMessageNotice', [txData.msgParams.origin]);

  return (
    <div className="request-decrypt-message__container">
      <Header />
      <div className="request-decrypt-message__body">
        <Account fromAccount={fromAccount} nativeCurrency={nativeCurrency} />
        <VisualSection
          name={name}
          notice={notice}
          targetSubjectMetadata={targetSubjectMetadata}
        />
        <MessageBody
          isScrollable={isScrollable}
          isScrolledToBottom={isScrolledToBottom}
          onScroll={onScroll}
          rawMessage={rawMessage}
          ref={ref}
          scrollToBottom={scrollToBottom}
          setRawMessage={setRawMessage}
          txData={txData}
        />
      </div>
      <Footer
        hasScrolledToBottom={hasScrolledToBottom}
        isScrollable={isScrollable}
        mostRecentOverviewPage={mostRecentOverviewPage}
        txData={txData}
      />
    </div>
  );
};

export default ConfirmDecryptMessage;
