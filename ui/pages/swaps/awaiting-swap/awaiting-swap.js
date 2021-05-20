import EventEmitter from 'events';
import React, { useContext, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { getBlockExplorerLink } from '@metamask/etherscan-link';
import { I18nContext } from '../../../contexts/i18n';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import { MetaMetricsContext } from '../../../contexts/metametrics.new';

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
} from '../../../ducks/swaps/swaps';
import Mascot from '../../../components/ui/mascot';
import Box from '../../../components/ui/box';
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

import { ASSET_ROUTE, DEFAULT_ROUTE } from '../../../helpers/constants/routes';

import { getRenderableNetworkFeesForQuote } from '../swaps.util';
import SwapsFooter from '../swaps-footer';

import SwapFailureIcon from './swap-failure-icon';
import SwapSuccessIcon from './swap-success-icon';
import QuotesTimeoutIcon from './quotes-timeout-icon';
import ViewOnEtherScanLink from './view-on-ether-scan-link';

export default function AwaitingSwap({
  swapComplete,
  errorKey,
  txHash,
  tokensReceived,
  submittingSwap,
  inputValue,
  maxSlippage,
}) {
  const t = useContext(I18nContext);
  const metaMetricsEvent = useContext(MetaMetricsContext);
  const history = useHistory();
  const dispatch = useDispatch();
  const animationEventEmitter = useRef(new EventEmitter());

  const fetchParams = useSelector(getFetchParams);
  const { destinationTokenInfo, sourceTokenInfo } = fetchParams?.metaData || {};
  const usedQuote = useSelector(getUsedQuote);
  const approveTxParams = useSelector(getApproveTxParams);
  const swapsGasPrice = useSelector(getUsedSwapsGasPrice);
  const currentCurrency = useSelector(getCurrentCurrency);
  const usdConversionRate = useSelector(getUSDConversionRate);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const [trackedQuotesExpiredEvent, setTrackedQuotesExpiredEvent] = useState(
    false,
  );

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
  };
  const quotesExpiredEvent = useNewMetricEvent({
    event: 'Quotes Timed Out',
    sensitiveProperties,
    category: 'swaps',
  });
  const makeAnotherSwapEvent = useNewMetricEvent({
    event: 'Make Another Swap',
    sensitiveProperties,
    category: 'swaps',
  });

  const baseNetworkUrl =
    rpcPrefs.blockExplorerUrl ??
    SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ??
    null;
  const blockExplorerUrl = getBlockExplorerLink(
    { hash: txHash, chainId },
    { blockExplorerUrl: baseNetworkUrl },
  );

  const isCustomBlockExplorerUrl =
    SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId] ||
    rpcPrefs.blockExplorerUrl;

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
        href="https://support.metamask.io"
        target="_blank"
        rel="noopener noreferrer"
      >
        support.metamask.io
      </a>,
    ]);
    submitText = t('tryAgain');
    statusImage = <SwapFailureIcon />;
    content = blockExplorerUrl && (
      <ViewOnEtherScanLink
        txHash={txHash}
        blockExplorerUrl={blockExplorerUrl}
        isCustomBlockExplorerUrl={isCustomBlockExplorerUrl}
      />
    );
  } else if (errorKey === QUOTES_EXPIRED_ERROR) {
    headerText = t('swapQuotesExpiredErrorTitle');
    descriptionText = t('swapQuotesExpiredErrorDescription');
    submitText = t('tryAgain');
    statusImage = <QuotesTimeoutIcon />;

    if (!trackedQuotesExpiredEvent) {
      setTrackedQuotesExpiredEvent(true);
      quotesExpiredEvent();
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
      <ViewOnEtherScanLink
        txHash={txHash}
        blockExplorerUrl={blockExplorerUrl}
        isCustomBlockExplorerUrl={isCustomBlockExplorerUrl}
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
      <ViewOnEtherScanLink
        txHash={txHash}
        blockExplorerUrl={blockExplorerUrl}
        isCustomBlockExplorerUrl={isCustomBlockExplorerUrl}
      />
    );
  }

  const MakeAnotherSwap = () => {
    return (
      <Box marginBottom={3}>
        <a
          href="#"
          onClick={() => {
            makeAnotherSwapEvent();
            dispatch(navigateBackToBuildQuote(history));
          }}
        >
          {t('makeAnotherSwap')}
        </a>
      </Box>
    );
  };

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
        <div className="awaiting-swap__main-descrption">{descriptionText}</div>
        {content}
      </div>
      {!errorKey && swapComplete && <MakeAnotherSwap />}
      <SwapsFooter
        onSubmit={async () => {
          if (errorKey === OFFLINE_FOR_MAINTENANCE) {
            await dispatch(prepareToLeaveSwaps());
            history.push(DEFAULT_ROUTE);
          } else if (errorKey === QUOTES_EXPIRED_ERROR) {
            dispatch(prepareForRetryGetQuotes());
            await dispatch(
              fetchQuotesAndSetQuoteState(
                history,
                inputValue,
                maxSlippage,
                metaMetricsEvent,
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
            history.push(`${ASSET_ROUTE}/${destinationTokenInfo?.address}`);
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
  inputValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxSlippage: PropTypes.number,
};
