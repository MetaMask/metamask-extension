import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  getDisplayName,
  getPositionDirection,
  getPositionPnlRatio,
} from '../utils';
import { handlePerpsError } from '../utils/translate-perps-error';
import { PERPS_MIN_MARKET_ORDER_USD } from '../constants';
import { usePerpsOrderFees } from '../../../../hooks/perps/usePerpsOrderFees';
import { CloseAmountSection } from '../order-entry';
import {
  PERPS_TOAST_KEYS,
  usePerpsToast,
  type PerpsToastKeyConfig,
} from '../perps-toast';
import { PerpsGeoBlockModal } from '../perps-geo-block-modal';
import type { Position } from '../types';

type ClosePositionParams = {
  symbol: string;
  orderType: 'market';
  currentPrice: number;
  size?: string;
};

type CloseToastConfig = Pick<PerpsToastKeyConfig, 'key' | 'description'>;

type CloseToastTranslation = (key: string, vars?: unknown[]) => string;

type FormatNumber = (
  value: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) => string;

type FormatCurrencyWithMinThreshold = (
  value: number,
  currency: string,
) => string;

type FormatPercentWithMinThreshold = (value: number) => string | undefined;

const buildCloseRequestParams = ({
  symbol,
  currentPrice,
  isPartialClose,
  closeSize,
}: {
  symbol: string;
  currentPrice: number;
  isPartialClose: boolean;
  closeSize: number;
}): ClosePositionParams => {
  if (!isPartialClose) {
    return {
      symbol,
      orderType: 'market',
      currentPrice,
    };
  }

  return {
    symbol,
    orderType: 'market',
    currentPrice,
    size: closeSize.toString(),
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
  t,
  formatCurrencyWithMinThreshold,
}: {
  error: unknown;
  isPartialClose: boolean;
  t: CloseToastTranslation;
  formatCurrencyWithMinThreshold: FormatCurrencyWithMinThreshold;
}): { errorMessage: string; toast: CloseToastConfig } => {
  const isOrderSizeMinError =
    error instanceof Error && error.message === 'ORDER_SIZE_MIN';

  const errorMessage = isOrderSizeMinError
    ? t('perpsClosePartialMinNotional', [
        formatCurrencyWithMinThreshold(PERPS_MIN_MARKET_ORDER_USD, 'USD'),
      ])
    : handlePerpsError(error, t as (key: string) => string);

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
};

