import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import type { Json } from '@metamask/utils';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import {
  ORDER_SLIPPAGE_CONFIG,
  PERPS_ERROR_CODES,
  type ClosePositionParams,
  type InputMethod,
  type OrderType,
} from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  formatPnl,
  PRICE_RANGES_MINIMAL_VIEW,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalContentSize,
  ModalBody,
  ModalFooter,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import {
  usePerpsEligibility,
  usePerpsEventTracking,
} from '../../../../hooks/perps';
import { usePerpsAttribution } from '../../../../hooks/perps/usePerpsAttribution';
import { usePerpsAbandonOrderTracking } from '../../../../hooks/perps/usePerpsAbandonOrderTracking';
import {
  getDisplaySymbol,
  getPositionDirection,
  getPositionPnlRatio,
} from '../utils';
import {
  handlePerpsError,
  isPerpsErrorCode,
  isSlippageFailure,
  type PerpsErrorInput,
} from '../utils/translate-perps-error';
import { trackPerpsErrorScreenViewed } from '../utils/track-perps-error-screen';
import { PERPS_MIN_MARKET_ORDER_USD } from '../constants';
import { usePerpsOrderFees } from '../../../../hooks/perps/usePerpsOrderFees';
import { getPerpsNotionalUsd } from '../../../../hooks/perps/perps-fee-utils';
import { PerpsFeesDisplay } from '../perps-fees-display';
import { usePerpsPositionAlreadyClosed } from '../hooks/usePerpsPositionAlreadyClosed';
import {
  CloseAmountSection,
  LimitPriceInput,
  OrderEntryHeader,
  OrderTypeToggle,
} from '../order-entry';
import {
  PERPS_TOAST_KEYS,
  usePerpsToast,
  type PerpsToastKeyConfig,
} from '../perps-toast';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import { PerpsServiceInterruptionBanner } from '../perps-service-interruption-banner';
import { useSelectedAccountComplianceGate } from '../../compliance';
import type { PerpsBackgroundResult, Position } from '../types';
import { useVipTier } from '../../../../hooks/rewards/useVipTier';
import {
  getIsPerpsCloseLimitOrderEnabled,
  getIsPerpsServiceInterruptionBannerEnabled,
} from '../../../../selectors/perps/feature-flags';
import { selectPerpsActiveProvider } from '../../../../selectors/perps-controller';
import {
  PERPS_CLOSE_UNAVAILABLE_DISPLAY,
  estimateClosePositionReceive,
  getCloseLimitReferencePrice,
  getCloseMarginWithPnl,
  getClosePositionProviderId,
  isCloseLimitPriceOutsideDeviation,
  parsePositivePrice,
  roundCloseUsd,
} from './close-position-utils';

type CloseToastConfig = Pick<PerpsToastKeyConfig, 'key' | 'description'>;

type CloseToastTranslation = (key: string, vars?: unknown[]) => string;

type FormatNumber = (
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) => string;

type FormatPerpsFiat = (value: number | string) => string;

type FormatPercentWithMinThreshold = (value: number) => string | undefined;

/**
 * The size a close submits, quantized to the market's size step once so the
 * fee quote, the estimate and the order all describe the same close.
 *
 * @param options - Close inputs.
 * @param options.isPartialClose - Whether the slider is below 100%.
 * @param options.closeSize - Unrounded close size from the slider.
 * @param options.positionSize - Absolute position size.
 * @param options.sizeDecimals - Market size decimals, when known.
 * @returns The order size for a partial close, or undefined for a full close.
 */
