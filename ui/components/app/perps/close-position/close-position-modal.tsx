import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
import type {
  ClosePositionParams,
  OrderType,
} from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  formatPnl,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import {
  Modal,
  ModalContent,
  ModalHeader,
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
import {
  getDisplaySymbol,
  getPositionDirection,
  getPositionPnlRatio,
  buildPerpsVipTrackingData,
} from '../utils';
import { handlePerpsError } from '../utils/translate-perps-error';
import { PERPS_MIN_MARKET_ORDER_USD } from '../constants';
import { usePerpsOrderFees } from '../../../../hooks/perps/usePerpsOrderFees';
import { PerpsFeesDisplay } from '../perps-fees-display';
import {
  CloseAmountSection,
  LimitPriceInput,
  OrderTypeToggle,
} from '../order-entry';
import {
  PERPS_TOAST_KEYS,
  usePerpsToast,
  type PerpsToastKeyConfig,
} from '../perps-toast';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import { useSelectedAccountComplianceGate } from '../../compliance';
import type { Position } from '../types';
import { useVipTier } from '../../../../hooks/rewards/useVipTier';
import { getIsPerpsCloseLimitOrderEnabled } from '../../../../selectors/perps/feature-flags';
import {
  getCloseLimitReferencePrice,
  isCloseLimitPriceOutsideDeviation,
  parsePositivePrice,
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

const buildCloseRequestParams = ({
  symbol,
  currentPrice,
  isPartialClose,
  closeSize,
  sizeDecimals,
  orderType,
  limitPrice,
  position,
}: {
  symbol: string;
  currentPrice: number;
  isPartialClose: boolean;
  closeSize: number;
  sizeDecimals?: number;
  orderType: OrderType;
  limitPrice?: string;
  position: Position;
}): ClosePositionParams => {
  const size =
    sizeDecimals === undefined
      ? closeSize.toString()
      : closeSize.toFixed(sizeDecimals);

  if (orderType === 'limit') {
    return {
      symbol,
      orderType: 'limit',
      price: limitPrice,
      ...(isPartialClose ? { size } : {}),
      position,
    };
  }

  return {
    symbol,
    orderType: 'market',
    currentPrice,
    ...(isPartialClose ? { size } : {}),
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
  const isOrderSizeMinError =
    error instanceof Error && error.message === 'ORDER_SIZE_MIN';

  const errorMessage = isOrderSizeMinError
    ? t('perpsClosePartialMinNotional', [
        formatFiat(PERPS_MIN_MARKET_ORDER_USD),
      ])
    : handlePerpsError(error, t as (key: string) => string);

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
        description: t('perpsToastPositionStillActive'),
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
};

export const ClosePositionModal = ({
  isOpen,
  onClose,
  position,
  currentPrice,
  markPrice,
  midPrice,
  sizeDecimals,
}: ClosePositionModalProps) => {
  const t = useI18nContext() as CloseToastTranslation;
  const { isEligible } = usePerpsEligibility();
  const { gate } = useSelectedAccountComplianceGate();
  const { track } = usePerpsEventTracking();
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  usePerpsEventTracking({
    eventName: MetaMetricsEventName.PerpsScreenViewed,
    conditions: isOpen,
    properties: {
      [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
        PERPS_EVENT_VALUE.SCREEN_TYPE.POSITION_CLOSE,
      [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
      [PERPS_EVENT_PROPERTY.SOURCE]: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
    },
  });
  const { formatNumber, formatPercentWithMinThreshold } = useFormatters();
  const { replacePerpsToastByKey } = usePerpsToast();
  const formatFiat = useCallback(
    (value: number | string) =>
      formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL }),
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

  useEffect(() => {
    if (isOpen) {
      setClosePercent(100);
      setIsSubmitting(false);
      setError(null);
      setIsGeoBlockModalOpen(false);
      setSelectedOrderType('market');
      setLimitPrice('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isCloseLimitOrderEnabled) {
      setSelectedOrderType('market');
      setLimitPrice('');
    }
  }, [isCloseLimitOrderEnabled]);

  const displayName = getDisplaySymbol(position.symbol);
  const isPartialClose = closePercent < 100;
  const closeFraction = closePercent / 100;
  const positionDirection = getPositionDirection(position.size);
  const isLong = positionDirection === 'long';
  const closeDirection = isLong ? 'short' : 'long';

  const positionSize = useMemo(
    () => Math.abs(parseFloat(position.size)) || 0,
    [position.size],
  );

  const closeSize = useMemo(
    () => positionSize * closeFraction,
    [positionSize, closeFraction],
  );

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
    () => closeSize * effectivePrice,
    [closeSize, effectivePrice],
  );

  const { feeRate, undiscountedFeeRate, metamaskFeeRateDiscountPercentage } =
    usePerpsOrderFees({
      symbol: position.symbol,
      orderType: effectiveOrderType,
      amount: closeNotionalUsd.toString(),
      isMaker: effectiveOrderType === 'limit',
    });

  const liveUnrealizedPnl = useMemo(
    () => Number.parseFloat(position.unrealizedPnl) || 0,
    [position.unrealizedPnl],
  );

  const effectiveTotalPnl = useMemo(() => {
    if (effectiveOrderType === 'market') {
      return liveUnrealizedPnl;
    }

    const entryPrice = parsePositivePrice(position.entryPrice);
    if (entryPrice === null || parsedLimitPrice === null) {
      return liveUnrealizedPnl;
    }

    return isLong
      ? (parsedLimitPrice - entryPrice) * positionSize
      : (entryPrice - parsedLimitPrice) * positionSize;
  }, [
    effectiveOrderType,
    liveUnrealizedPnl,
    position.entryPrice,
    parsedLimitPrice,
    isLong,
    positionSize,
  ]);

  const effectivePnl = useMemo(
    () => effectiveTotalPnl * closeFraction,
    [effectiveTotalPnl, closeFraction],
  );

  const margin = useMemo(() => {
    const marginUsed = Number.parseFloat(position.marginUsed) || 0;
    const effectiveMargin = marginUsed - liveUnrealizedPnl + effectiveTotalPnl;
    return effectiveMargin * closeFraction;
  }, [
    position.marginUsed,
    liveUnrealizedPnl,
    effectiveTotalPnl,
    closeFraction,
  ]);

  const estimatedFees = useMemo(
    () => closeNotionalUsd * (feeRate ?? 0),
    [closeNotionalUsd, feeRate],
  );

  const originalEstimatedFees = useMemo(
    () => closeNotionalUsd * (undiscountedFeeRate ?? 0),
    [closeNotionalUsd, undiscountedFeeRate],
  );

  const isPartialCloseBelowMinNotional = useMemo(() => {
    if (closePercent >= 100) {
      return false;
    }
    // Compare unrounded notional: rounding to cents can lift e.g. $9.995 to $10.00 and wrongly allow submit.
    return closeNotionalUsd < PERPS_MIN_MARKET_ORDER_USD;
  }, [closePercent, closeNotionalUsd]);

  // Pre-round margin and fees to cents so the same values flow into both
  // the display rows and the "You'll receive" arithmetic, avoiding any
  // divergence between Math.round and Intl.NumberFormat rounding modes.
  const roundedMargin = useMemo(() => Math.round(margin * 100) / 100, [margin]);

  const roundedFees = useMemo(
    () => Math.round(estimatedFees * 100) / 100,
    [estimatedFees],
  );

  const roundedOriginalFees = useMemo(
    () => Math.round(originalEstimatedFees * 100) / 100,
    [originalEstimatedFees],
  );

  const youWillReceive = useMemo(
    () => roundedMargin - roundedFees,
    [roundedMargin, roundedFees],
  );

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
    if (isLimitPriceOutsideDeviation) {
      return t('perpsCloseLimitPriceOutsideOracleBand');
    }
    if (youWillReceive < 0) {
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

  const isSubmitDisabled =
    formError !== null ||
    closePercent <= 0 ||
    isSubmitting ||
    closeSize <= 0 ||
    isPartialCloseBelowMinNotional;

  const handleClose = useCallback(async () => {
    if (isSubmitDisabled) {
      return;
    }
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
          isPartialClose,
          closeSize,
          sizeDecimals,
          orderType: effectiveOrderType,
          limitPrice:
            effectiveOrderType === 'limit'
              ? limitPrice.replaceAll(/[$,]/gu, '')
              : undefined,
          position,
        });
        closeRequestParams.trackingData = buildPerpsVipTrackingData({
          totalFee: estimatedFees,
          marketPrice: currentPrice,
          vipTier,
          vipDiscount: metamaskFeeRateDiscountPercentage,
        });
        const result = await submitRequestToBackground<{
          success: boolean;
          error?: string;
        }>('perpsClosePosition', [closeRequestParams]);
        if (!result.success) {
          const message = result.error || 'Failed to close position';
          track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
            [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
            [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
            [PERPS_EVENT_PROPERTY.FAILURE_REASON]: message,
            [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: message,
            [PERPS_EVENT_PROPERTY.ORDER_TYPE]: effectiveOrderType,
            ...(effectiveOrderType === 'limit'
              ? { [PERPS_EVENT_PROPERTY.LIMIT_PRICE]: parsedLimitPrice }
              : {}),
            [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
            [PERPS_EVENT_PROPERTY.FEES]: String(estimatedFees),
            [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(estimatedFees),
            [PERPS_EVENT_PROPERTY.PNL_DOLLAR]: String(effectivePnl),
            [PERPS_EVENT_PROPERTY.RECEIVED_AMOUNT]: String(youWillReceive),
          });
          track(MetaMetricsEventName.PerpsError, {
            [PERPS_EVENT_PROPERTY.ERROR_TYPE]:
              PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
            [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: message,
          });
          const { errorMessage, toast } = getCloseFailureToastConfig({
            error: new Error(message),
            isPartialClose,
            orderType: effectiveOrderType,
            t,
            formatFiat,
          });
          setError(errorMessage);
          replacePerpsToastByKey(toast);
          return;
        }
        track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
          [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
          [PERPS_EVENT_PROPERTY.ORDER_TYPE]: effectiveOrderType,
          ...(effectiveOrderType === 'limit'
            ? { [PERPS_EVENT_PROPERTY.LIMIT_PRICE]: parsedLimitPrice }
            : {}),
          [PERPS_EVENT_PROPERTY.PERCENTAGE_CLOSED]: closePercent,
          [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
          [PERPS_EVENT_PROPERTY.FEES]: String(estimatedFees),
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(estimatedFees),
          [PERPS_EVENT_PROPERTY.PNL_DOLLAR]: String(effectivePnl),
          [PERPS_EVENT_PROPERTY.RECEIVED_AMOUNT]: String(youWillReceive),
        });
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
        const errMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';
        track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
          [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
          [PERPS_EVENT_PROPERTY.FAILURE_REASON]: errMessage,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errMessage,
          [PERPS_EVENT_PROPERTY.ORDER_TYPE]: effectiveOrderType,
          ...(effectiveOrderType === 'limit'
            ? { [PERPS_EVENT_PROPERTY.LIMIT_PRICE]: parsedLimitPrice }
            : {}),
          [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
          [PERPS_EVENT_PROPERTY.FEES]: String(estimatedFees),
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(estimatedFees),
          [PERPS_EVENT_PROPERTY.PNL_DOLLAR]: String(effectivePnl),
          [PERPS_EVENT_PROPERTY.RECEIVED_AMOUNT]: String(youWillReceive),
        });
        track(MetaMetricsEventName.PerpsError, {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]:
            PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errMessage,
        });

        const { errorMessage, toast } = getCloseFailureToastConfig({
          error: err,
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
    isPartialClose,
    position,
    closeSize,
    displayName,
    t,
    formatNumber,
    currentPrice,
    sizeDecimals,
    limitPrice,
    closeNotionalUsd,
    estimatedFees,
    effectivePnl,
    youWillReceive,
    track,
    closePercent,
    onClose,
    formatPercentWithMinThreshold,
    formatFiat,
    vipTier,
    metamaskFeeRateDiscountPercentage,
  ]);

  const handlePercentChange = useCallback((percent: number) => {
    setClosePercent(percent);
    setError(null);
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

  const visibleError = formError ?? error;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        data-testid="perps-close-position-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <ModalHeader onClose={onClose}>
            <Box
              flexDirection={BoxFlexDirection.Column}
              alignItems={BoxAlignItems.Center}
              gap={2}
            >
              <Icon name={IconName.CircleX} size={IconSize.Xl} />
              <Text
                variant={TextVariant.HeadingSm}
                textAlign={TextAlign.Center}
              >
                {t('perpsClosePosition')}
              </Text>
            </Box>
          </ModalHeader>
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
                  liquidationPrice={parsePositivePrice(
                    position.liquidationPrice,
                  )}
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
                      {formatFiat(roundedMargin)}
                    </Text>
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
                            effectivePnl >= 0
                              ? TextColor.SuccessDefault
                              : TextColor.ErrorDefault
                          }
                          asChild
                        >
                          <span>{formatPnl(effectivePnl)}</span>
                        </Text>,
                      ])}
                    </Text>
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
                    {formatFiat(youWillReceive)}
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
