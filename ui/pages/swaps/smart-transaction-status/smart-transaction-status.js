import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { I18nContext } from '../../../contexts/i18n';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  getFetchParams,
  prepareToLeaveSwaps,
  getCurrentSmartTransactions,
  getSelectedQuote,
  getTopQuote,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import {
  DEFAULT_ROUTE,
  ASSET_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import Typography from '../../../components/ui/typography';
import Box from '../../../components/ui/box';
import UrlIcon from '../../../components/ui/url-icon';
import {
  BLOCK_SIZES,
  COLORS,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  DISPLAY,
  FONT_WEIGHT,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';
import {
  stopPollingForQuotes,
  cancelSmartTransaction,
} from '../../../store/actions';

import SwapsFooter from '../swaps-footer';
import { calcTokenAmount } from '../../../helpers/utils/token-util';
import SuccessIcon from './success-icon';
import RevertedIcon from './reverted-icon';
import CanceledIcon from './canceled-icon';
import UnknownIcon from './unknown-icon';
import ArrowIcon from './arrow-icon';
import TimerIcon from './timer-icon';
import BackgroundAnimation from './background-animation';

const TOTAL_WAITING_TIME_IN_SEC = 180;

const PENDING_STATUS = {
  OPTIMIZING_GAS: 'optimizingGas',
  PRIVATELY_SUBMITTING: 'privatelySubmitting',
  PUBLICLY_SUBMITTING: 'publiclySubmitting',
};

const showRemainingTimeInMinAndSec = (remainingTimeInSec) => {
  const minutes = Math.floor(remainingTimeInSec / 60);
  const seconds = remainingTimeInSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function SmartTransactionStatus() {
  const [cancelSwapLinkClicked, setCancelSwapLinkClicked] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(
    PENDING_STATUS.OPTIMIZING_GAS,
  );
  const [timeLeftForPendingStxInSec, setTimeLeftForPendingStxInSec] = useState(
    TOTAL_WAITING_TIME_IN_SEC,
  );
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const fetchParams = useSelector(getFetchParams) || {};
  const { destinationTokenInfo = {}, sourceTokenInfo = {} } =
    fetchParams?.metaData || {};
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const needsTwoConfirmations = true;
  const selectedQuote = useSelector(getSelectedQuote);
  const topQuote = useSelector(getTopQuote);
  const usedQuote = selectedQuote || topQuote;
  const currentSmartTransactions = useSelector(getCurrentSmartTransactions);
  let smartTransactionStatus = {};
  let latestSmartTransaction = {};
  let latestSmartTransactionUuid;

  if (currentSmartTransactions && currentSmartTransactions.length > 0) {
    latestSmartTransaction =
      currentSmartTransactions[currentSmartTransactions.length - 1];
    latestSmartTransactionUuid = latestSmartTransaction?.uuid;
    smartTransactionStatus = latestSmartTransaction?.statusMetadata || {};
  }

  const sensitiveProperties = {
    needs_two_confirmations: needsTwoConfirmations,
    token_from: sourceTokenInfo?.symbol,
    token_from_amount: fetchParams?.value,
    token_to: destinationTokenInfo?.symbol,
    request_type: fetchParams?.balanceError ? 'Quote' : 'Order',
    slippage: fetchParams?.slippage,
    custom_slippage: fetchParams?.slippage === 2,
    is_hardware_wallet: hardwareWalletUsed,
    hardware_wallet_type: hardwareWalletType,
    stx_uuid: latestSmartTransactionUuid,
  };

  let destinationValue = '0.16';
  if (usedQuote?.destinationAmount) {
    destinationValue = calcTokenAmount(
      usedQuote?.destinationAmount,
      destinationTokenInfo.decimals,
    ).toPrecision(8);
  }

  const stxStatusPageLoadedEvent = useNewMetricEvent({
    event: 'STX Status Page Loaded',
    sensitiveProperties,
    category: 'swaps',
  });

  const cancelSmartTransactionEvent = useNewMetricEvent({
    event: 'Cancel STX',
    sensitiveProperties,
    category: 'swaps',
  });

  const isSmartTransactionPending =
    !smartTransactionStatus.minedTx ||
    (smartTransactionStatus.minedTx === 'not_mined' &&
      smartTransactionStatus.cancellationReason === 'not_cancelled');
  const showCloseButtonOnly =
    isSmartTransactionPending || smartTransactionStatus.minedTx === 'success';

  useEffect(() => {
    stxStatusPageLoadedEvent();
  }, [stxStatusPageLoadedEvent]);

  useEffect(() => {
    let intervalId;
    if (isSmartTransactionPending) {
      intervalId = setInterval(() => {
        if (timeLeftForPendingStxInSec <= 0) {
          clearInterval(intervalId);
          return;
        }
        if (timeLeftForPendingStxInSec === 150) {
          setPendingStatus(PENDING_STATUS.PRIVATELY_SUBMITTING);
        }
        if (timeLeftForPendingStxInSec === 120) {
          setPendingStatus(PENDING_STATUS.PUBLICLY_SUBMITTING);
        }
        setTimeLeftForPendingStxInSec(timeLeftForPendingStxInSec - 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [dispatch, isSmartTransactionPending, timeLeftForPendingStxInSec]);

  useEffect(() => {
    // We don't need to poll for quotes on the status page.
    dispatch(stopPollingForQuotes());
  }, [dispatch]);

  const onClickTokenTo = async (e) => {
    e?.preventDefault();
    await dispatch(prepareToLeaveSwaps());
    history.push(`${ASSET_ROUTE}/${destinationTokenInfo?.address}`);
  };

  let headerText = t('stxPendingOptimizingGas');
  let description;
  let subDescription;
  let icon;
  if (isSmartTransactionPending) {
    if (pendingStatus === PENDING_STATUS.PRIVATELY_SUBMITTING) {
      headerText = t('stxPendingPrivatelySubmitting');
    } else if (pendingStatus === PENDING_STATUS.PUBLICLY_SUBMITTING) {
      headerText = t('stxPendingFinalizing');
    }
  }
  if (smartTransactionStatus.minedTx === 'success') {
    headerText = t('stxSuccess');
    description = t('stxSuccessDescription', [
      <a
        className="smart-transaction-status__token-to-link"
        key="smart-transaction-status__token-to-link"
        href="#"
        onClick={onClickTokenTo}
      >
        {destinationTokenInfo?.symbol}
      </a>,
    ]);
    icon = <SuccessIcon />;
  } else if (
    (smartTransactionStatus.minedTx === 'cancelled' &&
      smartTransactionStatus.cancellationReason &&
      smartTransactionStatus.cancellationReason !== 'user_cancelled') ||
    (smartTransactionStatus.minedTx === 'not_mined' &&
      smartTransactionStatus.cancellationReason === 'deadline_missed')
  ) {
    headerText = t('stxCancelled');
    description = t('stxCancelledDescription');
    subDescription = t('stxCancelledSubDescription');
    icon = <CanceledIcon />;
  } else if (smartTransactionStatus.minedTx === 'unknown') {
    headerText = t('stxUnknown');
    description = t('stxUnknownDescription');
    icon = <UnknownIcon />;
  } else if (
    smartTransactionStatus.cancellationReason &&
    smartTransactionStatus.cancellationReason === 'user_cancelled'
  ) {
    headerText = t('stxUserCancelled');
    description = t('stxUserCancelledDescription');
    icon = <CanceledIcon />;
  } else if (
    smartTransactionStatus.minedTx &&
    smartTransactionStatus.minedTx === 'reverted'
  ) {
    headerText = t('stxFailure');
    description = t('stxFailureDescription', [
      <a
        className="smart-transaction-status__support-link"
        key="smart-transaction-status-support-link"
        href="https://support.metamask.io"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('customerSupport')}
      </a>,
    ]);
    icon = <RevertedIcon />;
  }

  const showCancelSwapLink =
    latestSmartTransaction.cancellable && !cancelSwapLinkClicked;

  const CancelSwap = () => {
    return (
      <Box marginBottom={0}>
        <a
          className="smart-transaction-status__cancel-swap-link"
          href="#"
          onClick={(e) => {
            e?.preventDefault();
            setCancelSwapLinkClicked(true); // We want to hide it after a user clicks on it.
            cancelSmartTransactionEvent();
            dispatch(cancelSmartTransaction(latestSmartTransactionUuid));
          }}
        >
          {t('cancelSwap')}
        </a>
      </Box>
    );
  };

  return (
    <div className="smart-transaction-status">
      <Box
        paddingLeft={8}
        paddingRight={8}
        height={BLOCK_SIZES.FULL}
        justifyContent={JUSTIFY_CONTENT.START}
        display={DISPLAY.FLEX}
        className="smart-transaction-status__content"
      >
        <Box
          marginTop={10}
          marginBottom={0}
          display={DISPLAY.FLEX}
          justifyContent={JUSTIFY_CONTENT.CENTER}
          alignItems={ALIGN_ITEMS.CENTER}
        >
          <Typography color={COLORS.UI4} variant={TYPOGRAPHY.H6}>
            {`${fetchParams?.value} `}
          </Typography>
          <Typography
            color={COLORS.UI4}
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            boxProps={{ marginLeft: 1, marginRight: 2 }}
          >
            {sourceTokenInfo?.symbol}
          </Typography>
          <UrlIcon
            url={sourceTokenInfo.iconUrl}
            className="main-quote-summary__icon"
            name={sourceTokenInfo.symbol}
            fallbackClassName="main-quote-summary__icon-fallback"
          />
          <Box display={DISPLAY.BLOCK} marginLeft={2} marginRight={2}>
            <ArrowIcon />
          </Box>
          <UrlIcon
            url={destinationTokenInfo.iconUrl}
            className="main-quote-summary__icon"
            name={destinationTokenInfo.symbol}
            fallbackClassName="main-quote-summary__icon-fallback"
          />
          <Typography
            color={COLORS.UI4}
            variant={TYPOGRAPHY.H6}
            boxProps={{ marginLeft: 2 }}
          >
            {`~${destinationValue} `}
          </Typography>
          <Typography
            color={COLORS.UI4}
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            boxProps={{ marginLeft: 1 }}
          >
            {destinationTokenInfo?.symbol}
          </Typography>
        </Box>
        <Box
          marginTop={3}
          className="smart-transaction-status__background-animation"
        >
          <BackgroundAnimation position="top" />
        </Box>
        {icon && (
          <Box marginTop={3} marginBottom={2}>
            {icon}
          </Box>
        )}
        {isSmartTransactionPending && (
          <Box
            marginTop={7}
            marginBottom={1}
            display={DISPLAY.FLEX}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            alignItems={ALIGN_ITEMS.CENTER}
          >
            <TimerIcon />
            <Typography
              color={COLORS.UI4}
              variant={TYPOGRAPHY.H6}
              boxProps={{ marginLeft: 1 }}
            >
              {`${t('swapCompleteIn')} `}
            </Typography>
            <Typography
              color={COLORS.UI4}
              variant={TYPOGRAPHY.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ marginLeft: 1 }}
            >
              {showRemainingTimeInMinAndSec(timeLeftForPendingStxInSec)}
            </Typography>
          </Box>
        )}
        <Typography
          color={COLORS.BLACK}
          variant={TYPOGRAPHY.H4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {headerText}
        </Typography>
        {isSmartTransactionPending && (
          <div className="smart-transaction-status__loading-bar-container">
            <div
              className="smart-transaction-status__loading-bar"
              style={{
                width: `${
                  (100 / TOTAL_WAITING_TIME_IN_SEC) *
                  (TOTAL_WAITING_TIME_IN_SEC - timeLeftForPendingStxInSec)
                }%`,
              }}
            />
          </div>
        )}
        {description && (
          <Typography
            variant={TYPOGRAPHY.H6}
            boxProps={{ marginTop: 0 }}
            color={COLORS.UI4}
          >
            {description}
          </Typography>
        )}
        <Box
          marginTop={3}
          className="smart-transaction-status__background-animation"
        >
          <BackgroundAnimation position="bottom" />
        </Box>
        {subDescription && (
          <Typography
            variant={TYPOGRAPHY.H7}
            boxProps={{ marginTop: 8 }}
            color={COLORS.UI4}
          >
            {subDescription}
          </Typography>
        )}
      </Box>
      {showCancelSwapLink &&
        latestSmartTransactionUuid &&
        isSmartTransactionPending && <CancelSwap />}
      <SwapsFooter
        onSubmit={async () => {
          if (showCloseButtonOnly) {
            await dispatch(prepareToLeaveSwaps());
            history.push(DEFAULT_ROUTE);
          } else {
            history.push(BUILD_QUOTE_ROUTE);
          }
        }}
        onCancel={async () => {
          await dispatch(prepareToLeaveSwaps());
          history.push(DEFAULT_ROUTE);
        }}
        submitText={showCloseButtonOnly ? t('close') : t('tryAgain')}
        hideCancel={showCloseButtonOnly}
        cancelText={t('close')}
        className="smart-transaction-status__swaps-footer"
      />
    </div>
  );
}