export const getExecutablePartialCloseSize = ({
  isPartialClose,
  closeSize,
  positionSize,
  sizeDecimals,
}: {
  isPartialClose: boolean;
  closeSize: number;
  positionSize: number;
  sizeDecimals?: number;
}): string | undefined => {
  if (!isPartialClose) {
    return undefined;
  }
  // Round-half-up can lift a partial size onto the whole position — closing
  // 99.999% of 2.5 at 4 decimals formats as "2.5000". A partial close must stay
  // strictly under the position, so step the last decimal back when it does.
  const roundedSize =
    sizeDecimals === undefined
      ? closeSize.toString()
      : closeSize.toFixed(sizeDecimals);
  const roundsOntoWholePosition =
    sizeDecimals !== undefined &&
    Number.parseFloat(roundedSize) >= positionSize;
  if (!roundsOntoWholePosition) {
    return roundedSize;
  }
  const flooredSize = (positionSize - 10 ** -sizeDecimals).toFixed(
    sizeDecimals,
  );
  // On a market whose smallest step is the position itself — a 1-unit position
  // on an integer-size market — stepping back lands on zero, which the venue
  // rejects or treats as a no-op. The trader asked for all but a rounding
  // sliver, so send it as the full close it effectively is.
  return Number.parseFloat(flooredSize) <= 0 ? undefined : flooredSize;
};

const buildCloseRequestParams = ({
  symbol,
  currentPrice,
  size,
  orderType,
  limitPrice,
  position,
}: {
  symbol: string;
  currentPrice: number;
  size?: string;
  orderType: OrderType;
  limitPrice?: string;
  position: Position;
}): ClosePositionParams => {
  const includeSize = size !== undefined;

  if (orderType === 'limit') {
    return {
      symbol,
      orderType: 'limit',
      price: limitPrice,
      ...(includeSize ? { size } : {}),
      position,
    };
  }

  return {
    symbol,
    orderType: 'market',
    currentPrice,
    maxSlippageBps: ORDER_SLIPPAGE_CONFIG.DefaultMarketSlippageBps,
    ...(includeSize ? { size } : {}),
    position,
  };
};

const getPartialCloseDescription = ({
  positionSize,
  closeSize,
  displayName,
  t,
  formatNumber,
}: {
  positionSize: string;
  closeSize: number;
  displayName: string;
  t: CloseToastTranslation;
  formatNumber: FormatNumber;
}) => {
  const directionLabel = t(
    getPositionDirection(positionSize) === 'long' ? 'perpsLong' : 'perpsShort',
  ).toLowerCase();

  return t('perpsToastOrderPlacementSubtitle', [
    directionLabel,
    formatNumber(closeSize, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }),
    displayName,
  ]);
};

const getCloseInProgressToastConfig = ({
  isPartialClose,
  positionSize,
  closeSize,
  displayName,
  t,
  formatNumber,
}: {
  isPartialClose: boolean;
  positionSize: string;
  closeSize: number;
  displayName: string;
  t: CloseToastTranslation;
  formatNumber: FormatNumber;
}): CloseToastConfig => {
  if (!isPartialClose) {
    return { key: PERPS_TOAST_KEYS.CLOSE_IN_PROGRESS };
  }

  return {
    key: PERPS_TOAST_KEYS.PARTIAL_CLOSE_IN_PROGRESS,
    description: getPartialCloseDescription({
      positionSize,
      closeSize,
      displayName,
      t,
      formatNumber,
    }),
  };
};

const getCloseSuccessToastConfig = ({
  isPartialClose,
  position,
  t,
  formatPercentWithMinThreshold,
}: {
  isPartialClose: boolean;
  position: Position;
  t: CloseToastTranslation;
  formatPercentWithMinThreshold: FormatPercentWithMinThreshold;
}): CloseToastConfig => {
  const pnlRatio = getPositionPnlRatio(position);
  const formattedPnl =
    pnlRatio !== undefined && !Number.isNaN(pnlRatio)
      ? formatPercentWithMinThreshold(pnlRatio)
      : undefined;

  return {
    key: isPartialClose
      ? PERPS_TOAST_KEYS.PARTIAL_CLOSE_SUCCESS
      : PERPS_TOAST_KEYS.TRADE_SUCCESS,
    ...(formattedPnl
      ? {
          description: t('perpsToastClosePnlSubtitle', [formattedPnl]),
        }
      : {}),
  };
};

