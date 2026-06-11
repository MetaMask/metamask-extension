import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
} from '@metamask/design-system-react';
import type { FeeCalculationResult } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import { PERPS_FALLBACK_FEE_RATES } from '../../../../../shared/constants/perps';
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
import { submitRequestToBackground } from '../../../../store/background-connection';
import { usePerpsMetamaskFeeDiscountBips } from '../../../../hooks/perps/usePerpsMetamaskFeeDiscountBips';
import {
  BASIS_POINTS_DIVISOR,
  ORIGINAL_METAMASK_FEE_BIPS,
} from '../../../../hooks/perps/usePerpsOrderFees';
import type { Position } from '../types';

export type CloseAllPositionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  positions: Position[];
  isSubmitting: boolean;
};

export const CloseAllPositionsModal: React.FC<CloseAllPositionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  positions,
  isSubmitting,
}) => {
  const t = useI18nContext();

  const formatFiat = useCallback(
    (value: number | string) =>
      formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL }),
    [],
  );

  const totalMargin = useMemo(
    () =>
      positions.reduce(
        (sum, pos) => sum + (Number.parseFloat(pos.marginUsed) || 0),
        0,
      ),
    [positions],
  );

  const totalUnrealizedPnl = useMemo(
    () =>
      positions.reduce(
        (sum, pos) => sum + (Number.parseFloat(pos.unrealizedPnl) || 0),
        0,
      ),
    [positions],
  );

  // Build a stable, JSON-serialisable key from position symbols + notionals
  // so the fee-fetching effect only re-fires when actual data changes, not on
  // every streaming array reference swap.
  const symbolNotionalPairs = useMemo(() => {
    const map = new Map<string, number>();
    for (const pos of positions) {
      const notional = Math.abs(Number.parseFloat(pos.positionValue) || 0);
      map.set(pos.symbol, (map.get(pos.symbol) ?? 0) + notional);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [positions]);

  const symbolNotionalKey = useMemo(
    () => JSON.stringify(symbolNotionalPairs),
    [symbolNotionalPairs],
  );

  const [rawProtocolFees, setRawProtocolFees] = useState(0);
  const [rawMetamaskFees, setRawMetamaskFees] = useState(0);
  const [isLoadingFees, setIsLoadingFees] = useState(positions.length > 0);
  const feeRequestId = useRef(0);

  const metamaskFeeDiscountBips = usePerpsMetamaskFeeDiscountBips(
    ORIGINAL_METAMASK_FEE_BIPS,
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let cancelled = false;

    setRawProtocolFees(0);
    setRawMetamaskFees(0);

    const entries: [string, number][] = JSON.parse(symbolNotionalKey);

    feeRequestId.current += 1;
    const currentId = feeRequestId.current;

    if (entries.length === 0) {
      setIsLoadingFees(false);
      return undefined;
    }

    setIsLoadingFees(true);

    Promise.all(
      entries.map(([symbol, notional]) =>
        submitRequestToBackground<FeeCalculationResult>('perpsCalculateFees', [
          { orderType: 'market' as const, isMaker: false, symbol },
        ])
          .then((result) => ({
            protocolFee:
              notional *
              (result?.protocolFeeRate ??
                PERPS_FALLBACK_FEE_RATES.protocolFeeRate),
            metamaskFee:
              notional *
              (result?.metamaskFeeRate ??
                PERPS_FALLBACK_FEE_RATES.metamaskFeeRate),
          }))
          .catch(() => ({
            protocolFee: notional * PERPS_FALLBACK_FEE_RATES.protocolFeeRate,
            metamaskFee: notional * PERPS_FALLBACK_FEE_RATES.metamaskFeeRate,
          })),
      ),
    )
      .then((perSymbolFees) => {
        if (!cancelled && currentId === feeRequestId.current) {
          setRawProtocolFees(
            perSymbolFees.reduce((sum, f) => sum + f.protocolFee, 0),
          );
          setRawMetamaskFees(
            perSymbolFees.reduce((sum, f) => sum + f.metamaskFee, 0),
          );
          setIsLoadingFees(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoadingFees(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, symbolNotionalKey]);

  const estimatedFees = useMemo(() => {
    const discountFactor =
      metamaskFeeDiscountBips !== undefined && metamaskFeeDiscountBips > 0
        ? 1 - metamaskFeeDiscountBips / BASIS_POINTS_DIVISOR
        : 1;
    return rawProtocolFees + rawMetamaskFees * discountFactor;
  }, [rawProtocolFees, rawMetamaskFees, metamaskFeeDiscountBips]);

  const roundedMargin = useMemo(
    () => Math.round(totalMargin * 100) / 100,
    [totalMargin],
  );

  const roundedFees = useMemo(
    () => Math.round(estimatedFees * 100) / 100,
    [estimatedFees],
  );

  // HyperLiquid's marginUsed already includes accumulated PnL, so we do NOT
  // add unrealizedPnl separately (that would double-count).
  // Derived from the same rounded values shown in the Margin/Fees rows so
  // the summary always reconciles visually (avoids ±1 cent drift).
  const youWillReceive = useMemo(
    () => Math.round((roundedMargin - roundedFees) * 100) / 100,
    [roundedMargin, roundedFees],
  );

  const isSubmitDisabled = isSubmitting || positions.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="perps-close-all-positions-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader onClose={onClose}>
          <Text
            variant={TextVariant.HeadingSm}
            fontWeight={FontWeight.Bold}
            textAlign={TextAlign.Center}
          >
            {t('perpsCloseAllPositions')}
          </Text>
        </ModalHeader>
        <ModalBody>
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
              {t('perpsCloseAllDescription')}
            </Text>

            {/* Summary rows */}
            <Box flexDirection={BoxFlexDirection.Column}>
              {/* Margin */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Start}
                paddingTop={1}
                paddingBottom={1}
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
                    textAlign={TextAlign.Right}
                    data-testid="perps-close-all-total-margin-value"
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
                        key="perps-close-all-pnl"
                        variant={TextVariant.BodyXs}
                        color={
                          totalUnrealizedPnl >= 0
                            ? TextColor.SuccessDefault
                            : TextColor.ErrorDefault
                        }
                        asChild
                      >
                        <span>
                          {totalUnrealizedPnl >= 0 ? '+' : '-'}
                          {formatPerpsFiat(Math.abs(totalUnrealizedPnl), {
                            minimumDecimals: 2,
                            maximumDecimals: 2,
                          })}
                        </span>
                      </Text>,
                    ])}
                  </Text>
                </Box>
              </Box>

              {/* Fees — divider line below (matches Figma border-bottom) */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                paddingTop={1}
                paddingBottom={3}
                className="border-b border-border-muted"
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsFees')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  data-testid="perps-close-all-fees-value"
                >
                  {isLoadingFees ? '--' : `-${formatFiat(roundedFees)}`}
                </Text>
              </Box>

              {/* You'll receive */}
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                alignItems={BoxAlignItems.Center}
                paddingTop={3}
                paddingBottom={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {t('perpsYouWillReceive')}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  data-testid="perps-close-all-receive-value"
                >
                  {isLoadingFees
                    ? '--'
                    : formatFiat(Math.max(youWillReceive, 0))}
                </Text>
              </Box>
            </Box>
          </Box>
        </ModalBody>
        <ModalFooter
          onCancel={onClose}
          cancelButtonProps={{
            'data-testid': 'perps-close-all-positions-modal-cancel',
            children: t('perpsKeepPositions'),
          }}
          onSubmit={onConfirm}
          submitButtonProps={{
            'data-testid': 'perps-close-all-positions-modal-submit',
            children: t('perpsCloseAll'),
            disabled: isSubmitDisabled,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
