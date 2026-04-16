import { useMemo } from 'react';
import {
  calculateMaxRemovableMargin,
  calculateNewLiquidationPrice,
  assessMarginRemovalRisk,
  MARGIN_ADJUSTMENT_CONFIG,
} from './marginUtils';
import type { MarginRiskAssessment } from './marginUtils';
import type { Position, AccountState } from '@metamask/perps-controller';

export type { MarginRiskAssessment } from './marginUtils';

export type UsePerpsMarginCalculationsParams = {
  position: Position;
  currentPrice: number;
  account: AccountState | null;
  mode: 'add' | 'remove';
  amount: string;
};

export type UsePerpsMarginCalculationsReturn = {
  maxAmount: number;
  newLiquidationPrice: number | null;
  currentLiquidationDistance: number;
  newLiquidationDistance: number | null;
  riskAssessment: MarginRiskAssessment | null;
  isValid: boolean;
};

/**
 * Compute max addable/removable margin, new liquidation price, distances, and risk.
 * Used by the edit margin expandable to drive the info panel and validation.
 *
 * @param options0 - The hook parameters
 * @param options0.position - The current position to adjust margin for
 * @param options0.currentPrice - The current market price
 * @param options0.account - The user's account state (null if not loaded)
 * @param options0.mode - Whether adding or removing margin
 * @param options0.amount - The margin adjustment amount as a string
 * @returns Computed margin calculations including max amount, liquidation data, and validation
 */
export function usePerpsMarginCalculations({
  position,
  currentPrice,
  account,
  mode,
  amount,
}: UsePerpsMarginCalculationsParams): UsePerpsMarginCalculationsReturn {
  return useMemo(() => {
    const currentMargin = parseFloat(position.marginUsed) || 0;
    const positionSize = Math.abs(parseFloat(position.size)) || 0;
    const entryPrice = parseFloat(position.entryPrice) || 0;
    const positionLeverage =
      position.leverage?.value ?? MARGIN_ADJUSTMENT_CONFIG.FallbackMaxLeverage;
    const currentLiqPrice = position.liquidationPrice
      ? parseFloat(position.liquidationPrice)
      : null;
    const isLong = parseFloat(position.size) >= 0;
    const availableBalance = account
      ? parseFloat(account.availableBalance) || 0
      : 0;
    const notionalValue = parseFloat(position.positionValue) || 0;

    const maxAmount =
      mode === 'add'
        ? availableBalance
        : Math.max(
            0,
            calculateMaxRemovableMargin({
              currentMargin,
              positionSize,
              entryPrice,
              currentPrice,
              positionLeverage,
              notionalValue: notionalValue || undefined,
            }),
          );

    const amountNum = parseFloat(amount) || 0;
    const newMargin =
      mode === 'add' ? currentMargin + amountNum : currentMargin - amountNum;

    let newLiquidationPrice: number | null = null;
    if (currentLiqPrice !== null && newMargin > 0 && positionSize > 0) {
      newLiquidationPrice = calculateNewLiquidationPrice({
        newMargin,
        positionSize,
        entryPrice,
        isLong,
        currentLiquidationPrice: currentLiqPrice,
      });
    }

    const currentLiquidationDistance =
      currentPrice > 0 && currentLiqPrice !== null
        ? (Math.abs(currentPrice - currentLiqPrice) / currentPrice) * 100
        : 0;

    let newLiquidationDistance: number | null = null;
    if (
      currentPrice > 0 &&
      newLiquidationPrice !== null &&
      Number.isFinite(newLiquidationPrice)
    ) {
      newLiquidationDistance =
        (Math.abs(currentPrice - newLiquidationPrice) / currentPrice) * 100;
    }

    let riskAssessment: MarginRiskAssessment | null = null;
    if (
      mode === 'remove' &&
      newLiquidationPrice !== null &&
      Number.isFinite(newLiquidationPrice)
    ) {
      riskAssessment = assessMarginRemovalRisk({
        newLiquidationPrice,
        currentPrice,
        isLong,
      });
    }

    const minAdjustment = MARGIN_ADJUSTMENT_CONFIG.MinAdjustmentAmount;
    const isValid =
      amountNum >= minAdjustment &&
      amountNum <= maxAmount &&
      (mode === 'add' || amountNum <= currentMargin);

    return {
      maxAmount,
      newLiquidationPrice,
      currentLiquidationDistance,
      newLiquidationDistance,
      riskAssessment,
      isValid,
    };
  }, [
    position.marginUsed,
    position.size,
    position.entryPrice,
    position.positionValue,
    position.leverage?.value,
    position.liquidationPrice,
    currentPrice,
    account,
    mode,
    amount,
  ]);
}
