import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
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
import { ORIGINAL_METAMASK_FEE_BIPS } from '../../../../hooks/perps/usePerpsOrderFees';
import {
  applyPerpsFallbackDiscount,
  getPerpsNotionalUsd,
} from '../../../../hooks/perps/perps-fee-utils';
import type { Position } from '../types';
import { selectPerpsActiveProvider } from '../../../../selectors/perps-controller';
import {
  PERPS_CLOSE_UNAVAILABLE_DISPLAY,
  estimateClosePositionReceive,
  getCloseMarginWithPnl,
  getClosePositionProviderId,
  roundCloseUsd,
} from './close-position-utils';

/**
 * A symbol's close fee rates. Without a resolved MetaMask rate, the discounted
 * local fallback is applied at render time.
 */
type SymbolFeeRates = {
  protocolFeeRate: number;
  metamaskFeeRate?: number;
};

/**
 * Sums figures that are each rounded to cents, or `undefined` when any is.
 *
 * @param values - The figures to add.
 * @returns The total, or `undefined` when a figure is unavailable.
 */
function sumCloseUsd(values: (number | undefined)[]): number | undefined {
  let total = 0;
  for (const value of values) {
    if (value === undefined) {
      return undefined;
    }
    total += value;
  }
  return roundCloseUsd(total);
}

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

  // Build a stable, JSON-serialisable key from position symbols + notionals
  // so the fee-fetching effect only re-fires when actual data changes, not on
  // every streaming array reference swap.
  const symbolNotionalPairs = useMemo(() => {
    const map = new Map<string, number>();
    for (const pos of positions) {
      let notional: number;
      try {
        notional = getPerpsNotionalUsd({
          usdAmount: pos.positionValue,
          allowEmpty: false,
        });
      } catch (error) {
        if (error instanceof RangeError) {
          return undefined;
        }
        throw error;
      }
      map.set(pos.symbol, (map.get(pos.symbol) ?? 0) + notional);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [positions]);

  const symbolNotionalKey = useMemo(
    () => JSON.stringify(symbolNotionalPairs ?? []),
    [symbolNotionalPairs],
  );
  const hasInvalidNotional = symbolNotionalPairs === undefined;

  // Per-symbol fee rates; undefined while the quotes load.
  const [symbolFeeRates, setSymbolFeeRates] = useState<
    Record<string, SymbolFeeRates> | undefined
  >(undefined);
  const feeRequestId = useRef(0);
  const feeFetchKey = isOpen ? symbolNotionalKey : '';
  const [prevFeeFetchKey, setPrevFeeFetchKey] = useState(feeFetchKey);

  if (feeFetchKey !== prevFeeFetchKey) {
    setPrevFeeFetchKey(feeFetchKey);
    if (isOpen) {
      setSymbolFeeRates(undefined);
    }
  }

  const metamaskFeeDiscountBips = usePerpsMetamaskFeeDiscountBips(
    ORIGINAL_METAMASK_FEE_BIPS,
  );

  useEffect(() => {
    if (!isOpen || hasInvalidNotional) {
      return undefined;
    }

    let cancelled = false;

    const entries: [string, number][] = JSON.parse(symbolNotionalKey);

    feeRequestId.current += 1;
    const currentId = feeRequestId.current;

    if (entries.length === 0) {
      return undefined;
    }

    // closeAll resolves one builder discount against the whole batch, while
    // each symbol retains its own protocol rate and fee contribution.
    const totalNotional = entries.reduce(
      (sum, [, notional]) => sum + notional,
      0,
    );

    Promise.all(
      entries.map(([symbol]) =>
        submitRequestToBackground<FeeCalculationResult>('perpsCalculateFees', [
          {
            orderType: 'market' as const,
            isMaker: false,
            symbol,
            amount: String(totalNotional),
          },
        ])
          .then((result): [string, SymbolFeeRates] => [
            symbol,
            {
              protocolFeeRate:
                result?.protocolFeeRate ??
                PERPS_FALLBACK_FEE_RATES.protocolFeeRate,
              metamaskFeeRate: result?.metamaskFeeRate,
            },
          ])
          .catch((): [string, SymbolFeeRates] => [
            symbol,
            { protocolFeeRate: PERPS_FALLBACK_FEE_RATES.protocolFeeRate },
          ]),
      ),
    ).then((perSymbolRates) => {
      if (!cancelled && currentId === feeRequestId.current) {
        setSymbolFeeRates(Object.fromEntries(perSymbolRates));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, symbolNotionalKey, hasInvalidNotional]);

  const activeProvider = useSelector(selectPerpsActiveProvider);

  // Each position closes in full at its mark price, the price a market close
  // is quoted at, with its symbol's fee rate.
  const closeEstimates = useMemo(
    () =>
      positions.map((position) => {
        const rates = symbolFeeRates?.[position.symbol];
        // Controller rates are resolved; discount only the local fallback.
        const feeRate =
          rates === undefined
            ? undefined
            : rates.protocolFeeRate +
              (rates.metamaskFeeRate ??
                applyPerpsFallbackDiscount(
                  PERPS_FALLBACK_FEE_RATES.metamaskFeeRate,
                  metamaskFeeDiscountBips,
                ));
        const closeSize = Math.abs(Number.parseFloat(position.size));
        return estimateClosePositionReceive({
          position,
          providerId: getClosePositionProviderId(position, activeProvider),
          closeSize,
          price: Number.parseFloat(position.positionValue) / closeSize,
          feeRate,
        });
      }),
    [positions, symbolFeeRates, metamaskFeeDiscountBips, activeProvider],
  );

  // Totals add the per-position figures at the cents Core rounds them to, so
  // margin with PnL minus fees equals what you receive.
  const totalMarginWithPnl = sumCloseUsd(
    closeEstimates.map(getCloseMarginWithPnl),
  );
  const totalPnl = sumCloseUsd(
    closeEstimates.map(({ realizedPnl }) => roundCloseUsd(realizedPnl)),
  );
  const totalFees = sumCloseUsd(
    closeEstimates.map(({ fee }) => roundCloseUsd(fee)),
  );
  const totalReceive = sumCloseUsd(
    closeEstimates.map(({ receive }) => receive),
  );

  const formatCloseUsd = useCallback(
    (value: number | undefined) =>
      value === undefined || hasInvalidNotional
        ? PERPS_CLOSE_UNAVAILABLE_DISPLAY
        : formatFiat(value),
    [formatFiat, hasInvalidNotional],
  );

  const isSubmitDisabled =
    isSubmitting || positions.length === 0 || hasInvalidNotional;

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
                    {formatCloseUsd(totalMarginWithPnl)}
                  </Text>
                  {totalPnl === undefined ? null : (
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
                            totalPnl >= 0
                              ? TextColor.SuccessDefault
                              : TextColor.ErrorDefault
                          }
                          asChild
                        >
                          <span data-testid="perps-close-all-pnl-value">
                            {totalPnl >= 0 ? '+' : '-'}
                            {formatPerpsFiat(Math.abs(totalPnl), {
                              minimumDecimals: 2,
                              maximumDecimals: 2,
                            })}
                          </span>
                        </Text>,
                      ])}
                    </Text>
                  )}
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
                  {totalFees === undefined || hasInvalidNotional
                    ? PERPS_CLOSE_UNAVAILABLE_DISPLAY
                    : `-${formatFiat(totalFees)}`}
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
                  {formatCloseUsd(totalReceive)}
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
