import EventEmitter from 'events';
import React, { useContext, useRef, useState, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import isEqual from 'lodash/isEqual';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  EVENT,
  EVENT_NAMES,
  CONTEXT_PROPS,
} from '../../../../shared/constants/metametrics';

import {
  getCurrentChainId,
  getCurrentCurrency,
  getRpcPrefsForCurrentProvider,
  getUSDConversionRate,
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors';

import {
  getUsedQuote,
  getFetchParams,
  getApproveTxParams,
  getUsedSwapsGasPrice,
  fetchQuotesAndSetQuoteState,
  navigateBackToBuildQuote,
  prepareForRetryGetQuotes,
  prepareToLeaveSwaps,
  getSmartTransactionsOptInStatus,
  getSmartTransactionsEnabled,
  getCurrentSmartTransactionsEnabled,
  getFromTokenInputValue,
  getMaxSlippage,
} from '../../../ducks/swaps/swaps';
import Mascot from '../../../components/ui/mascot';
import {
  QUOTES_EXPIRED_ERROR,
  SWAP_FAILED_ERROR,
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  OFFLINE_FOR_MAINTENANCE,
  SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP,
} from '../../../../shared/constants/swaps';
import { isSwapsDefaultTokenSymbol } from '../../../../shared/modules/swaps.utils';
import PulseLoader from '../../../components/ui/pulse-loader';

import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  stopPollingForQuotes,
  setDefaultHomeActiveTabName,
} from '../../../store/actions';

import { getRenderableNetworkFeesForQuote } from '../swaps.util';
import SwapsFooter from '../swaps-footer';

import CreateNewSwap from '../create-new-swap';
import ViewOnBlockExplorer from '../view-on-block-explorer';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
import SwapFailureIcon from './swap-failure-icon';
import SwapSuccessIcon from './swap-success-icon';
import QuotesTimeoutIcon from './quotes-timeout-icon';

