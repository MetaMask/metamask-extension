import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Tooltip } from 'react-tippy';
import { I18nContext } from '../../../../contexts/i18n';
import {
  ButtonIcon,
  ButtonIconSize,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  IconName,
  Box,
} from '../../../component-library';
import { Content, Footer, Header, Page } from '../page';
import {
  SEND_STAGES,
  getCurrentDraftTransaction,
  getDraftTransactionExists,
  getDraftTransactionID,
  getRecipient,
  getRecipientWarningAcknowledgement,
  getSendAnalyticProperties,
  getSendErrors,
  getSendStage,
  isSendFormInvalid,
  resetSendState,
  signTransaction,
  startNewDraftTransaction,
  updateSendAmount,
  updateSendAsset,
} from '../../../../ducks/send';
import {
  TokenStandard,
  AssetType,
  SmartTransactionStatus,
} from '../../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { INSUFFICIENT_FUNDS_ERROR } from '../../../../pages/confirmations/send/send.constants';
import { cancelTx, showQrScanner } from '../../../../store/actions';
import {
  DEFAULT_ROUTE,
  SEND_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { getMostRecentOverviewPage } from '../../../../ducks/history/history';
import { AssetPickerAmount } from '../..';
import useUpdateSwapsState from '../../../../pages/swaps/hooks/useUpdateSwapsState';
import { getIsDraftSwapAndSend } from '../../../../ducks/send/helpers';
import { smartTransactionsListSelector } from '../../../../selectors';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { TRANSACTION_ERRORED_EVENT } from '../../../app/transaction-activity-log/transaction-activity-log.constants';
import {
  SendPageAccountPicker,
  SendPageRecipientContent,
  SendPageRecipient,
  SendPageRecipientInput,
} from './components';

export const SendPage = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();

  const startedNewDraftTransaction = useRef(false);
  const draftTransactionExists = useSelector(getDraftTransactionExists);

  const draftTransaction = useSelector(getCurrentDraftTransaction);

  const {
    sendAsset: transactionAsset,
    amount,
    swapQuotesError,
  } = draftTransaction;

  const draftTransactionID = useSelector(getDraftTransactionID);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const sendStage = useSelector(getSendStage);
  const isSwapAndSend = getIsDraftSwapAndSend(draftTransaction);

  const history = useHistory();
  const location = useLocation();
  const trackEvent = useContext(MetaMetricsContext);
  const sendAnalytics = useSelector(getSendAnalyticProperties);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(undefined);

  const handleSelectToken = useCallback(
    (token, isReceived) => {
      const tokenType = token.type.toUpperCase();
      switch (tokenType) {
        case TokenStandard.ERC20:
        case 'TOKEN':
          token.type = AssetType.token;
          token.standard = TokenStandard.ERC20;
          break;
        case TokenStandard.ERC721:
          token.type = AssetType.NFT;
          token.standard = TokenStandard.ERC721;
          token.isERC721 = true;
          break;
        case TokenStandard.ERC1155:
          token.type = AssetType.NFT;
          token.standard = TokenStandard.ERC1155;
          break;
        default:
          if (tokenType === 'NATIVE') {
            break;
          }
          token.type = AssetType.unknown;
          token.standard = TokenStandard.none;
          break;
      }

      token.image = token.image ?? token.iconUrl;

      if (token.type === AssetType.native) {
        dispatch(
          updateSendAsset({
            type: token.type,
            details: token,
            skipComputeEstimatedGasLimit: false,
            isReceived,
          }),
        );
      } else {
        dispatch(
          updateSendAsset({
            type: token.type ?? AssetType.token,
            details: {
              ...token,
              standard: token.standard ?? TokenStandard.ERC20,
            },
            skipComputeEstimatedGasLimit: false,
            isReceived,
          }),
        );
      }

      trackEvent(
        {
          event: MetaMetricsEventName.sendAssetSelected,
          category: MetaMetricsEventCategory.Send,
          properties: {
            is_destination_asset_picker_modal: Boolean(isReceived),
            is_nft: false,
          },
          sensitiveProperties: {
            ...sendAnalytics,
            new_asset_symbol: token.symbol,
            new_asset_address: token.address,
          },
        },
        { excludeMetaMetricsId: false },
      );
      history.push(SEND_ROUTE);
    },
    [dispatch, history, sendAnalytics, trackEvent],
  );

  const handleAssetPickerClick = useCallback(
    (isDest) => {
      trackEvent(
        {
          event: MetaMetricsEventName.sendTokenModalOpened,
          category: MetaMetricsEventCategory.Send,
          properties: {
            is_destination_asset_picker_modal: Boolean(isDest),
          },
          sensitiveProperties: {
            ...sendAnalytics,
          },
        },
        { excludeMetaMetricsId: false },
      );
    },
    [sendAnalytics, trackEvent],
  );

  const cleanup = useCallback(() => {
    dispatch(resetSendState());
    setIsSubmitting(false);
    setError(undefined);
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

    trackEvent(
      {
        event: MetaMetricsEventName.sendFlowExited,
        category: MetaMetricsEventCategory.Send,
        sensitiveProperties: {
          ...sendAnalytics,
        },
      },
      { excludeMetaMetricsId: false },
    );

    const nextRoute =
      sendStage === SEND_STAGES.EDIT ? DEFAULT_ROUTE : mostRecentOverviewPage;
    history.push(nextRoute);
  };

  useEffect(() => {
    if (swapQuotesError) {
      trackEvent(
        {
          event: MetaMetricsEventName.sendSwapQuoteError,
          category: MetaMetricsEventCategory.Send,
          sensitiveProperties: {
            ...sendAnalytics,
          },
        },
        { excludeMetaMetricsId: false },
      );
    }
    // sendAnalytics should not result in the event refiring
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackEvent, swapQuotesError]);

  const onSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError(undefined);

    try {
      await dispatch(signTransaction(history));

      trackEvent({
        category: MetaMetricsEventCategory.Transactions,
        event: 'Complete',
        properties: {
          ...sendAnalytics,
          action: isSwapAndSend ? 'Submit Immediately' : 'Edit Screen',
          legacy_event: true,
        },
      });
    } catch {
      setError(TRANSACTION_ERRORED_EVENT);
    } finally {
      // prevents state update on unmounted component error
      if (isSubmitting) {
        setIsSubmitting(false);
      }
    }
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

  const smartTransactions = useSelector(smartTransactionsListSelector);

  const isSmartTransactionPending = smartTransactions?.find(
    ({ status }) => status === SmartTransactionStatus.pending,
  );

  const isGasTooLow =
    sendErrors.gasFee === INSUFFICIENT_FUNDS_ERROR &&
    sendErrors.amount !== INSUFFICIENT_FUNDS_ERROR;

  const submitDisabled =
    (isInvalidSendForm && !isGasTooLow) ||
    requireContractAddressAcknowledgement ||
    (isSwapAndSend && isSmartTransactionPending);

  const isSendFormShown =
    draftTransactionExists &&
    [SEND_STAGES.EDIT, SEND_STAGES.DRAFT].includes(sendStage);

  const handleSelectSendToken = useCallback(
    (newToken) => handleSelectToken(newToken, false),
    [handleSelectToken],
  );

  useUpdateSwapsState();

  const onAmountChange = useCallback(
    (newAmountRaw, newAmountFormatted) => {
      dispatch(updateSendAmount(newAmountRaw, newAmountFormatted));
      setError(undefined);
    },
    [dispatch],
  );

  let tooltipTitle = '';

  if (isSwapAndSend) {
    tooltipTitle = isSmartTransactionPending
      ? t('isSigningOrSubmitting')
      : t('sendSwapSubmissionWarning');
  }

  return (
    <Page className="multichain-send-page">
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={onCancel}
          />
        }
      >
        {t('send')}
      </Header>
      <Content>
        <SendPageAccountPicker />
        {isSendFormShown && (
          <AssetPickerAmount
            error={error}
            header={t('sendSelectSendAsset')}
            asset={transactionAsset}
            amount={amount}
            onAssetChange={handleSelectSendToken}
            onAmountChange={onAmountChange}
            onClick={() => handleAssetPickerClick(false)}
          />
        )}
        <Box marginTop={6}>
          <SendPageRecipientInput />
          {isSendFormShown ? (
            <SendPageRecipientContent
              requireContractAddressAcknowledgement={
                requireContractAddressAcknowledgement
              }
              onAssetChange={handleSelectToken}
              onClick={() => handleAssetPickerClick(true)}
            />
          ) : (
            <SendPageRecipient />
          )}
        </Box>
      </Content>
      <Footer>
        <ButtonSecondary
          className="multichain-send-page__nav-button"
          onClick={onCancel}
          size={ButtonSecondarySize.Lg}
          block
        >
          {sendStage === SEND_STAGES.EDIT ? t('reject') : t('cancel')}
        </ButtonSecondary>
        <Tooltip
          // changing key forces remount on title change
          key={tooltipTitle}
          className="multichain-send-page__nav-button"
          title={tooltipTitle}
          disabled={!isSwapAndSend}
          arrow
          hideOnClick={false}
          // explicitly inherit display since Tooltip will default to block
          style={{
            display: 'inline-flex',
          }}
        >
          <ButtonPrimary
            onClick={onSubmit}
            loading={isSubmitting}
            size={ButtonPrimarySize.Lg}
            disabled={submitDisabled || isSubmitting}
            block
          >
            {t(isSwapAndSend ? 'confirm' : 'continue')}
          </ButtonPrimary>
        </Tooltip>
      </Footer>
    </Page>
  );
};
