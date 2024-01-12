import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { isEqual } from 'lodash';
import { I18nContext } from '../../../contexts/i18n';
import {
  getFetchParams,
  prepareToLeaveSwaps,
  getCurrentSmartTransactions,
  getSelectedQuote,
  getTopQuote,
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
  getCurrentSmartTransactionsEnabled,
  getSwapsNetworkConfig,
  cancelSwapsSmartTransaction,
} from '../../../ducks/swaps/swaps';
import {
  isHardwareWallet,
  getHardwareWalletType,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors';
import { SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/swaps';
import {
  DEFAULT_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import { Text } from '../../../components/component-library';
import Box from '../../../components/ui/box';
import UrlIcon from '../../../components/ui/url-icon';
import {
  BLOCK_SIZES,
  TextVariant,
  JustifyContent,
  DISPLAY,
  FontWeight,
  AlignItems,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  stopPollingForQuotes,
  setBackgroundSwapRouteState,
} from '../../../store/actions';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { SmartTransactionStatus } from '../../../../shared/constants/transaction';

import SwapsFooter from '../swaps-footer';
import { showRemainingTimeInMinAndSec } from '../swaps.util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import CreateNewSwap from '../create-new-swap';
import ViewOnBlockExplorer from '../view-on-block-explorer';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import SuccessIcon from './success-icon';
import RevertedIcon from './reverted-icon';
import CanceledIcon from './canceled-icon';
import UnknownIcon from './unknown-icon';
import ArrowIcon from './arrow-icon';
import TimerIcon from './timer-icon';

export default function SmartTransactionStatusPage() {
  const [cancelSwapLinkClicked, setCancelSwapLinkClicked] = useState(false);
  const t = useContext(I18nContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const fetchParams = useSelector(getFetchParams, isEqual) || {};
  const {
    destinationTokenInfo: fetchParamsDestinationTokenInfo = {},
    sourceTokenInfo: fetchParamsSourceTokenInfo = {},
  } = fetchParams?.metaData || {};
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const needsTwoConfirmations = true;
  const selectedQuote = useSelector(getSelectedQuote, isEqual);
  const topQuote = useSelector(getTopQuote, isEqual);
  const usedQuote = selectedQuote || topQuote;
  const currentSmartTransactions = useSelector(
    getCurrentSmartTransactions,
    isEqual,
  );
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatus,
  );
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider, shallowEqual);
  const swapsNetworkConfig = useSelector(getSwapsNetworkConfig, shallowEqual);
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const baseNetworkUrl =
    rpcPrefs.blockExplorerUrl ??
    SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ??
    null;

  let smartTransactionStatus = SmartTransactionStatus.pending;
  let latestSmartTransaction = {};
  let latestSmartTransactionUuid;
  let cancellationFeeWei;

  if (currentSmartTransactions && currentSmartTransactions.length > 0) {
    latestSmartTransaction =
      currentSmartTransactions[currentSmartTransactions.length - 1];
    latestSmartTransactionUuid = latestSmartTransaction?.uuid;
    smartTransactionStatus =
      latestSmartTransaction?.status || SmartTransactionStatus.pending;
    cancellationFeeWei =
      latestSmartTransaction?.statusMetadata?.cancellationFeeWei;
  }

  const [timeLeftForPendingStxInSec, setTimeLeftForPendingStxInSec] = useState(
    swapsNetworkConfig.stxStatusDeadline,
  );

  const sensitiveProperties = {
    needs_two_confirmations: needsTwoConfirmations,
    token_from:
      fetchParamsSourceTokenInfo.symbol ??
      latestSmartTransaction?.sourceTokenSymbol,
    token_from_amount:
      fetchParams?.value ?? latestSmartTransaction?.swapTokenValue,
    token_to:
      fetchParamsDestinationTokenInfo.symbol ??
      latestSmartTransaction?.destinationTokenSymbol,
    request_type: fetchParams?.balanceError ? 'Quote' : 'Order',
    slippage: fetchParams?.slippage,
    custom_slippage: fetchParams?.slippage === 2,
    is_hardware_wallet: hardwareWalletUsed,
    hardware_wallet_type: hardwareWalletType,
    stx_enabled: smartTransactionsEnabled,
    current_stx_enabled: currentSmartTransactionsEnabled,
    stx_user_opt_in: smartTransactionsOptInStatus,
  };

  let destinationValue;
  if (usedQuote?.destinationAmount) {
    destinationValue = calcTokenAmount(
      usedQuote?.destinationAmount,
      fetchParamsDestinationTokenInfo.decimals ??
        latestSmartTransaction?.destinationTokenDecimals,
    ).toPrecision(8);
  }
  const trackEvent = useContext(MetaMetricsContext);

  const isSmartTransactionPending =
    smartTransactionStatus === SmartTransactionStatus.pending;
  const showCloseButtonOnly =
    isSmartTransactionPending ||
    smartTransactionStatus === SmartTransactionStatus.success;
  const txHash = latestSmartTransaction?.statusMetadata?.minedHash;

  useEffect(() => {
    trackEvent({
      event: 'STX Status Page Loaded',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties,
    });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    let intervalId;
    if (isSmartTransactionPending && latestSmartTransactionUuid) {
      const calculateRemainingTime = () => {
        const secondsAfterStxSubmission = Math.round(
          (Date.now() - latestSmartTransaction.time) / 1000,
        );
        if (secondsAfterStxSubmission > swapsNetworkConfig.stxStatusDeadline) {
          setTimeLeftForPendingStxInSec(0);
          clearInterval(intervalId);
          return;
        }
        setTimeLeftForPendingStxInSec(
          swapsNetworkConfig.stxStatusDeadline - secondsAfterStxSubmission,
        );
      };
      intervalId = setInterval(calculateRemainingTime, 1000);
      calculateRemainingTime();
    }

    return () => clearInterval(intervalId);
  }, [
    dispatch,
    isSmartTransactionPending,
    latestSmartTransactionUuid,
    latestSmartTransaction.time,
    swapsNetworkConfig.stxStatusDeadline,
  ]);

  useEffect(() => {
    dispatch(setBackgroundSwapRouteState('smartTransactionStatus'));
    setTimeout(() => {
      // We don't need to poll for quotes on the status page.
      dispatch(stopPollingForQuotes());
    }, 1000); // Stop polling for quotes after 1s.
  }, [dispatch]);

  let headerText = t('stxPendingPrivatelySubmittingSwap');
  let description;
  let subDescription;
  let icon;
  let blockExplorerUrl;
  if (isSmartTransactionPending) {
    if (cancelSwapLinkClicked) {
      headerText = t('stxTryingToCancel');
    } else if (cancellationFeeWei > 0) {
      headerText = t('stxPendingPubliclySubmittingSwap');
    }
  }
  if (smartTransactionStatus === SmartTransactionStatus.success) {
    headerText = t('stxSuccess');
    if (
      fetchParamsDestinationTokenInfo.symbol ||
      latestSmartTransaction?.destinationTokenSymbol
    ) {
      description = t('stxSuccessDescription', [
        fetchParamsDestinationTokenInfo.symbol ??
          latestSmartTransaction?.destinationTokenSymbol,
      ]);
    }
    icon = <SuccessIcon />;
  } else if (
    smartTransactionStatus === 'cancelled_user_cancelled' ||
    latestSmartTransaction?.statusMetadata?.minedTx ===
      SmartTransactionStatus.cancelled
  ) {
    headerText = t('stxUserCancelled');
    description = t('stxUserCancelledDescription');
    icon = <CanceledIcon />;
  } else if (
    smartTransactionStatus.startsWith('cancelled') ||
    smartTransactionStatus.includes('deadline_missed')
  ) {
    headerText = t('stxCancelled');
    description = t('stxCancelledDescription');
    subDescription = t('stxCancelledSubDescription');
    icon = <CanceledIcon />;
  } else if (smartTransactionStatus === 'unknown') {
    headerText = t('stxUnknown');
    description = t('stxUnknownDescription');
    icon = <UnknownIcon />;
  } else if (smartTransactionStatus === 'reverted') {
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
  if (txHash && latestSmartTransactionUuid) {
    blockExplorerUrl = getBlockExplorerLink(
      { hash: txHash, chainId },
      { blockExplorerUrl: baseNetworkUrl },
    );
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
            trackEvent({
              event: 'Cancel STX',
              category: MetaMetricsEventCategory.Swaps,
              sensitiveProperties,
            });
            dispatch(cancelSwapsSmartTransaction(latestSmartTransactionUuid));
          }}
        >
          {t('attemptToCancelSwapForFree')}
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
        justifyContent={JustifyContent.flexStart}
        display={DISPLAY.FLEX}
        className="smart-transaction-status__content"
      >
        <Box
          marginTop={10}
          marginBottom={0}
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            as="h6"
          >
            {`${fetchParams?.value && Number(fetchParams.value).toFixed(5)} `}
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySmBold}
            as="h6"
            marginLeft={1}
            marginRight={2}
          >
            {fetchParamsSourceTokenInfo.symbol ??
              latestSmartTransaction?.sourceTokenSymbol}
          </Text>
          {fetchParamsSourceTokenInfo.iconUrl ? (
            <UrlIcon
              url={fetchParamsSourceTokenInfo.iconUrl}
              className="main-quote-summary__icon"
              name={
                fetchParamsSourceTokenInfo.symbol ??
                latestSmartTransaction?.destinationTokenSymbol
              }
              fallbackClassName="main-quote-summary__icon-fallback"
            />
          ) : null}
          <Box display={DISPLAY.BLOCK} marginLeft={2} marginRight={2}>
            <ArrowIcon />
          </Box>
          {fetchParamsDestinationTokenInfo.iconUrl ? (
            <UrlIcon
              url={fetchParamsDestinationTokenInfo.iconUrl}
              className="main-quote-summary__icon"
              name={
                fetchParamsDestinationTokenInfo.symbol ??
                latestSmartTransaction?.destinationTokenSymbol
              }
              fallbackClassName="main-quote-summary__icon-fallback"
            />
          ) : null}
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            as="h6"
            marginLeft={2}
          >
            {`~${destinationValue && Number(destinationValue).toFixed(5)} `}
          </Text>
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodySmBold}
            as="h6"
            marginLeft={1}
          >
            {fetchParamsDestinationTokenInfo.symbol ??
              latestSmartTransaction?.destinationTokenSymbol}
          </Text>
        </Box>
        <Box
          marginTop={3}
          className="smart-transaction-status__background-animation smart-transaction-status__background-animation--top"
        />
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
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
          >
            <TimerIcon />
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySm}
              as="h6"
              marginLeft={1}
            >
              {`${t('stxSwapCompleteIn')} `}
            </Text>
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySmBold}
              as="h6"
              marginLeft={1}
              className="smart-transaction-status__remaining-time"
            >
              {showRemainingTimeInMinAndSec(timeLeftForPendingStxInSec)}
            </Text>
          </Box>
        )}
        <Text
          color={TextColor.textDefault}
          variant={TextVariant.headingSm}
          as="h4"
          fontWeight={FontWeight.Bold}
        >
          {headerText}
        </Text>
        {isSmartTransactionPending && (
          <div className="smart-transaction-status__loading-bar-container">
            <div
              className="smart-transaction-status__loading-bar"
              style={{
                width: `${
                  (100 / swapsNetworkConfig.stxStatusDeadline) *
                  (swapsNetworkConfig.stxStatusDeadline -
                    timeLeftForPendingStxInSec)
                }%`,
              }}
            />
          </div>
        )}
        {description && (
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            marginTop={blockExplorerUrl && 1}
            color={TextColor.textAlternative}
          >
            {description}
          </Text>
        )}
        {blockExplorerUrl && (
          <ViewOnBlockExplorer
            blockExplorerUrl={blockExplorerUrl}
            sensitiveTrackingProperties={sensitiveProperties}
          />
        )}
        <Box
          marginTop={3}
          className="smart-transaction-status__background-animation smart-transaction-status__background-animation--bottom"
        />
        {subDescription && (
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            marginTop={8}
            color={TextColor.textAlternative}
          >
            {subDescription}
          </Text>
        )}
      </Box>
      {showCancelSwapLink &&
        latestSmartTransactionUuid &&
        isSmartTransactionPending && <CancelSwap />}
      {smartTransactionStatus === SmartTransactionStatus.success ? (
        <CreateNewSwap sensitiveTrackingProperties={sensitiveProperties} />
      ) : null}
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