const getCloseFailureToastConfig = ({
  error,
  isPartialClose,
  orderType,
  t,
  formatFiat,
}: {
  error: unknown;
  isPartialClose: boolean;
  orderType: OrderType;
  t: CloseToastTranslation;
  formatFiat: FormatPerpsFiat;
}): { errorMessage: string; toast: CloseToastConfig } => {
  const isOrderSizeMinError = isPerpsErrorCode(
    error,
    PERPS_ERROR_CODES.ORDER_SIZE_MIN,
  );

  const errorMessage = isOrderSizeMinError
    ? t('perpsClosePartialMinNotional', [
        formatFiat(PERPS_MIN_MARKET_ORDER_USD),
      ])
    : handlePerpsError(error, t as (key: string) => string);
  const shouldExplainFailure =
    orderType === 'market' && isSlippageFailure(error);

  if (orderType === 'limit') {
    return {
      errorMessage,
      toast: {
        key: isPartialClose
          ? PERPS_TOAST_KEYS.PARTIAL_LIMIT_CLOSE_FAILED
          : PERPS_TOAST_KEYS.LIMIT_CLOSE_FAILED,
        description: t('perpsToastPositionStillActive'),
      },
    };
  }

  if (isPartialClose) {
    return {
      errorMessage,
      toast: {
        key: PERPS_TOAST_KEYS.PARTIAL_CLOSE_FAILED,
        description: shouldExplainFailure
          ? errorMessage
          : t('perpsToastPositionStillActive'),
      },
    };
  }

  return {
    errorMessage,
    toast: {
      key: PERPS_TOAST_KEYS.CLOSE_FAILED,
      description: errorMessage,
    },
  };
};

export type ClosePositionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  position: Position;
  currentPrice: number;
  markPrice?: number | string;
  midPrice?: number;
  sizeDecimals?: number;
  /**
   * The CTA that opened this modal (close vs reduce_exposure) and where it was
   * clicked, surfaced on the position_close PERPS_SCREEN_VIEWED event.
   * Defaults to the plain close CTA on the asset detail screen.
   */
  buttonClicked?: string;
  buttonLocation?: string;
  displayPrice?: string;
  displayChange?: string;
};

