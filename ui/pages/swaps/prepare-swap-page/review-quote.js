import React, {
  useState,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import { isEqual } from 'lodash';
import classnames from 'classnames';
import { captureException } from '@sentry/browser';
import PropTypes from 'prop-types';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { I18nContext } from '../../../contexts/i18n';
import SelectQuotePopover from '../select-quote-popover';
import { useEthFiatAmount } from '../../../hooks/useEthFiatAmount';
import { useEqualityCheck } from '../../../hooks/useEqualityCheck';
import { usePrevious } from '../../../hooks/usePrevious';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getQuotes,
  getApproveTxParams,
  getFetchParams,
  setBalanceError,
  getQuotesLastFetched,
  getBalanceError,
  getCustomSwapsGas, // Gas limit.
  getDestinationTokenInfo,
  getUsedSwapsGasPrice,
  getTopQuote,
  getUsedQuote,
  signAndSendTransactions,
  getBackgroundSwapRouteState,
  swapsQuoteSelected,
  getReviewSwapClickedTimestamp,
  signAndSendSwapsSmartTransaction,
  getSwapsNetworkConfig,
  getSmartTransactionsError,
  getCurrentSmartTransactionsError,
  getSwapsSTXLoading,
  fetchSwapsSmartTransactionFees,
  getSmartTransactionFees,
  getCurrentSmartTransactionsEnabled,
} from '../../../ducks/swaps/swaps';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import {
  conversionRateSelector,
  getSelectedAccount,
  getCurrentCurrency,
  getTokenExchangeRates,
  getSwapsDefaultToken,
  isHardwareWallet,
  getHardwareWalletType,
  checkNetworkAndAccountSupports1559,
  getUSDConversionRate,
} from '../../../selectors';
import {
  getSmartTransactionsOptInStatusForMetrics,
  getSmartTransactionsEnabled,
  getSmartTransactionsPreferenceEnabled,
} from '../../../../shared/modules/selectors';
import { getNativeCurrency, getTokens } from '../../../ducks/metamask/metamask';
import {
  setCustomApproveTxData,
  showModal,
  setSwapsQuotesPollingLimitEnabled,
  getLayer1GasFee,
} from '../../../store/actions';
import {
  ASSET_ROUTE,
  DEFAULT_ROUTE,
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import {
  decimalToHex,
  decWEIToDecETH,
  sumHexes,
  hexToDecimal,
} from '../../../../shared/modules/conversion.utils';
import { getCustomTxParamsData } from '../../confirmations/confirm-approve/confirm-approve.util';
import {
  quotesToRenderableData,
  getRenderableNetworkFeesForQuote,
  getFeeForSmartTransaction,
  formatSwapsValueForDisplay,
  getSwap1559GasFeeEstimates,
} from '../swaps.util';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import {
  SLIPPAGE_HIGH_ERROR,
  SLIPPAGE_LOW_ERROR,
  MAX_ALLOWED_SLIPPAGE,
} from '../../../../shared/constants/swaps';
import { GasRecommendations } from '../../../../shared/constants/gas';
import CountdownTimer from '../countdown-timer';
import SwapsFooter from '../swaps-footer';
import Box from '../../../components/ui/box';
import {
  TextColor,
  JustifyContent,
  DISPLAY,
  AlignItems,
  TextVariant,
  FRACTIONS,
  TEXT_ALIGN,
  Size,
  FlexDirection,
  Severity,
  FontStyle,
} from '../../../helpers/constants/design-system';
import {
  BannerAlert,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../components/component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventErrorType,
} from '../../../../shared/constants/metametrics';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { parseStandardTokenTransactionData } from '../../../../shared/modules/transaction.utils';
import { getTokenValueParam } from '../../../../shared/lib/metamask-controller-utils';
import {
  calcGasTotal,
  calcTokenAmount,
  toPrecisionWithoutTrailingZeros,
} from '../../../../shared/lib/transactions-controller-utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix } from '../../../../app/scripts/lib/util';
import {
  calcTokenValue,
  calculateMaxGasLimit,
} from '../../../../shared/lib/swaps-utils';
import ExchangeRateDisplay from '../exchange-rate-display';
import InfoTooltip from '../../../components/ui/info-tooltip';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { getTokenFiatAmount } from '../../../helpers/utils/token-util';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import ViewQuotePriceDifference from './view-quote-price-difference';
import SlippageNotificationModal from './slippage-notification-modal';

let intervalId;

const ViewAllQuotesLink = React.memo(function ViewAllQuotesLink({
  trackAllAvailableQuotesOpened,
  setSelectQuotePopoverShown,
  t,
}) {
  const handleClick = useCallback(() => {
    trackAllAvailableQuotesOpened();
    setSelectQuotePopoverShown(true);
  }, [trackAllAvailableQuotesOpened, setSelectQuotePopoverShown]);

  return (
    <ButtonLink
      key="view-all-quotes"
      data-testid="review-quote-view-all-quotes"
      onClick={handleClick}
      size={Size.inherit}
    >
      {t('viewAllQuotes')}
    </ButtonLink>
  );
});

ViewAllQuotesLink.propTypes = {
  trackAllAvailableQuotesOpened: PropTypes.func.isRequired,
  setSelectQuotePopoverShown: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default function ReviewQuote({ setReceiveToAmount }) {
  const history = useHistory();
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const trackEvent = useContext(MetaMetricsContext);

  const [submitClicked, setSubmitClicked] = useState(false);
  const [selectQuotePopoverShown, setSelectQuotePopoverShown] = useState(false);
  const [warningHidden] = useState(false); // TODO: Check when to use setWarningHidden
  const [originalApproveAmount, setOriginalApproveAmount] = useState(null);
  const [multiLayerL1FeeTotal, setMultiLayerL1FeeTotal] = useState(null);
  const [multiLayerL1ApprovalFeeTotal, setMultiLayerL1ApprovalFeeTotal] =
    useState(null);
  // We need to have currentTimestamp in state, otherwise it would change with each rerender.
  const [currentTimestamp] = useState(Date.now());
  const { openBuyCryptoInPdapp } = useRamps();

  const [acknowledgedPriceDifference, setAcknowledgedPriceDifference] =
    useState(false);
  const [slippageNotificationModalOpened, setSlippageNotificationModalOpened] =
    useState(false);
  const priceDifferenceRiskyBuckets = [
    GasRecommendations.high,
    GasRecommendations.medium,
  ];

  const routeState = useSelector(getBackgroundSwapRouteState);
  const quotes = useSelector(getQuotes, isEqual);
  useEffect(() => {
    if (!Object.values(quotes).length) {
      history.push(PREPARE_SWAP_ROUTE);
    } else if (routeState === 'awaiting') {
      history.push(AWAITING_SWAP_ROUTE);
    }
  }, [history, quotes, routeState]);

  const quotesLastFetched = useSelector(getQuotesLastFetched);
  const prevQuotesLastFetched = usePrevious(quotesLastFetched);

  // Select necessary data
  const gasPrice = useSelector(getUsedSwapsGasPrice);
  const customMaxGas = useSelector(getCustomSwapsGas);
  const tokenConversionRates = useSelector(getTokenExchangeRates, isEqual);
  const memoizedTokenConversionRates = useEqualityCheck(tokenConversionRates);
  const { balance: ethBalance } = useSelector(getSelectedAccount, shallowEqual);
  const conversionRate = useSelector(conversionRateSelector);
  const USDConversionRate = useSelector(getUSDConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);
  const swapsTokens = useSelector(getTokens, isEqual);
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const balanceError = useSelector(getBalanceError);
  const fetchParams = useSelector(getFetchParams, isEqual);
  const approveTxParams = useSelector(getApproveTxParams, isEqual);
  const topQuote = useSelector(getTopQuote, isEqual);
  const usedQuote = useSelector(getUsedQuote, isEqual);
  const tradeValue = usedQuote?.trade?.value ?? '0x0';
  const defaultSwapsToken = useSelector(getSwapsDefaultToken, isEqual);
  const chainId = useSelector(getCurrentChainId);
  const nativeCurrencySymbol = useSelector(getNativeCurrency);
  const reviewSwapClickedTimestamp = useSelector(getReviewSwapClickedTimestamp);
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsOptInStatusForMetrics,
  );
  const smartTransactionsPreferenceEnabled = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );
  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const swapsSTXLoading = useSelector(getSwapsSTXLoading);
  const currentSmartTransactionsError = useSelector(
    getCurrentSmartTransactionsError,
  );
  const smartTransactionsError = useSelector(getSmartTransactionsError);
  const currentSmartTransactionsEnabled = useSelector(
    getCurrentSmartTransactionsEnabled,
  );
  const smartTransactionFees = useSelector(getSmartTransactionFees, isEqual);
  const swapsNetworkConfig = useSelector(getSwapsNetworkConfig, shallowEqual);
  const { gasFeeEstimates: networkGasFeeEstimates } = useGasFeeEstimates();
  const { estimatedBaseFee = '0' } = networkGasFeeEstimates ?? {};

  const gasFeeEstimates = useAsyncResult(async () => {
    if (!networkAndAccountSupports1559) {
      return undefined;
    }

    return await getSwap1559GasFeeEstimates(
      usedQuote.trade,
      approveTxParams,
      estimatedBaseFee,
      chainId,
    );
  }, [
    usedQuote.trade,
    approveTxParams,
    estimatedBaseFee,
    chainId,
    networkAndAccountSupports1559,
  ]);

  const gasFeeEstimatesTrade = gasFeeEstimates.value?.tradeGasFeeEstimates;
  const gasFeeEstimatesApprove = gasFeeEstimates.value?.approveGasFeeEstimates;

  const unsignedTransaction = usedQuote.trade;
  const { isGasIncludedTrade } = usedQuote;
  const isSmartTransaction =
    useSelector(getSmartTransactionsPreferenceEnabled) &&
    currentSmartTransactionsEnabled;

  const [slippageErrorKey] = useState(() => {
    const slippage = Number(fetchParams?.slippage);
    if (slippage > 0 && slippage <= 1) {
      return SLIPPAGE_LOW_ERROR;
    } else if (slippage >= 5 && slippage <= MAX_ALLOWED_SLIPPAGE) {
      return SLIPPAGE_HIGH_ERROR;
    }
    return '';
  });

  const fetchParamsSourceToken = fetchParams?.sourceToken;

  const additionalTrackingParams = {
    reg_tx_fee_in_usd: undefined,
    reg_tx_fee_in_eth: undefined,
    reg_tx_max_fee_in_usd: undefined,
    reg_tx_max_fee_in_eth: undefined,
    stx_fee_in_usd: undefined,
    stx_fee_in_eth: undefined,
    stx_max_fee_in_usd: undefined,
    stx_max_fee_in_eth: undefined,
  };

  const usedGasLimit =
    usedQuote?.gasEstimateWithRefund ||
    `0x${decimalToHex(usedQuote?.averageGas || 0)}`;

  const maxGasLimit = calculateMaxGasLimit(
    usedQuote?.gasEstimate,
    usedQuote?.gasMultiplier,
    usedQuote?.maxGas,
    customMaxGas,
  );

  let gasTotalInWeiHex = calcGasTotal(
    maxGasLimit,
    gasFeeEstimatesTrade?.maxFeePerGas || gasPrice,
  );

  if (multiLayerL1FeeTotal !== null) {
    gasTotalInWeiHex = sumHexes(
      gasTotalInWeiHex || '0x0',
      multiLayerL1FeeTotal || '0x0',
    );
  }

  const { tokensWithBalances } = useTokenTracker({
    tokens: swapsTokens,
    includeFailedTokens: true,
  });
  const balanceToken =
    fetchParamsSourceToken === defaultSwapsToken.address
      ? defaultSwapsToken
      : tokensWithBalances.find(({ address }) =>
          isEqualCaseInsensitive(address, fetchParamsSourceToken),
        );

  const selectedFromToken = balanceToken || usedQuote.sourceTokenInfo;
  const tokenBalance =
    tokensWithBalances?.length &&
    calcTokenAmount(
      selectedFromToken.balance || '0x0',
      selectedFromToken.decimals,
    ).toFixed(9);
  const tokenBalanceUnavailable =
    tokensWithBalances && balanceToken === undefined;

  const approveData = parseStandardTokenTransactionData(approveTxParams?.data);
  const approveValue = approveData && getTokenValueParam(approveData);
  const approveAmount =
    approveValue &&
    selectedFromToken?.decimals !== undefined &&
    calcTokenAmount(approveValue, selectedFromToken.decimals).toFixed(9);
  const approveGas = approveTxParams?.gas;

  const gasPriceTrade = networkAndAccountSupports1559
    ? gasFeeEstimatesTrade?.baseAndPriorityFeePerGas
    : gasPrice;

  const gasPriceApprove = networkAndAccountSupports1559
    ? gasFeeEstimatesApprove?.baseAndPriorityFeePerGas
    : gasPrice;

  const renderablePopoverData = useMemo(() => {
    return quotesToRenderableData({
      quotes,
      gasPriceTrade,
      gasPriceApprove,
      conversionRate,
      currentCurrency,
      approveGas,
      tokenConversionRates: memoizedTokenConversionRates,
      chainId,
      smartTransactionEstimatedGas:
        smartTransactionsEnabled &&
        smartTransactionsPreferenceEnabled &&
        smartTransactionFees?.tradeTxFees,
      nativeCurrencySymbol,
      multiLayerL1ApprovalFeeTotal,
    });
  }, [
    quotes,
    gasPriceTrade,
    gasPriceApprove,
    conversionRate,
    currentCurrency,
    approveGas,
    memoizedTokenConversionRates,
    chainId,
    smartTransactionFees?.tradeTxFees,
    nativeCurrencySymbol,
    smartTransactionsEnabled,
    smartTransactionsPreferenceEnabled,
    multiLayerL1ApprovalFeeTotal,
  ]);

  const renderableDataForUsedQuote = renderablePopoverData.find(
    (renderablePopoverDatum) =>
      renderablePopoverDatum.aggId === usedQuote.aggregator,
  );

  const {
    destinationTokenDecimals,
    destinationTokenSymbol,
    destinationTokenValue,
    sourceTokenDecimals,
    sourceTokenSymbol,
    sourceTokenValue,
  } = renderableDataForUsedQuote;

  let { feeInFiat, feeInEth, rawEthFee, feeInUsd } =
    getRenderableNetworkFeesForQuote({
      tradeGas: usedGasLimit,
      approveGas,
      gasPriceTrade,
      gasPriceApprove,
      currentCurrency,
      conversionRate,
      USDConversionRate,
      tradeValue,
      sourceSymbol: sourceTokenSymbol,
      sourceAmount: usedQuote.sourceAmount,
      chainId,
      nativeCurrencySymbol,
      multiLayerL1FeeTotal,
    });
  additionalTrackingParams.reg_tx_fee_in_usd = Number(feeInUsd);
  additionalTrackingParams.reg_tx_fee_in_eth = Number(rawEthFee);

  const renderableMaxFees = getRenderableNetworkFeesForQuote({
    tradeGas: maxGasLimit,
    approveGas,
    gasPriceTrade,
    gasPriceApprove,
    currentCurrency,
    conversionRate,
    USDConversionRate,
    tradeValue,
    sourceSymbol: sourceTokenSymbol,
    sourceAmount: usedQuote.sourceAmount,
    chainId,
    nativeCurrencySymbol,
    multiLayerL1FeeTotal,
  });
  let {
    feeInFiat: maxFeeInFiat,
    feeInEth: maxFeeInEth,
    rawEthFee: maxRawEthFee,
    feeInUsd: maxFeeInUsd,
  } = renderableMaxFees;
  additionalTrackingParams.reg_tx_max_fee_in_usd = Number(maxFeeInUsd);
  additionalTrackingParams.reg_tx_max_fee_in_eth = Number(maxRawEthFee);

  if (isSmartTransaction && smartTransactionFees?.tradeTxFees) {
    const stxEstimatedFeeInWeiDec =
      smartTransactionFees?.tradeTxFees.feeEstimate +
      (smartTransactionFees?.approvalTxFees?.feeEstimate || 0);
    const stxMaxFeeInWeiDec =
      smartTransactionFees?.tradeTxFees.maxFeeEstimate +
      (smartTransactionFees?.approvalTxFees?.maxFeeEstimate || 0);

    ({ feeInFiat, feeInEth, rawEthFee, feeInUsd } = getFeeForSmartTransaction({
      chainId,
      currentCurrency,
      conversionRate,
      USDConversionRate,
      nativeCurrencySymbol,
      feeInWeiDec: stxEstimatedFeeInWeiDec,
    }));
    additionalTrackingParams.stx_fee_in_usd = Number(feeInUsd);
    additionalTrackingParams.stx_fee_in_eth = Number(rawEthFee);
    additionalTrackingParams.estimated_gas =
      smartTransactionFees?.tradeTxFees.gasLimit;
    ({
      feeInFiat: maxFeeInFiat,
      feeInEth: maxFeeInEth,
      rawEthFee: maxRawEthFee,
      feeInUsd: maxFeeInUsd,
    } = getFeeForSmartTransaction({
      chainId,
      currentCurrency,
      conversionRate,
      USDConversionRate,
      nativeCurrencySymbol,
      feeInWeiDec: stxMaxFeeInWeiDec,
    }));
    additionalTrackingParams.stx_max_fee_in_usd = Number(maxFeeInUsd);
    additionalTrackingParams.stx_max_fee_in_eth = Number(maxRawEthFee);
  }

  const tokenCost = new BigNumber(usedQuote.sourceAmount);
  const ethCost = new BigNumber(usedQuote.trade.value || 0, 10).plus(
    new BigNumber(gasTotalInWeiHex, 16),
  );

  const insufficientTokens =
    (tokensWithBalances?.length || balanceError) &&
    tokenCost.gt(new BigNumber(selectedFromToken.balance || '0x0'));

  const insufficientEth = ethCost.gt(new BigNumber(ethBalance || '0x0'));

  const tokenBalanceNeeded = insufficientTokens
    ? toPrecisionWithoutTrailingZeros(
        calcTokenAmount(tokenCost, selectedFromToken.decimals)
          .minus(tokenBalance)
          .toString(10),
        6,
      )
    : null;

  const ethBalanceNeeded = insufficientEth
    ? toPrecisionWithoutTrailingZeros(
        ethCost
          .minus(ethBalance, 16)
          .div('1000000000000000000', 10)
          .toString(10),
        6,
      )
    : null;

  let ethBalanceNeededStx;
  if (isSmartTransaction && smartTransactionsError?.balanceNeededWei) {
    ethBalanceNeededStx = decWEIToDecETH(
      smartTransactionsError.balanceNeededWei -
        smartTransactionsError.currentBalanceWei,
    );
  }
  const prevEthBalanceNeededStx = usePrevious(ethBalanceNeededStx);

  const destinationToken = useSelector(getDestinationTokenInfo, isEqual);
  useEffect(() => {
    if (isSmartTransaction) {
      if (insufficientTokens) {
        dispatch(setBalanceError(true));
      } else if (balanceError && !insufficientTokens) {
        dispatch(setBalanceError(false));
      }
    } else if (insufficientTokens || insufficientEth) {
      dispatch(setBalanceError(true));
    } else if (balanceError && !insufficientTokens && !insufficientEth) {
      dispatch(setBalanceError(false));
    }
  }, [
    insufficientTokens,
    insufficientEth,
    dispatch,
    isSmartTransaction,
    balanceError,
  ]);

  useEffect(() => {
    if (!originalApproveAmount && approveAmount) {
      setOriginalApproveAmount(approveAmount);
    }
  }, [originalApproveAmount, approveAmount]);

  // If it's not a Smart Transaction and ETH balance is needed, we want to show a warning.
  const isNotStxAndEthBalanceIsNeeded = !isSmartTransaction && ethBalanceNeeded;

  // If it's a Smart Transaction and ETH balance is needed, we want to show a warning.
  const isStxAndEthBalanceIsNeeded = isSmartTransaction && ethBalanceNeededStx;

  // Indicates if we should show to a user a warning about insufficient funds for swapping.
  const showInsufficientWarning =
    (balanceError ||
      tokenBalanceNeeded ||
      isNotStxAndEthBalanceIsNeeded ||
      isStxAndEthBalanceIsNeeded) &&
    !warningHidden;

  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);

  const numberOfQuotes = Object.values(quotes).length;
  const bestQuoteReviewedEventSent = useRef();
  const eventObjectBase = useMemo(() => {
    return {
      token_from: sourceTokenSymbol,
      token_from_amount: sourceTokenValue,
      token_to: destinationTokenSymbol,
      token_to_amount: destinationTokenValue,
      request_type: fetchParams?.balanceError,
      slippage: fetchParams?.slippage,
      custom_slippage: fetchParams?.slippage !== 2,
      response_time: fetchParams?.responseTime,
      best_quote_source: topQuote?.aggregator,
      available_quotes: numberOfQuotes,
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: hardwareWalletType,
      stx_enabled: smartTransactionsEnabled,
      current_stx_enabled: currentSmartTransactionsEnabled,
      stx_user_opt_in: smartTransactionsOptInStatus,
    };
  }, [
    sourceTokenSymbol,
    sourceTokenValue,
    destinationTokenSymbol,
    destinationTokenValue,
    fetchParams?.balanceError,
    fetchParams?.slippage,
    fetchParams?.responseTime,
    topQuote?.aggregator,
    numberOfQuotes,
    hardwareWalletUsed,
    hardwareWalletType,
    smartTransactionsEnabled,
    currentSmartTransactionsEnabled,
    smartTransactionsOptInStatus,
  ]);

  const trackAllAvailableQuotesOpened = () => {
    trackEvent({
      event: 'All Available Quotes Opened',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        ...eventObjectBase,
        other_quote_selected: usedQuote?.aggregator !== topQuote?.aggregator,
        other_quote_selected_source:
          usedQuote?.aggregator === topQuote?.aggregator
            ? null
            : usedQuote?.aggregator,
      },
    });
  };
  const trackQuoteDetailsOpened = () => {
    trackEvent({
      event: 'Quote Details Opened',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        ...eventObjectBase,
        other_quote_selected: usedQuote?.aggregator !== topQuote?.aggregator,
        other_quote_selected_source:
          usedQuote?.aggregator === topQuote?.aggregator
            ? null
            : usedQuote?.aggregator,
      },
    });
  };
  const trackEditSpendLimitOpened = () => {
    trackEvent({
      event: 'Edit Spend Limit Opened',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        ...eventObjectBase,
        custom_spend_limit_set: originalApproveAmount === approveAmount,
        custom_spend_limit_amount:
          originalApproveAmount === approveAmount ? null : approveAmount,
      },
    });
  };
  const trackBestQuoteReviewedEvent = useCallback(() => {
    trackEvent({
      event: 'Best Quote Reviewed',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        ...eventObjectBase,
        network_fees: feeInFiat,
      },
    });
  }, [trackEvent, eventObjectBase, feeInFiat]);
  const trackViewQuotePageLoadedEvent = useCallback(() => {
    trackEvent({
      event: 'Review Quote Component Loaded',
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        ...eventObjectBase,
        response_time: currentTimestamp - reviewSwapClickedTimestamp,
      },
    });
  }, [
    trackEvent,
    eventObjectBase,
    currentTimestamp,
    reviewSwapClickedTimestamp,
  ]);

  useEffect(() => {
    if (
      !bestQuoteReviewedEventSent.current &&
      [
        sourceTokenSymbol,
        sourceTokenValue,
        destinationTokenSymbol,
        destinationTokenValue,
        fetchParams,
        topQuote,
        numberOfQuotes,
        feeInFiat,
      ].every((dep) => dep !== null && dep !== undefined)
    ) {
      bestQuoteReviewedEventSent.current = true;
      trackBestQuoteReviewedEvent();
    }
  }, [
    fetchParams,
    topQuote,
    numberOfQuotes,
    feeInFiat,
    destinationTokenSymbol,
    destinationTokenValue,
    sourceTokenSymbol,
    sourceTokenValue,
    trackBestQuoteReviewedEvent,
  ]);

  useEffect(() => {
    if (
      ((isSmartTransaction && prevEthBalanceNeededStx) ||
        !isSmartTransaction) &&
      quotesLastFetched === prevQuotesLastFetched
    ) {
      return;
    }
    let additionalBalanceNeeded;
    if (isSmartTransaction && ethBalanceNeededStx) {
      additionalBalanceNeeded = ethBalanceNeededStx;
    } else if (!isSmartTransaction && ethBalanceNeeded) {
      additionalBalanceNeeded = ethBalanceNeeded;
    } else {
      return; // A user has enough balance for a gas fee, so we don't need to track it.
    }
    trackEvent({
      event: MetaMetricsEventName.SwapError,
      category: MetaMetricsEventCategory.Swaps,
      sensitiveProperties: {
        ...eventObjectBase,
        error_type: MetaMetricsEventErrorType.InsufficientGas,
        additional_balance_needed: additionalBalanceNeeded,
      },
    });
  }, [
    quotesLastFetched,
    prevQuotesLastFetched,
    ethBalanceNeededStx,
    isSmartTransaction,
    trackEvent,
    prevEthBalanceNeededStx,
    ethBalanceNeeded,
    eventObjectBase,
  ]);

  const metaMaskFee = usedQuote.fee;

  /* istanbul ignore next */
  const onFeeCardTokenApprovalClick = () => {
    trackEditSpendLimitOpened();
    dispatch(
      showModal({
        name: 'EDIT_APPROVAL_PERMISSION',
        decimals: selectedFromToken.decimals,
        origin: 'MetaMask',
        setCustomAmount: (newCustomPermissionAmount) => {
          const customPermissionAmount =
            newCustomPermissionAmount === ''
              ? originalApproveAmount
              : newCustomPermissionAmount;
          const newData = getCustomTxParamsData(approveTxParams.data, {
            customPermissionAmount,
            decimals: selectedFromToken.decimals,
          });

          if (
            customPermissionAmount?.length &&
            approveTxParams.data !== newData
          ) {
            dispatch(setCustomApproveTxData(newData));
          }
        },
        tokenAmount: originalApproveAmount,
        customTokenAmount:
          originalApproveAmount === approveAmount ? null : approveAmount,
        tokenBalance,
        tokenSymbol: selectedFromToken.symbol,
        requiredMinimum: calcTokenAmount(
          usedQuote.sourceAmount,
          selectedFromToken.decimals,
        ),
      }),
    );
  };

  const needsMoreGas = Boolean(ethBalanceNeededStx || ethBalanceNeeded);

  const actionableBalanceErrorMessage = tokenBalanceUnavailable
    ? t('swapTokenBalanceUnavailable', [sourceTokenSymbol])
    : t('swapApproveNeedMoreTokens', [
        <span key="swapApproveNeedMoreTokens-1">
          {tokenBalanceNeeded || ethBalanceNeededStx || ethBalanceNeeded}
        </span>,
        tokenBalanceNeeded && !(sourceTokenSymbol === defaultSwapsToken.symbol)
          ? sourceTokenSymbol
          : defaultSwapsToken.symbol,
      ]);

  // Price difference warning
  const priceSlippageBucket = usedQuote?.priceSlippage?.bucket;
  const lastPriceDifferenceBucket = usePrevious(priceSlippageBucket);

  // If the user agreed to a different bucket of risk, make them agree again
  useEffect(() => {
    if (
      acknowledgedPriceDifference &&
      lastPriceDifferenceBucket === GasRecommendations.medium &&
      priceSlippageBucket === GasRecommendations.high
    ) {
      setAcknowledgedPriceDifference(false);
    }
  }, [
    priceSlippageBucket,
    acknowledgedPriceDifference,
    lastPriceDifferenceBucket,
  ]);

  let viewQuotePriceDifferenceWarning = null;
  const priceSlippageFromSource = useEthFiatAmount(
    usedQuote?.priceSlippage?.sourceAmountInETH || 0,
    { showFiat: true },
  );
  const priceSlippageFromDestination = useEthFiatAmount(
    usedQuote?.priceSlippage?.destinationAmountInETH || 0,
    { showFiat: true },
  );

  // We cannot present fiat value if there is a calculation error or no slippage
  // from source or destination
  const priceSlippageUnknownFiatValue =
    !priceSlippageFromSource ||
    !priceSlippageFromDestination ||
    Boolean(usedQuote?.priceSlippage?.calculationError);

  let priceDifferencePercentage = 0;
  if (usedQuote?.priceSlippage?.ratio) {
    priceDifferencePercentage = parseFloat(
      new BigNumber(usedQuote.priceSlippage.ratio, 10)
        .minus(1, 10)
        .times(100, 10)
        .toFixed(2),
      10,
    );
  }
  const prevPriceDifferencePercentage = usePrevious(priceDifferencePercentage);

  const shouldShowPriceDifferenceWarning =
    !tokenBalanceUnavailable &&
    !showInsufficientWarning &&
    usedQuote &&
    (priceDifferenceRiskyBuckets.includes(priceSlippageBucket) ||
      priceSlippageUnknownFiatValue);

  if (shouldShowPriceDifferenceWarning) {
    viewQuotePriceDifferenceWarning = (
      <ViewQuotePriceDifference
        usedQuote={usedQuote}
        sourceTokenValue={sourceTokenValue}
        destinationTokenValue={destinationTokenValue}
        priceSlippageFromSource={priceSlippageFromSource}
        priceSlippageFromDestination={priceSlippageFromDestination}
        priceDifferencePercentage={priceDifferencePercentage}
        priceSlippageUnknownFiatValue={priceSlippageUnknownFiatValue}
        onAcknowledgementClick={() => {
          setAcknowledgedPriceDifference(true);
        }}
        acknowledged={acknowledgedPriceDifference}
      />
    );
  }

  const disableSubmissionDueToPriceWarning =
    shouldShowPriceDifferenceWarning && !acknowledgedPriceDifference;

  const isShowingWarning =
    showInsufficientWarning || shouldShowPriceDifferenceWarning;

  const isSwapButtonDisabled = Boolean(
    submitClicked ||
      balanceError ||
      tokenBalanceUnavailable ||
      disableSubmissionDueToPriceWarning ||
      (networkAndAccountSupports1559 &&
        gasFeeEstimatesTrade?.baseAndPriorityFeePerGas === undefined) ||
      (!networkAndAccountSupports1559 &&
        (gasPrice === null || gasPrice === undefined)) ||
      (currentSmartTransactionsEnabled &&
        (currentSmartTransactionsError || smartTransactionsError)) ||
      (currentSmartTransactionsEnabled &&
        smartTransactionsPreferenceEnabled &&
        !smartTransactionFees?.tradeTxFees),
  );

  useEffect(() => {
    if (
      shouldShowPriceDifferenceWarning &&
      acknowledgedPriceDifference &&
      quotesLastFetched !== prevQuotesLastFetched &&
      priceDifferencePercentage !== prevPriceDifferencePercentage
    ) {
      // Reset price difference acknowledgement if price diff % changed.
      setAcknowledgedPriceDifference(false);
    }
  }, [
    acknowledgedPriceDifference,
    prevQuotesLastFetched,
    quotesLastFetched,
    shouldShowPriceDifferenceWarning,
    priceDifferencePercentage,
    prevPriceDifferencePercentage,
  ]);

  useEffect(() => {
    // If it's a smart transaction, has sufficient tokens, and gas is not included in the trade,
    // set up gas fee polling.
    if (isSmartTransaction && !insufficientTokens && !isGasIncludedTrade) {
      const unsignedTx = {
        from: unsignedTransaction.from,
        to: unsignedTransaction.to,
        value: unsignedTransaction.value,
        data: unsignedTransaction.data,
        gas: unsignedTransaction.gas,
        chainId,
      };
      intervalId = setInterval(() => {
        if (!swapsSTXLoading) {
          dispatch(
            fetchSwapsSmartTransactionFees({
              unsignedTransaction: unsignedTx,
              approveTxParams,
              fallbackOnNotEnoughFunds: false,
            }),
          );
        }
      }, swapsNetworkConfig.stxGetTransactionsRefreshTime);
      dispatch(
        fetchSwapsSmartTransactionFees({
          unsignedTransaction: unsignedTx,
          approveTxParams,
          fallbackOnNotEnoughFunds: false,
        }),
      );
    } else if (intervalId) {
      clearInterval(intervalId);
    }
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, [
    dispatch,
    isSmartTransaction,
    unsignedTransaction.data,
    unsignedTransaction.from,
    unsignedTransaction.value,
    unsignedTransaction.gas,
    unsignedTransaction.to,
    chainId,
    swapsNetworkConfig.stxGetTransactionsRefreshTime,
    insufficientTokens,
    isGasIncludedTrade,
  ]);

  useEffect(() => {
    // Thanks to the next line we will only do quotes polling 3 times before showing a Quote Timeout modal.
    dispatch(setSwapsQuotesPollingLimitEnabled(true));
    if (reviewSwapClickedTimestamp) {
      trackViewQuotePageLoadedEvent();
    }
  }, [dispatch, trackViewQuotePageLoadedEvent, reviewSwapClickedTimestamp]);

  useEffect(() => {
    if (
      (!currentSmartTransactionsEnabled &&
        currentSmartTransactionsError &&
        submitClicked) ||
      (isSmartTransaction && !swapsSTXLoading && submitClicked)
    ) {
      setSubmitClicked(false);
    }
  }, [
    currentSmartTransactionsEnabled,
    currentSmartTransactionsError,
    isSmartTransaction,
    swapsSTXLoading,
    submitClicked,
  ]);

  useEffect(() => {
    if (!usedQuote?.multiLayerL1TradeFeeTotal) {
      return;
    }
    const getEstimatedL1Fees = async () => {
      try {
        let l1ApprovalFeeTotal = '0x0';
        if (approveTxParams) {
          l1ApprovalFeeTotal = await dispatch(
            getLayer1GasFee({
              transactionParams: {
                ...approveTxParams,
                gasPrice: addHexPrefix(approveTxParams.gasPrice),
                value: '0x0', // For approval txs we need to use "0x0" here.
              },
              chainId,
            }),
          );
          setMultiLayerL1ApprovalFeeTotal(l1ApprovalFeeTotal);
        }
        const l1FeeTotal = sumHexes(
          usedQuote.multiLayerL1TradeFeeTotal,
          l1ApprovalFeeTotal,
        );
        setMultiLayerL1FeeTotal(l1FeeTotal);
      } catch (e) {
        captureException(e);
        setMultiLayerL1FeeTotal(null);
        setMultiLayerL1ApprovalFeeTotal(null);
      }
    };
    getEstimatedL1Fees();
  }, [unsignedTransaction, approveTxParams, chainId, usedQuote]);

  const destinationValue = calcTokenValue(
    destinationTokenValue,
    destinationTokenDecimals,
  );
  const destinationAmount = calcTokenAmount(
    destinationValue,
    destinationTokenDecimals,
  );
  const amountToDisplay = formatSwapsValueForDisplay(destinationAmount);
  const amountDigitLength = amountToDisplay.match(/\d+/gu).join('').length;
  let ellipsedAmountToDisplay = amountToDisplay;

  if (amountDigitLength > 20) {
    ellipsedAmountToDisplay = `${amountToDisplay.slice(0, 20)}...`;
  }
  useEffect(() => {
    setReceiveToAmount(ellipsedAmountToDisplay);
  }, [ellipsedAmountToDisplay, setReceiveToAmount]);

  const hideTokenApprovalRow =
    !approveTxParams || (balanceError && !warningHidden);

  // TODO: use the <Text> component for this.
  const tokenApprovalTextComponent = (
    <span key="fee-card-approve-symbol" className="fee-card__bold">
      {t('enableToken', [sourceTokenSymbol])}
    </span>
  );

  const onSwapSubmit = ({ acknowledgedSlippage = false }) => {
    if (slippageErrorKey && !acknowledgedSlippage) {
      setSlippageNotificationModalOpened(true);
      return;
    }
    setSubmitClicked(true);
    if (!balanceError) {
      if (isSmartTransaction && smartTransactionFees?.tradeTxFees) {
        dispatch(
          signAndSendSwapsSmartTransaction({
            unsignedTransaction,
            trackEvent,
            history,
            additionalTrackingParams,
          }),
        );
      } else {
        dispatch(
          signAndSendTransactions(
            history,
            trackEvent,
            additionalTrackingParams,
          ),
        );
      }
    } else if (destinationToken.symbol === defaultSwapsToken.symbol) {
      history.push(DEFAULT_ROUTE);
    } else {
      history.push(`${ASSET_ROUTE}/${destinationToken.address}`);
    }
  };

  const gasTokenFiatAmount = useMemo(() => {
    if (!isGasIncludedTrade) {
      return undefined;
    }
    const tradeTxTokenFee =
      smartTransactionFees?.tradeTxFees?.fees?.[0]?.tokenFees?.[0];
    if (!tradeTxTokenFee) {
      return undefined;
    }
    const { token: { address, decimals, symbol } = {}, balanceNeededToken } =
      tradeTxTokenFee;
    const checksumAddress = toChecksumHexAddress(address);
    const contractExchangeRate = memoizedTokenConversionRates[checksumAddress];
    const gasTokenAmountDec = calcTokenAmount(
      hexToDecimal(balanceNeededToken),
      decimals,
    ).toString(10);
    return getTokenFiatAmount(
      contractExchangeRate,
      conversionRate,
      currentCurrency,
      gasTokenAmountDec,
      symbol,
      true,
      true,
    );
  }, [
    isGasIncludedTrade,
    smartTransactionFees,
    memoizedTokenConversionRates,
    conversionRate,
    currentCurrency,
  ]);

  return (
    <div className="review-quote">
      <div className="review-quote__content">
        <SlippageNotificationModal
          isOpen={slippageNotificationModalOpened}
          setSlippageNotificationModalOpened={
            setSlippageNotificationModalOpened
          }
          slippageErrorKey={slippageErrorKey}
          onSwapSubmit={onSwapSubmit}
          currentSlippage={fetchParams?.slippage}
        />
        {
          /* istanbul ignore next */
          selectQuotePopoverShown && (
            <SelectQuotePopover
              quoteDataRows={renderablePopoverData}
              onClose={() => setSelectQuotePopoverShown(false)}
              onSubmit={(aggId) => dispatch(swapsQuoteSelected(aggId))}
              swapToSymbol={destinationTokenSymbol}
              initialAggId={usedQuote.aggregator}
              onQuoteDetailsIsOpened={trackQuoteDetailsOpened}
              hideEstimatedGasFee={
                smartTransactionsEnabled && smartTransactionsPreferenceEnabled
              }
            />
          )
        }
        {isShowingWarning && (
          <>
            {viewQuotePriceDifferenceWarning}
            {(showInsufficientWarning || tokenBalanceUnavailable) && (
              <BannerAlert
                title={t('notEnoughBalance')}
                titleProps={{ 'data-testid': 'swaps-banner-title' }}
                severity={Severity.Info}
                description={actionableBalanceErrorMessage}
                descriptionProps={{
                  'data-testid': 'mm-banner-alert-notification-text',
                }}
                actionButtonLabel={
                  needsMoreGas
                    ? t('buyMoreAsset', [nativeCurrencySymbol])
                    : undefined
                }
                actionButtonOnClick={
                  needsMoreGas ? () => openBuyCryptoInPdapp() : undefined
                }
                marginTop={2}
              />
            )}
          </>
        )}

        <div className="review-quote__countdown-timer-container">
          <CountdownTimer
            timeStarted={quotesLastFetched}
            warningTime="0:10"
            labelKey="swapNewQuoteIn"
          />
        </div>

        <Box
          marginTop={1}
          marginBottom={0}
          display={DISPLAY.FLEX}
          flexDirection={FlexDirection.Column}
          className="review-quote__overview"
        >
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
          >
            <Text
              variant={TextVariant.bodyMd}
              marginRight={1}
              color={TextColor.textDefault}
            >
              {t('quoteRate')}*
            </Text>
            <ExchangeRateDisplay
              primaryTokenValue={calcTokenValue(
                sourceTokenValue,
                sourceTokenDecimals,
              )}
              primaryTokenDecimals={sourceTokenDecimals}
              primaryTokenSymbol={sourceTokenSymbol}
              secondaryTokenValue={destinationValue}
              secondaryTokenDecimals={destinationTokenDecimals}
              secondaryTokenSymbol={destinationTokenSymbol}
              boldSymbols={false}
              className="review-quote__exchange-rate-display"
              showIconForSwappingTokens={false}
            />
          </Box>
          {isGasIncludedTrade && (
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.stretch}
            >
              <Box
                display={DISPLAY.FLEX}
                alignItems={AlignItems.center}
                width={FRACTIONS.SIX_TWELFTHS}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  as="h6"
                  color={TextColor.textDefault}
                  marginRight={1}
                >
                  {t('gasFee')}
                </Text>
                <InfoTooltip
                  position="left"
                  contentText={
                    <>
                      <p className="fee-card__info-tooltip-paragraph">
                        {t('swapGasIncludedTooltipExplanation')}
                      </p>
                      <ButtonLink
                        key="learn-more-about-gas-included-link"
                        size={ButtonLinkSize.Inherit}
                        href={ZENDESK_URLS.SWAPS_GAS_FEES}
                        target="_blank"
                        rel="noopener noreferrer"
                        externalLink
                        onClick={() => {
                          trackEvent({
                            event:
                              'Clicked "GasIncluded tooltip: Learn More" Link',
                            category: MetaMetricsEventCategory.Swaps,
                          });
                        }}
                      >
                        {t('swapGasIncludedTooltipExplanationLinkText')}
                      </ButtonLink>
                    </>
                  }
                />
              </Box>
              <Box
                display={DISPLAY.FLEX}
                justifyContent={JustifyContent.flexEnd}
                alignItems={AlignItems.flexEnd}
                width={FRACTIONS.SIX_TWELFTHS}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  as="h6"
                  color={TextColor.textDefault}
                  data-testid="review-quote-gas-fee-in-fiat"
                  textAlign={TEXT_ALIGN.RIGHT}
                  style={{ textDecoration: 'line-through' }}
                  marginRight={1}
                >
                  {gasTokenFiatAmount}
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  as="h6"
                  color={TextColor.textDefault}
                  textAlign={TEXT_ALIGN.RIGHT}
                  fontStyle={FontStyle.Italic}
                >
                  {t('included')}
                </Text>
              </Box>
            </Box>
          )}
          {!isGasIncludedTrade && (
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.stretch}
            >
              <Box
                display={DISPLAY.FLEX}
                alignItems={AlignItems.center}
                width={FRACTIONS.SIX_TWELFTHS}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  as="h6"
                  color={TextColor.textDefault}
                  marginRight={1}
                >
                  {t('transactionDetailGasHeading')}
                </Text>
                <InfoTooltip
                  position="left"
                  contentText={
                    <p className="fee-card__info-tooltip-paragraph">
                      {t('swapGasFeesExplanation', [
                        <ButtonLink
                          key="learn-more-gas-link"
                          size={ButtonLinkSize.Inherit}
                          href={ZENDESK_URLS.GAS_FEES}
                          target="_blank"
                          rel="noopener noreferrer"
                          externalLink
                          onClick={() => {
                            trackEvent({
                              event: 'Clicked "Gas Fees: Learn More" Link',
                              category: MetaMetricsEventCategory.Swaps,
                            });
                          }}
                        >
                          {t('swapGasFeesExplanationLinkText')}
                        </ButtonLink>,
                      ])}
                    </p>
                  }
                />
              </Box>
              <Box
                display={DISPLAY.FLEX}
                alignItems={AlignItems.flexEnd}
                width={FRACTIONS.SIX_TWELFTHS}
              >
                <Text
                  variant={TextVariant.bodyMd}
                  as="h6"
                  color={TextColor.textDefault}
                  width={FRACTIONS.EIGHT_TWELFTHS}
                  textAlign={TEXT_ALIGN.RIGHT}
                  paddingRight={1}
                >
                  {feeInEth}
                </Text>
                <Text
                  variant={TextVariant.bodyMdBold}
                  as="h6"
                  color={TextColor.textDefault}
                  data-testid="review-quote-gas-fee-in-fiat"
                  width={FRACTIONS.FOUR_TWELFTHS}
                  textAlign={TEXT_ALIGN.RIGHT}
                >
                  {` ${feeInFiat}`}
                </Text>
              </Box>
            </Box>
          )}
          {!isGasIncludedTrade && (maxFeeInFiat || maxFeeInEth) && (
            <Box display={DISPLAY.FLEX}>
              <Box display={DISPLAY.FLEX} width={FRACTIONS.SIX_TWELFTHS}></Box>
              <Box
                display={DISPLAY.FLEX}
                justifyContent={JustifyContent.flexEnd}
                width={FRACTIONS.SIX_TWELFTHS}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textDefault}
                  width={FRACTIONS.EIGHT_TWELFTHS}
                  paddingRight={1}
                  textAlign={TEXT_ALIGN.RIGHT}
                >
                  {`${t('maxFee')}: `}
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textDefault}
                  width={FRACTIONS.FOUR_TWELFTHS}
                  textAlign={TEXT_ALIGN.RIGHT}
                >
                  {maxFeeInFiat || maxFeeInEth}
                </Text>
              </Box>
            </Box>
          )}
          {!hideTokenApprovalRow && (
            <Box
              display={DISPLAY.FLEX}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Text
                variant={TextVariant.bodyMd}
                as="h6"
                color={TextColor.textDefault}
                marginRight={1}
              >
                {t('swapEnableTokenForSwapping', [tokenApprovalTextComponent])}
              </Text>
              <Text variant={TextVariant.bodyMd}>
                <ButtonLink
                  onClick={() => onFeeCardTokenApprovalClick()}
                  size={Size.inherit}
                  className="review-quote__edit-limit"
                >
                  {t('swapEditLimit')}
                </ButtonLink>
              </Text>
            </Box>
          )}
          {isGasIncludedTrade && (
            <Box
              display={DISPLAY.FLEX}
              marginTop={3}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              flexDirection={FlexDirection.Column}
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                * {t('swapIncludesGasAndMetaMaskFee', [metaMaskFee])}
              </Text>
              <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
                <ViewAllQuotesLink
                  trackAllAvailableQuotesOpened={trackAllAvailableQuotesOpened}
                  setSelectQuotePopoverShown={setSelectQuotePopoverShown}
                  t={t}
                />
              </Text>
            </Box>
          )}
          {!isGasIncludedTrade && (
            <Box
              display={DISPLAY.FLEX}
              marginTop={3}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
            >
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                *
                {t('swapIncludesMetaMaskFeeViewAllQuotes', [
                  metaMaskFee,
                  <ViewAllQuotesLink
                    key="view-all-quotes"
                    trackAllAvailableQuotesOpened={
                      trackAllAvailableQuotesOpened
                    }
                    setSelectQuotePopoverShown={setSelectQuotePopoverShown}
                    t={t}
                  />,
                ])}
              </Text>
            </Box>
          )}
        </Box>
      </div>
      <SwapsFooter
        onSubmit={onSwapSubmit}
        submitText={
          isSmartTransaction && swapsSTXLoading ? t('preparingSwap') : t('swap')
        }
        hideCancel
        disabled={isSwapButtonDisabled}
        className={classnames('review-quote__footer', {
          'review-quote__thin-swaps-footer': isShowingWarning,
        })}
        showTopBorder
        showTermsOfService
      />
    </div>
  );
}

ReviewQuote.propTypes = {
  setReceiveToAmount: PropTypes.func.isRequired,
};
