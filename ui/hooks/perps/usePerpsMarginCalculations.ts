import { useMemo } from 'react';
import type { Position, AccountState } from '@metamask/perps-controller';
import {
  calculateMaxRemovableMargin,
  estimateLiquidationPrice,
  liquidationDistancePercent,
  assessMarginRemovalRisk,
  MARGIN_ADJUSTMENT_CONFIG,
} from './marginUtils';
import type { MarginRiskAssessment } from './marginUtils';

export type { MarginRiskAssessment } from './marginUtils';

export type UsePerpsMarginCalculationsParams = {
  position: Position;
  /** Live mark / current price for the symbol (extension: chart or market tick). */
  currentPrice: number;
  account: AccountState | null;
  mode: 'add' | 'remove';
  amount: string;
};

export type UsePerpsMarginCalculationsReturn = {
  maxAmount: number;
  /** Parsed `position.liquidationPrice` from provider (anchor). */
  anchorLiquidationPrice: number | null;
  /** `estimateLiquidationPrice` after applying adjustment amount. */
  estimatedLiquidationPrice: number | null;
  /** `liquidationDistancePercent(currentPrice, anchor)`. */
  anchorLiquidationDistance: number;
  /** `liquidationDistancePercent(currentPrice, estimated)` when estimated is finite. */
  estimatedLiquidationDistance: number | null;
  riskAssessment: MarginRiskAssessment | null;
  isValid: boolean;
};

/**
 * Compute max addable/removable margin, anchored + estimated liquidation, distances, and risk.
 * Parity with mobile `usePerpsAdjustMarginData` / `marginUtils.estimateLiquidationPrice`.
 *
 * @param options0 - The hook parameters
 * @param options0.position - The current position to adjust margin for
 * @param options0.currentPrice - Live price for distance (mark)
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
    const currentMargin = Number.parseFloat(position.marginUsed) || 0;
    const positionSize = Math.abs(Number.parseFloat(position.size)) || 0;
    const entryPrice = Number.parseFloat(position.entryPrice) || 0;
    const positionLeverage =
      position.leverage?.value ?? MARGIN_ADJUSTMENT_CONFIG.FallbackMaxLeverage;
    const maxLeverageForFormula =
      position.maxLeverage ?? MARGIN_ADJUSTMENT_CONFIG.FallbackMaxLeverage;

    let anchorLiquidationPrice: number | null = null;
    if (position.liquidationPrice) {
      const parsed = Number.parseFloat(position.liquidationPrice);
      if (Number.isFinite(parsed)) {
        anchorLiquidationPrice = parsed;
      }
    }

    const isLong = Number.parseFloat(position.size) >= 0;
    const availableBalance = account
      ? Number.parseFloat(account.availableBalance) || 0
      : 0;
    const notionalValue = Number.parseFloat(position.positionValue) || 0;

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

    const amountNum = Number.parseFloat(amount.replaceAll(',', '')) || 0;
    const newMargin =
      mode === 'add'
        ? currentMargin + amountNum
        : Math.max(0, currentMargin - amountNum);

    let estimatedLiquidationPrice: number | null = null;
    if (anchorLiquidationPrice !== null) {
      estimatedLiquidationPrice = estimateLiquidationPrice({
        anchorLiquidationPrice,
        currentMargin,
        newMargin,
        positionSize,
        isLong,
        maxLeverage: maxLeverageForFormula,
      });
    }

    const anchorLiquidationDistance = liquidationDistancePercent(
      currentPrice,
      anchorLiquidationPrice,
    );

    let estimatedLiquidationDistance: number | null = null;
    if (
      estimatedLiquidationPrice !== null &&
      Number.isFinite(estimatedLiquidationPrice)
    ) {
      estimatedLiquidationDistance = liquidationDistancePercent(
        currentPrice,
        estimatedLiquidationPrice,
      );
    }

    let riskAssessment: MarginRiskAssessment | null = null;
    if (
      mode === 'remove' &&
      estimatedLiquidationPrice !== null &&
      Number.isFinite(estimatedLiquidationPrice)
    ) {
      riskAssessment = assessMarginRemovalRisk({
        newLiquidationPrice: estimatedLiquidationPrice,
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
      anchorLiquidationPrice,
      estimatedLiquidationPrice,
      anchorLiquidationDistance,
      estimatedLiquidationDistance,
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
    position.maxLeverage,
    currentPrice,
    account,
    mode,
    amount,
  ]);
}