export const ClosePositionModal = ({
  isOpen,
  onClose,
  position,
  currentPrice,
  markPrice,
  midPrice,
  sizeDecimals,
  buttonClicked = PERPS_EVENT_VALUE.BUTTON_CLICKED.CLOSE,
  buttonLocation = PERPS_EVENT_VALUE.BUTTON_LOCATION.ASSET_DETAILS,
  displayPrice,
  displayChange,
}: ClosePositionModalProps) => {
  const t = useI18nContext() as CloseToastTranslation;
  const { isEligible } = usePerpsEligibility();
  const { gate } = useSelectedAccountComplianceGate();
  const { buildTrackingData } = usePerpsAttribution();
  const { track } = usePerpsEventTracking();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  // ModalContent binds its document mousedown listener once on mount, so this
  // dismiss handler has to read the ref when the event fires. The support
  // consent dialog is portaled outside this dialog; a click on it would
  // otherwise close the flow before the support tab opens.
  const isSupportConsentOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleSupportConsentOpenChange = useCallback(
    (isConsentOpen: boolean) => {
      isSupportConsentOpenRef.current = isConsentOpen;
    },
    [],
  );

  const handleModalDismiss = useCallback(() => {
    if (isSupportConsentOpenRef.current) {
      return;
    }
    onCloseRef.current();
  }, []);
  const isServiceInterruptionBannerEnabled = useSelector(
    getIsPerpsServiceInterruptionBannerEnabled,
  );
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.POSITION_CLOSE,
      [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
      // Which CTA opened this modal — close vs reduce_exposure.
      [PERPS_EVENT_PROPERTY.BUTTON_CLICKED]: buttonClicked,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]: buttonLocation,
      [PERPS_EVENT_PROPERTY.OUTAGE_BANNER_SHOWN]:
        isServiceInterruptionBannerEnabled,
    },
  });
  const { formatNumber, formatPercentWithMinThreshold } = useFormatters();
  const { replacePerpsToastByKey } = usePerpsToast();
  const notifyPositionAlreadyClosed = usePerpsPositionAlreadyClosed();
  const formatFiat = useCallback(
    (value: number | string) =>
      formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL }),
    [],
  );
  // A figure Core cannot compute yet shows as unavailable, never as $0.
  // Amounts keep the cents Core rounds them to, as the fee row does.
  const formatCloseUsd = useCallback(
    (value: number | undefined) =>
      value === undefined
        ? PERPS_CLOSE_UNAVAILABLE_DISPLAY
        : formatPerpsFiat(value, { ranges: PRICE_RANGES_MINIMAL_VIEW }),
    [],
  );

  const vipTier = useVipTier();

  const [closePercent, setClosePercent] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] =
    useState<OrderType>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const isCloseLimitOrderEnabled = useSelector(
    getIsPerpsCloseLimitOrderEnabled,
  );
  const effectiveOrderType: OrderType = isCloseLimitOrderEnabled
    ? selectedOrderType
    : 'market';

  // Abandon-order tracking state: latest form snapshot, a stable reader for it,
  // and the commit flag that suppresses the event once a close is submitted.
  const latestAbandonPropsRef = useRef<Record<string, Json>>({});
  const getAbandonProperties = useCallback(
    () => latestAbandonPropsRef.current,
    [],
  );
  const hasConfirmedCloseRef = useRef(false);

  // Which control the trader last used to set the close amount. Mirrors mobile:
  // a ref (not state) so recording it never re-renders the form, last-touched
  // wins, and it rides `trackingData` to the controller's close event.
  const inputMethodRef = useRef<InputMethod>('default');

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setClosePercent(100);
      setIsSubmitting(false);
      setError(null);
      setIsGeoBlockModalOpen(false);
      setSelectedOrderType('market');
      setLimitPrice('');
    }
  }

  // Reopening starts a fresh close session: a commit from the previous one
  // must not suppress abandon tracking for this one.
  useEffect(() => {
    if (isOpen) {
      hasConfirmedCloseRef.current = false;
      inputMethodRef.current = 'default';
    }
  }, [isOpen]);

  const [prevIsCloseLimitOrderEnabled, setPrevIsCloseLimitOrderEnabled] =
    useState(isCloseLimitOrderEnabled);
  if (isCloseLimitOrderEnabled !== prevIsCloseLimitOrderEnabled) {
    setPrevIsCloseLimitOrderEnabled(isCloseLimitOrderEnabled);
    if (!isCloseLimitOrderEnabled) {
      setSelectedOrderType('market');
      setLimitPrice('');
    }
  }

  const displayName = getDisplaySymbol(position.symbol);
  const headerDisplayPrice = displayPrice ?? formatFiat(currentPrice);
  const isPartialClose = closePercent < 100;
  const closeFraction = closePercent / 100;
  const positionDirection = getPositionDirection(position.size);
  const isLong = positionDirection === 'long';
  const closeDirection = isLong ? 'short' : 'long';

  const positionSize = useMemo(
    () => Math.abs(parseFloat(position.size)) || 0,
    [position.size],
  );

  const partialCloseSize = useMemo(
    () =>
      getExecutablePartialCloseSize({
        isPartialClose,
        closeSize: positionSize * closeFraction,
        positionSize,
        sizeDecimals,
      }),
    [isPartialClose, positionSize, closeFraction, sizeDecimals],
  );
  const closeSize =
    partialCloseSize === undefined
      ? positionSize
      : Number.parseFloat(partialCloseSize);

  const parsedLimitPrice = useMemo(
    () => parsePositivePrice(limitPrice),
    [limitPrice],
  );

  const validCurrentPrice = useMemo(
    () => parsePositivePrice(currentPrice),
    [currentPrice],
  );

  const referencePrice = useMemo(
    () =>
      getCloseLimitReferencePrice({
        markPrice,
        currentPrice,
        midPrice,
      }),
    [markPrice, currentPrice, midPrice],
  );

  const isLimitPriceOutsideDeviation =
    effectiveOrderType === 'limit' &&
    isCloseLimitPriceOutsideDeviation(parsedLimitPrice, referencePrice);

  const effectivePrice =
    effectiveOrderType === 'limit' && parsedLimitPrice !== null
      ? parsedLimitPrice
      : (validCurrentPrice ?? 0);

  const closeNotionalUsd = useMemo(
    () => getPerpsNotionalUsd({ size: closeSize, price: effectivePrice }),
    [closeSize, effectivePrice],
  );

  // Emit when the modal closes without a confirmed close. Snapshot refreshed
  // after each render so the emit carries the latest size. Written in an effect
  // rather than during render to keep the render body pure.
  useEffect(() => {
    latestAbandonPropsRef.current = {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
      [PERPS_EVENT_PROPERTY.ACTION]: PERPS_EVENT_VALUE.ACTION.ABANDON_ORDER,
      [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
      [PERPS_EVENT_PROPERTY.DIRECTION]:
        getPositionDirection(position.size) === 'long'
          ? PERPS_EVENT_VALUE.DIRECTION.LONG
          : PERPS_EVENT_VALUE.DIRECTION.SHORT,
      [PERPS_EVENT_PROPERTY.ORDER_SIZE]: closeNotionalUsd,
      // Omitted rather than zeroed when leverage is unknown: a real position
      // never has 0x, so a fallback would be indistinguishable from a reading.
      // Matches mobile, which passes `leverage?.value` through undefined.
      ...(position.leverage?.value === undefined
        ? {}
        : { [PERPS_EVENT_PROPERTY.LEVERAGE_USED]: position.leverage.value }),
    };
  }, [
    position.symbol,
    position.size,
    position.leverage?.value,
    closeNotionalUsd,
  ]);
  usePerpsAbandonOrderTracking({
    getAbandonProperties,
    hasCommittedRef: hasConfirmedCloseRef,
    active: isOpen,
  });

  const {
    feeRate,
    protocolFeeRate,
    undiscountedFeeRate,
    metamaskFeeRateDiscountPercentage,
  } = usePerpsOrderFees({
    symbol: position.symbol,
    orderType: effectiveOrderType,
    isMaker: effectiveOrderType === 'limit',
    amount: String(closeNotionalUsd),
  });

  const activeProvider = useSelector(selectPerpsActiveProvider);
  const providerId = getClosePositionProviderId(position, activeProvider);
  // The price the close executes at: the limit price of a limit close, else
  // the live price. Unknown until entered or streamed.
  const closePrice =
    effectiveOrderType === 'limit'
      ? (parsedLimitPrice ?? undefined)
      : (validCurrentPrice ?? undefined);

  const closeEstimate = useMemo(
    () =>
      estimateClosePositionReceive({
        position,
        providerId,
        closeSize,
        price: closePrice,
        feeRate,
      }),
    [position, providerId, closeSize, closePrice, feeRate],
  );

  // The fee before any MetaMask discount, shown struck through beside it.
  const originalFee = useMemo(
    () =>
      estimateClosePositionReceive({
        position,
        providerId,
        closeSize,
        price: closePrice,
        feeRate: undiscountedFeeRate,
      }).fee,
    [position, providerId, closeSize, closePrice, undiscountedFeeRate],
  );

  const isPartialCloseBelowMinNotional = useMemo(() => {
    if (closePercent >= 100) {
      return false;
    }
    // Compare unrounded notional: rounding to cents can lift e.g. $9.995 to $10.00 and wrongly allow submit.
    return closeNotionalUsd < PERPS_MIN_MARKET_ORDER_USD;
  }, [closePercent, closeNotionalUsd]);

  // Rows show Core's figures at the cents Core rounds them to, so margin with
  // PnL minus the fee adds up to Core's receive.
  const roundedMarginWithPnl = getCloseMarginWithPnl(closeEstimate);
  const roundedFees = roundCloseUsd(closeEstimate.fee);
  const roundedOriginalFees = roundCloseUsd(originalFee);
  const youWillReceive = closeEstimate.receive;
  const closePnl = closeEstimate.realizedPnl;

  const formError = useMemo(() => {
    if (
      effectiveOrderType === 'market' &&
      (validCurrentPrice === null || referencePrice === null)
    ) {
      return t('perpsClosePriceUnavailable');
    }
    if (effectiveOrderType === 'limit' && parsedLimitPrice === null) {
      return t('perpsCloseLimitPriceRequired');
    }
    if (effectiveOrderType === 'limit' && referencePrice === null) {
      return t('perpsClosePriceUnavailable');
    }
    if (isLimitPriceOutsideDeviation) {
      return t('perpsCloseLimitPriceOutsideOracleBand');
    }
    if (youWillReceive !== undefined && youWillReceive < 0) {
      return t('perpsInsufficientMargin');
    }
    return null;
  }, [
    effectiveOrderType,
    validCurrentPrice,
    referencePrice,
    parsedLimitPrice,
    isLimitPriceOutsideDeviation,
    youWillReceive,
    t,
  ]);

  // The close waits for its fee quote: the fee is reported with the close and
  // is never assumed to be 0.
  const closeFee = closeEstimate.fee;
  const isSubmitDisabled =
    formError !== null ||
    closePercent <= 0 ||
    isSubmitting ||
    closeSize <= 0 ||
    isPartialCloseBelowMinNotional ||
    closeFee === undefined;

  const handleClose = useCallback(async () => {
    if (isSubmitDisabled || closeFee === undefined) {
      return;
    }
    const totalFee = closeFee;
    if (
      effectiveOrderType === 'limit' &&
      (parsedLimitPrice === null ||
        isCloseLimitPriceOutsideDeviation(parsedLimitPrice, referencePrice))
    ) {
      setError(
        parsedLimitPrice === null
          ? t('perpsCloseLimitPriceRequired')
          : t('perpsCloseLimitPriceOutsideOracleBand'),
      );
      return;
    }
    await gate(async () => {
      if (!isEligible) {
        setIsGeoBlockModalOpen(true);
        return;
      }

      setIsSubmitting(true);
      setError(null);
      // The user committed: closing the modal after this is not an abandonment.
      hasConfirmedCloseRef.current = true;

      const orderDescription = getPartialCloseDescription({
        positionSize: position.size,
        closeSize,
        displayName,
        t,
        formatNumber,
      });
      replacePerpsToastByKey(
        effectiveOrderType === 'limit'
          ? {
              key: PERPS_TOAST_KEYS.ORDER_SUBMITTED,
              description: orderDescription,
            }
          : getCloseInProgressToastConfig({
              isPartialClose,
              positionSize: position.size,
              closeSize,
              displayName,
              t,
              formatNumber,
            }),
      );

      try {
        onClose();
        const closeRequestParams = buildCloseRequestParams({
          symbol: position.symbol,
          currentPrice,
          size: partialCloseSize,
          orderType: effectiveOrderType,
          limitPrice:
            effectiveOrderType === 'limit'
              ? limitPrice.replaceAll(/[$,]/gu, '')
              : undefined,
          position,
        });
        closeRequestParams.trackingData = buildTrackingData({
          totalFee,
          marketPrice: currentPrice,
          vipTier,
          vipDiscount: metamaskFeeRateDiscountPercentage,
          hlFeeRate: protocolFeeRate,
          inputMethod: inputMethodRef.current,
          ...(effectiveOrderType === 'market'
            ? {
                maxSlippageBps: closeRequestParams.maxSlippageBps,
                maxSlippageSource:
                  PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.DEFAULT,
              }
            : {}),
        });
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsClosePosition',
          [closeRequestParams],
        );
        if (
          !result.success &&
          isPerpsErrorCode(result, PERPS_ERROR_CODES.POSITION_NOT_FOUND)
        ) {
          // The position closed after this modal rendered. Say so and drop it
          // from the view instead of reporting a failed close.
          notifyPositionAlreadyClosed();
          return;
        }
        if (!result.success) {
          const failure: PerpsErrorInput = {
            error: result.error || 'Failed to close position',
            errorCode: result.errorCode,
            errorDetails: result.errorDetails,
            maxSlippageBps: closeRequestParams.maxSlippageBps,
          };
          const { errorMessage, toast } = getCloseFailureToastConfig({
            error: failure,
            isPartialClose,
            orderType: effectiveOrderType,
            t,
            formatFiat,
          });
          setError(errorMessage);
          // Error is DISPLAYED — emit the error screen view.
          trackPerpsErrorScreenViewed(
            track,
            PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
            PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_MARKET_DETAILS,
          );
          replacePerpsToastByKey(toast);
          return;
        }
        replacePerpsToastByKey(
          effectiveOrderType === 'limit'
            ? {
                key: PERPS_TOAST_KEYS.ORDER_PLACED,
                description: orderDescription,
              }
            : getCloseSuccessToastConfig({
                isPartialClose,
                position,
                t,
                formatPercentWithMinThreshold,
              }),
        );
      } catch (err) {
        // Transport/background throws never reach the controller close
        // submitted/terminal pipeline — keep client PerpsError for that gap.
        const raw =
          err instanceof Error ? err.message : t('somethingWentWrong');
        track(MetaMetricsEventName.PerpsError, {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]:
            PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: raw,
        });
        trackPerpsErrorScreenViewed(
          track,
          PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
          PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_MARKET_DETAILS,
        );
        const failure = err instanceof Error ? err : new Error(raw);
        if (effectiveOrderType === 'market') {
          Object.assign(failure, {
            maxSlippageBps: ORDER_SLIPPAGE_CONFIG.DefaultMarketSlippageBps,
          });
        }
        const { errorMessage, toast } = getCloseFailureToastConfig({
          error: failure,
          isPartialClose,
          orderType: effectiveOrderType,
          t,
          formatFiat,
        });
        setError(errorMessage);
        replacePerpsToastByKey(toast);
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [
    isSubmitDisabled,
    effectiveOrderType,
    parsedLimitPrice,
    referencePrice,
    gate,
    isEligible,
    replacePerpsToastByKey,
    notifyPositionAlreadyClosed,
    isPartialClose,
    position,
    closeSize,
    partialCloseSize,
    displayName,
    t,
    formatNumber,
    currentPrice,
    limitPrice,
    closeFee,
    protocolFeeRate,
    buildTrackingData,
    onClose,
    formatPercentWithMinThreshold,
    formatFiat,
    vipTier,
    metamaskFeeRateDiscountPercentage,
    track,
  ]);

  const handlePercentChange = useCallback((percent: number) => {
    setClosePercent(percent);
    setError(null);
  }, []);

  const handleInputMethodChange = useCallback((inputMethod: InputMethod) => {
    inputMethodRef.current = inputMethod;
  }, []);

  const handleOrderTypeChange = useCallback(
    (orderType: OrderType) => {
      setSelectedOrderType(orderType);
      setError(null);
      if (orderType === 'market') {
        setLimitPrice('');
      }
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.ORDER_TYPE_SELECTED,
        [PERPS_EVENT_PROPERTY.SELECTED_ORDER_TYPE]: orderType,
        [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
      });
    },
    [position.symbol, track],
  );

  const handleLimitPriceChange = useCallback((price: string) => {
    setLimitPrice(price);
    setError(null);
  }, []);

  const isEmptyLimitPrice =
    effectiveOrderType === 'limit' && limitPrice.trim() === '';
  const visibleFormError = isEmptyLimitPrice ? null : formError;
  const visibleError = visibleFormError ?? error;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalDismiss}
        data-testid="perps-close-position-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <PerpsServiceInterruptionBanner
            onSupportConsentOpenChange={handleSupportConsentOpenChange}
          />
          <OrderEntryHeader
            displayName={displayName}
            displayPrice={headerDisplayPrice}
            displayChange={displayChange}
            onBack={onClose}
            testIdPrefix="perps-close-position"
          />
          <ModalBody>
            <Box flexDirection={BoxFlexDirection.Column} gap={4}>
              {isCloseLimitOrderEnabled ? (
                <OrderTypeToggle
                  orderType={effectiveOrderType}
                  onOrderTypeChange={handleOrderTypeChange}
                />
              ) : null}

              {effectiveOrderType === 'limit' ? (
                <LimitPriceInput
                  limitPrice={limitPrice}
                  onLimitPriceChange={handleLimitPriceChange}
                  currentPrice={currentPrice}
                  midPrice={midPrice}
                  direction={closeDirection}
                  autoFocus
                />
              ) : null}

              {/* Close Amount Section (input + slider) */}
              <CloseAmountSection
                positionSize={position.size}
                closePercent={closePercent}
                onClosePercentChange={handlePercentChange}
                asset={displayName}
                currentPrice={effectivePrice}
                sizeDecimals={sizeDecimals}
                onInputMethodChange={handleInputMethodChange}
              />

              {isPartialCloseBelowMinNotional ? (
                <Box
                  backgroundColor={BoxBackgroundColor.WarningMuted}
                  className="rounded-lg"
                  padding={3}
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={2}
                >
                  <Icon
                    name={IconName.Warning}
                    size={IconSize.Md}
                    color={IconColor.WarningDefault}
                    className="shrink-0"
                  />
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.WarningDefault}
                  >
                    {t('perpsClosePartialMinNotional', [
                      formatFiat(PERPS_MIN_MARKET_ORDER_USD),
                    ])}
                  </Text>
                </Box>
              ) : null}

              {/* Summary rows */}
              <Box flexDirection={BoxFlexDirection.Column} gap={2}>
                {/* Margin */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Start}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsMargin')}
                  </Text>
                  <Box
                    flexDirection={BoxFlexDirection.Column}
                    alignItems={BoxAlignItems.End}
                  >
                    <Text
                      variant={TextVariant.BodySm}
                      fontWeight={FontWeight.Medium}
                      textAlign={TextAlign.Right}
                      data-testid="perps-close-summary-margin-value"
                    >
                      {formatCloseUsd(roundedMarginWithPnl)}
                    </Text>
                    {closePnl === undefined ? null : (
                      <Text
                        variant={TextVariant.BodyXs}
                        color={TextColor.TextAlternative}
                        textAlign={TextAlign.Right}
                      >
                        {t('perpsIncludesPnl', [
                          <Text
                            key="perps-close-margin-pnl"
                            variant={TextVariant.BodyXs}
                            color={
                              closePnl >= 0
                                ? TextColor.SuccessDefault
                                : TextColor.ErrorDefault
                            }
                            asChild
                          >
                            <span data-testid="perps-close-summary-pnl-value">
                              {formatPnl(closePnl)}
                            </span>
                          </Text>,
                        ])}
                      </Text>
                    )}
                  </Box>
                </Box>

                {/* Fees */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsFees')}
                  </Text>
                  <PerpsFeesDisplay
                    metamaskFeeRateDiscountPercentage={
                      feeRate === undefined
                        ? undefined
                        : metamaskFeeRateDiscountPercentage
                    }
                    originalFee={roundedOriginalFees}
                    fee={roundedFees}
                    placeholder={PERPS_CLOSE_UNAVAILABLE_DISPLAY}
                    feeTextFontWeight={FontWeight.Medium}
                    feeTextTestId="perps-close-summary-fees-value"
                  />
                </Box>

                {/* You'll receive */}
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  justifyContent={BoxJustifyContent.Between}
                  alignItems={BoxAlignItems.Center}
                >
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {t('perpsYouWillReceive')}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    data-testid="perps-close-summary-receive-value"
                  >
                    {formatCloseUsd(youWillReceive)}
                  </Text>
                </Box>
              </Box>

              {/* Error */}
              {visibleError && (
                <Box
                  backgroundColor={BoxBackgroundColor.ErrorMuted}
                  className="rounded-lg"
                  padding={3}
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={2}
                >
                  <Icon
                    name={IconName.Warning}
                    size={IconSize.Sm}
                    color={IconColor.ErrorDefault}
                  />
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.ErrorDefault}
                  >
                    {visibleError}
                  </Text>
                </Box>
              )}
            </Box>
          </ModalBody>
          <ModalFooter
            onSubmit={handleClose}
            submitButtonProps={{
              'data-testid': 'perps-close-position-modal-submit',
              children: t('perpsClosePosition'),
              disabled: isSubmitDisabled,
              autoFocus: true,
            }}
          />
        </ModalContent>
      </Modal>
      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={() => setIsGeoBlockModalOpen(false)}
      />
    </>
  );
};
