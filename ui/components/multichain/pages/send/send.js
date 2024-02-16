import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { I18nContext } from '../../../../contexts/i18n';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
} from '../../../component-library';
import { Content, Footer, Header, Page } from '../page';
import {
  SEND_STAGES,
  getDraftTransactionExists,
  getDraftTransactionID,
  getRecipient,
  getRecipientWarningAcknowledgement,
  getSendErrors,
  getSendStage,
  isSendFormInvalid,
  resetSendState,
  signTransaction,
  startNewDraftTransaction,
} from '../../../../ducks/send';
import { AssetType } from '../../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { INSUFFICIENT_FUNDS_ERROR } from '../../../../pages/confirmations/send/send.constants';
import { cancelTx, showQrScanner } from '../../../../store/actions';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../../helpers/constants/routes';
import { MetaMetricsEventCategory } from '../../../../../shared/constants/metametrics';
import { getMostRecentOverviewPage } from '../../../../ducks/history/history';
import {
  SendPageAccountPicker,
  SendPageContent,
  SendPageNetworkPicker,
  SendPageRecipient,
  SendPageRecipientInput,
} from './components';

export const SendPage = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const startedNewDraftTransaction = useRef(false);
  const draftTransactionExists = useSelector(getDraftTransactionExists);
  const draftTransactionID = useSelector(getDraftTransactionID);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const sendStage = useSelector(getSendStage);

  const history = useHistory();
  const location = useLocation();
  const trackEvent = useContext(MetaMetricsContext);

  const cleanup = useCallback(() => {
    dispatch(resetSendState());
  }, [dispatch]);

  /**
   * It is possible to route to this page directly, either by typing in the url
   * or by clicking the browser back button after progressing to the confirm
   * screen. In the case where a draft transaction does not yet exist, this
   * hook is responsible for creating it. We will assume that this is a native
   * asset send.
   */
  useEffect(() => {
    if (
      draftTransactionExists === false &&
      startedNewDraftTransaction.current === false
    ) {
      startedNewDraftTransaction.current = true;
      dispatch(startNewDraftTransaction({ type: AssetType.native }));
    }
  }, [draftTransactionExists, dispatch]);

  useEffect(() => {
    window.addEventListener('beforeunload', cleanup);
  }, [cleanup]);

  useEffect(() => {
    if (location.search === '?scan=true') {
      dispatch(showQrScanner());

      // Clear the queryString param after showing the modal
      const [cleanUrl] = window.location.href.split('?');
      window.history.pushState({}, null, `${cleanUrl}`);
      window.location.hash = '#send';
    }
  }, [location, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(resetSendState());
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [dispatch, cleanup]);

  const onCancel = () => {
    if (draftTransactionID) {
      dispatch(cancelTx({ id: draftTransactionID }));
    }
    dispatch(resetSendState());

    const nextRoute =
      sendStage === SEND_STAGES.EDIT ? DEFAULT_ROUTE : mostRecentOverviewPage;
    history.push(nextRoute);
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    await dispatch(signTransaction());

    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: 'Complete',
      properties: {
        action: 'Edit Screen',
        legacy_event: true,
      },
    });
    history.push(CONFIRM_TRANSACTION_ROUTE);
  };

  // Submit button
  const recipient = useSelector(getRecipient);
  const showKnownRecipientWarning =
    recipient.warning === 'knownAddressRecipient';
  const recipientWarningAcknowledged = useSelector(
    getRecipientWarningAcknowledgement,
  );
  const requireContractAddressAcknowledgement =
    showKnownRecipientWarning && !recipientWarningAcknowledged;

  const sendErrors = useSelector(getSendErrors);
  const isInvalidSendForm = useSelector(isSendFormInvalid);
  const submitDisabled =
    (isInvalidSendForm && sendErrors.gasFee !== INSUFFICIENT_FUNDS_ERROR) ||
    requireContractAddressAcknowledgement;

  return (
    <Page className="multichain-send-page">
      <Header
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={onCancel}
          />
        }
      >
        {t('sendAToken')}
      </Header>
      <Content>
        <SendPageNetworkPicker />
        <SendPageAccountPicker />
        <SendPageRecipientInput />
        {draftTransactionExists &&
        [SEND_STAGES.EDIT, SEND_STAGES.DRAFT].includes(sendStage) ? (
          <SendPageContent
            requireContractAddressAcknowledgement={
              requireContractAddressAcknowledgement
            }
          />
        ) : (
          <SendPageRecipient />
        )}
      </Content>
      <Footer>
        <ButtonSecondary onClick={onCancel} size={ButtonSecondarySize.Lg} block>
          {sendStage === SEND_STAGES.EDIT ? t('reject') : t('cancel')}
        </ButtonSecondary>
        <ButtonPrimary
          onClick={onSubmit}
          size={ButtonPrimarySize.Lg}
          disabled={submitDisabled}
          block
        >
          {t('continue')}
        </ButtonPrimary>
      </Footer>
    </Page>
  );
};