export default function AwaitingSwap({
  swapComplete,
  errorKey,
  txHash,
  tokensReceived,
  submittingSwap,
}) {
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const animationEventEmitter = useRef(new EventEmitter());

  const fetchParams = useSelector(getFetchParams, isEqual);
  const { destinationTokenInfo, sourceTokenInfo } = fetchParams?.metaData || {};
  const fromTokenInputValue = useSelector(getFromTokenInputValue);
  const maxSlippage = useSelector(getMaxSlippage);
  const usedQuote = useSelector(getUsedQuote, isEqual);
  const approveTxParams = useSelector(getApproveTxParams, shallowEqual);
  const swapsGasPrice = useSelector(getUsedSwapsGasPrice);
  const currentCurrency = useSelector(getCurrentCurrency);
  const usdConversionRate = useSelector(getUSDConversionRate);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider, shallowEqual);
  const [trackedQuotesExpiredEvent, setTrackedQuotesExpiredEvent] =
    useState(false);

  let feeinUnformattedFiat;

  if (usedQuote && swapsGasPrice) {
    const renderableNetworkFees = getRenderableNetworkFeesForQuote({
      tradeGas: usedQuote.gasEstimateWithRefund || usedQuote.averageGas,
      approveGas: approveTxParams?.gas || '0x0',
      gasPrice: swapsGasPrice,
      currentCurrency,
      conversionRate: usdConversionRate,
      tradeValue: usedQuote?.trade?.value,
      sourceSymbol: sourceTokenInfo?.symbol,
      sourceAmount: usedQuote.sourceAmount,
      chainId,
    });
    feeinUnformattedFiat = renderableNetworkFees.rawNetworkFees;
  }

  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatus,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const sensitiveProperties = {
    token_from: sourceTokenInfo?.symbol,
    token_from_amount: fetchParams?.value,
    token_to: destinationTokenInfo?.symbol,
    request_type: fetchParams?.balanceError ? 'Quote' : 'Order',
    slippage: fetchParams?.slippage,
    custom_slippage: fetchParams?.slippage === 2,
    gas_fees: feeinUnformattedFiat,
    is_hardware_wallet: hardwareWalletUsed,
    hardware_wallet_type: hardwareWalletType,
    stx_enabled: smartTransactionsEnabled,
    current_stx_enabled: currentSmartTransactionsEnabled,
    stx_user_opt_in: smartTransactionsOptInStatus,
  };

  const baseNetworkUrl =
    rpcPrefs.blockExplorerUrl ??
    SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ??
    null;
  const blockExplorerUrl = getBlockExplorerLink(
    { hash: txHash, chainId },
    { blockExplorerUrl: baseNetworkUrl },
  );

  let headerText;
  let statusImage;
  let descriptionText;
  let submitText;
  let content;

  if (errorKey === OFFLINE_FOR_MAINTENANCE) {
    headerText = t('offlineForMaintenance');
    descriptionText = t('metamaskSwapsOfflineDescription');
    submitText = t('close');
    statusImage = <SwapFailureIcon />;
  } else if (errorKey === SWAP_FAILED_ERROR) {
    headerText = t('swapFailedErrorTitle');
    descriptionText = t('swapFailedErrorDescriptionWithSupportLink', [
      <a
        className="awaiting-swap__support-link"
        key="awaiting-swap-support-link"
        href={SUPPORT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          trackEvent(
            {
              category: EVENT.CATEGORIES.SWAPS,
              event: EVENT_NAMES.SUPPORT_LINK_CLICKED,
              properties: {
                url: SUPPORT_LINK,
              },
            },
            {
              contextPropsIntoEventProperties: [CONTEXT_PROPS.PAGE_TITLE],
            },
          );
        }}
      >
        {new URL(SUPPORT_LINK).hostname}
      </a>,
    ]);
    submitText = t('tryAgain');
    statusImage = <SwapFailureIcon />;
    content = blockExplorerUrl && (
      <ViewOnBlockExplorer
        blockExplorerUrl={blockExplorerUrl}
        sensitiveTrackingProperties={sensitiveProperties}
      />
    );
  } else if (errorKey === QUOTES_EXPIRED_ERROR) {
    headerText = t('swapQuotesExpiredErrorTitle');
    descriptionText = t('swapQuotesExpiredErrorDescription');
    submitText = t('tryAgain');
    statusImage = <QuotesTimeoutIcon />;

    if (!trackedQuotesExpiredEvent) {
      setTrackedQuotesExpiredEvent(true);
      trackEvent({
        event: 'Quotes Timed Out',
        category: EVENT.CATEGORIES.SWAPS,
        sensitiveProperties,
      });
    }
  } else if (errorKey === ERROR_FETCHING_QUOTES) {
    headerText = t('swapFetchingQuotesErrorTitle');
    descriptionText = t('swapFetchingQuotesErrorDescription');
    submitText = t('back');
    statusImage = <SwapFailureIcon />;
  } else if (errorKey === QUOTES_NOT_AVAILABLE_ERROR) {
    headerText = t('swapQuotesNotAvailableErrorTitle');
    descriptionText = t('swapQuotesNotAvailableErrorDescription');
    submitText = t('tryAgain');
    statusImage = <SwapFailureIcon />;
  } else if (errorKey === CONTRACT_DATA_DISABLED_ERROR) {
    headerText = t('swapContractDataDisabledErrorTitle');
    descriptionText = t('swapContractDataDisabledErrorDescription');
    submitText = t('tryAgain');
    statusImage = <SwapFailureIcon />;
  } else if (!errorKey && !swapComplete) {
    headerText = t('swapProcessing');
    statusImage = <PulseLoader />;
    submitText = t('swapsViewInActivity');
    descriptionText = t('swapOnceTransactionHasProcess', [
      <span
        key="swapOnceTransactionHasProcess-1"
        className="awaiting-swap__amount-and-symbol"
      >
        {destinationTokenInfo.symbol}
      </span>,
    ]);
    content = blockExplorerUrl && (
      <ViewOnBlockExplorer
        blockExplorerUrl={blockExplorerUrl}
        sensitiveTrackingProperties={sensitiveProperties}
      />
    );
  } else if (!errorKey && swapComplete) {
    headerText = t('swapTransactionComplete');
    statusImage = <SwapSuccessIcon />;
    submitText = t('close');
    descriptionText = t('swapTokenAvailable', [
      <span
        key="swapTokenAvailable-2"
        className="awaiting-swap__amount-and-symbol"
      >
        {`${tokensReceived || ''} ${destinationTokenInfo.symbol}`}
      </span>,
    ]);
    content = blockExplorerUrl && (
      <ViewOnBlockExplorer
        blockExplorerUrl={blockExplorerUrl}
        sensitiveTrackingProperties={sensitiveProperties}
      />
    );
  }

  useEffect(() => {
    if (errorKey) {
      // If there was an error, stop polling for quotes.
      dispatch(stopPollingForQuotes());
    }
  }, [dispatch, errorKey]);

  return (
    <div className="awaiting-swap">
      <div className="awaiting-swap__content">
        {!(swapComplete || errorKey) && (
          <Mascot
            animationEventEmitter={animationEventEmitter.current}
            width="90"
            height="90"
          />
        )}
        <div className="awaiting-swap__status-image">{statusImage}</div>
        <div className="awaiting-swap__header">{headerText}</div>
        <div className="awaiting-swap__main-description">{descriptionText}</div>
        {content}
      </div>
      {!errorKey && swapComplete ? (
        <CreateNewSwap sensitiveTrackingProperties={sensitiveProperties} />
      ) : null}
      <SwapsFooter
        onSubmit={async () => {
          /* istanbul ignore next */
          if (errorKey === OFFLINE_FOR_MAINTENANCE) {
            await dispatch(prepareToLeaveSwaps());
            history.push(DEFAULT_ROUTE);
          } else if (errorKey === QUOTES_EXPIRED_ERROR) {
            dispatch(prepareForRetryGetQuotes());
            await dispatch(
              fetchQuotesAndSetQuoteState(
                history,
                fromTokenInputValue,
                maxSlippage,
                trackEvent,
              ),
            );
          } else if (errorKey) {
            await dispatch(navigateBackToBuildQuote(history));
          } else if (
            isSwapsDefaultTokenSymbol(destinationTokenInfo?.symbol, chainId) ||
            swapComplete
          ) {
            history.push(DEFAULT_ROUTE);
          } else {
            await dispatch(setDefaultHomeActiveTabName('Activity'));
            history.push(DEFAULT_ROUTE);
          }
        }}
        onCancel={async () => await dispatch(navigateBackToBuildQuote(history))}
        submitText={submitText}
        disabled={submittingSwap}
        hideCancel={errorKey !== QUOTES_EXPIRED_ERROR}
      />
    </div>
  );
}

AwaitingSwap.propTypes = {
  swapComplete: PropTypes.bool,
  txHash: PropTypes.string,
  tokensReceived: PropTypes.string,
  errorKey: PropTypes.oneOf([
    QUOTES_EXPIRED_ERROR,
    SWAP_FAILED_ERROR,
    ERROR_FETCHING_QUOTES,
    QUOTES_NOT_AVAILABLE_ERROR,
    OFFLINE_FOR_MAINTENANCE,
    CONTRACT_DATA_DISABLED_ERROR,
  ]),
  submittingSwap: PropTypes.bool,
};