export const ClosePositionModal: React.FC<ClosePositionModalProps> = ({
  isOpen,
  onClose,
  position,
  currentPrice,
}) => {
  const t = useI18nContext() as CloseToastTranslation;
  const { isEligible } = usePerpsEligibility();
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
  const {
    formatCurrencyWithMinThreshold,
    formatNumber,
    formatPercentWithMinThreshold,
  } = useFormatters();
  const { replacePerpsToastByKey } = usePerpsToast();

  const [closePercent, setClosePercent] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setClosePercent(100);
      setIsSubmitting(false);
      setError(null);
      setIsGeoBlockModalOpen(false);
    }
  }, [isOpen]);

  const displayName = getDisplayName(position.symbol);
  const isPartialClose = closePercent < 100;

  const positionSize = useMemo(
    () => Math.abs(parseFloat(position.size)) || 0,
    [position.size],
  );

  const closeSize = useMemo(
    () => (positionSize * closePercent) / 100,
    [positionSize, closePercent],
  );

  const closeNotionalUsd = useMemo(
    () => closeSize * currentPrice,
    [closeSize, currentPrice],
  );

  const { feeRate } = usePerpsOrderFees({
    symbol: position.symbol,
    orderType: 'market',
  });

  const margin = useMemo(() => {
    const totalMargin = parseFloat(position.marginUsed) || 0;
    return (totalMargin * closePercent) / 100;
  }, [position.marginUsed, closePercent]);

  const unrealizedPnl = useMemo(() => {
    const pnl = parseFloat(position.unrealizedPnl) || 0;
    return (pnl * closePercent) / 100;
  }, [position.unrealizedPnl, closePercent]);

  const estimatedFees = useMemo(
    () => closeNotionalUsd * (feeRate ?? 0),
    [closeNotionalUsd, feeRate],
  );

  const isPriceValid = useMemo(
    () => Number.isFinite(currentPrice) && currentPrice > 0,
    [currentPrice],
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

  // HyperLiquid's marginUsed already includes accumulated PnL, so we do NOT
  // add unrealizedPnl separately (that would double-count).
  const youWillReceive = useMemo(
    () => roundedMargin - roundedFees,
    [roundedMargin, roundedFees],
  );

  const isSubmitDisabled =
    !isPriceValid ||
    closePercent <= 0 ||
    isSubmitting ||
    closeSize <= 0 ||
    isPartialCloseBelowMinNotional;

  const handleClose = useCallback(async () => {
    if (isSubmitDisabled) {
      return;
    }
    if (!isEligible) {
      setIsGeoBlockModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    replacePerpsToastByKey(
      getCloseInProgressToastConfig({
        isPartialClose,
        positionSize: position.size,
        closeSize,
        displayName,
        t,
        formatNumber,
      }),
    );

    try {
      const result = await submitRequestToBackground<{
        success: boolean;
        error?: string;
      }>('perpsClosePosition', [
        buildCloseRequestParams({
          symbol: position.symbol,
          currentPrice,
          isPartialClose,
          closeSize,
        }),
      ]);
      if (!result.success) {
        const message = result.error || 'Failed to close position';
        track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
          [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
          [PERPS_EVENT_PROPERTY.FAILURE_REASON]: message,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: message,
          [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
          [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(estimatedFees),
        });
        track(MetaMetricsEventName.PerpsError, {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]:
            PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: message,
        });
        const { errorMessage, toast } = getCloseFailureToastConfig({
          error: new Error(message),
          isPartialClose,
          t,
          formatCurrencyWithMinThreshold,
        });
        setError(errorMessage);
        replacePerpsToastByKey(toast);
        return;
      }
      track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
        [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
        [PERPS_EVENT_PROPERTY.PERCENTAGE_CLOSED]: closePercent,
        [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
        [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(estimatedFees),
      });
      replacePerpsToastByKey(
        getCloseSuccessToastConfig({
          isPartialClose,
          position,
          t,
          formatPercentWithMinThreshold,
        }),
      );
      onClose();
    } catch (err) {
      const errMessage =
        err instanceof Error ? err.message : 'An unknown error occurred';
      track(MetaMetricsEventName.PerpsPositionCloseTransaction, {
        [PERPS_EVENT_PROPERTY.ASSET]: position.symbol,
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
        [PERPS_EVENT_PROPERTY.FAILURE_REASON]: errMessage,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errMessage,
        [PERPS_EVENT_PROPERTY.SIZE]: String(closeNotionalUsd),
        [PERPS_EVENT_PROPERTY.METAMASK_FEE]: String(estimatedFees),
      });
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errMessage,
      });

      const { errorMessage, toast } = getCloseFailureToastConfig({
        error: err,
        isPartialClose,
        t,
        formatCurrencyWithMinThreshold,
      });
      setError(errorMessage);
      replacePerpsToastByKey(toast);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitDisabled,
    isEligible,
    replacePerpsToastByKey,
    isPartialClose,
    position,
    closeSize,
    displayName,
    t,
    formatNumber,
    currentPrice,
    closeNotionalUsd,
    estimatedFees,
    track,
    closePercent,
    onClose,
    formatPercentWithMinThreshold,
    formatCurrencyWithMinThreshold,
  ]);

  const handlePercentChange = useCallback((percent: number) => {
    setClosePercent(percent);
    setError(null);
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        data-testid="perps-close-position-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <ModalHeader onClose={onClose}>{t('perpsClosePosition')}</ModalHeader>
          <ModalBody>
            <Box flexDirection={BoxFlexDirection.Column} gap={4}>
              {/* Close Amount Section (input + slider) */}
              <CloseAmountSection
                positionSize={position.size}
                closePercent={closePercent}
                onClosePercentChange={handlePercentChange}
                asset={displayName}
                currentPrice={currentPrice}
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
                    size={IconSize.Sm}
                    color={IconColor.WarningDefault}
                  />
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.WarningDefault}
                  >
                    {t('perpsClosePartialMinNotional', [
                      formatCurrencyWithMinThreshold(
                        PERPS_MIN_MARKET_ORDER_USD,
                        'USD',
                      ),
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
                      {formatCurrencyWithMinThreshold(roundedMargin, 'USD')}
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
                            unrealizedPnl >= 0
                              ? TextColor.SuccessDefault
                              : TextColor.ErrorDefault
                          }
                          asChild
                        >
                          <span>
                            {`${unrealizedPnl >= 0 ? '+' : '-'}${formatCurrencyWithMinThreshold(
                              Math.abs(unrealizedPnl),
                              'USD',
                            )}`}
                          </span>
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
                  <Text
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Medium}
                    data-testid="perps-close-summary-fees-value"
                  >
                    -{formatCurrencyWithMinThreshold(roundedFees, 'USD')}
                  </Text>
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
                    {formatCurrencyWithMinThreshold(
                      Math.max(youWillReceive, 0),
                      'USD',
                    )}
                  </Text>
                </Box>
              </Box>

              {/* Error */}
              {error && (
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
                    {error}
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
