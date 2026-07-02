import { ORDER_SLIPPAGE_CONFIG } from '@metamask/perps-controller';
import type { OrderParams } from '@metamask/perps-controller';
import type { OrderFormState, OrderMode } from './order-entry.types';

/**
 * Convert UI `OrderFormState` into a PerpsController `OrderParams` payload.
 *
 * Shared by the order entry page and the expanded trading view so the two
 * surfaces submit identical order shapes.
 *
 * @param formState - Current order form state.
 * @param currentPrice - Current asset price in USD.
 * @param mode - Order mode (new, modify, close). Defaults to `'new'`.
 * @param existingPositionSize - Size of the existing position when closing.
 * @param maxSlippageBps - Optional slippage override (market orders only).
 * @returns The controller order params.
 */
export function formStateToOrderParams(
  formState: OrderFormState,
  currentPrice: number,
  mode: OrderMode = 'new',
  existingPositionSize?: string,
  maxSlippageBps?: number,
): OrderParams {
  const isBuy = formState.direction === 'long';
  const marginAmount = Number.parseFloat(formState.amount) || 0;
  const positionSize =
    currentPrice > 0 ? (marginAmount * formState.leverage) / currentPrice : 0;
  const size =
    mode === 'close' && existingPositionSize
      ? Math.abs(Number.parseFloat(existingPositionSize)).toString()
      : positionSize.toString();
  const cleanAmount = formState.amount.replaceAll(',', '');

  const params: OrderParams = {
    symbol: formState.asset,
    isBuy,
    size,
    orderType: formState.type,
    leverage: formState.leverage,
    currentPrice,
    usdAmount: cleanAmount,
    priceAtCalculation: currentPrice,
    maxSlippageBps:
      formState.type === 'limit'
        ? ORDER_SLIPPAGE_CONFIG.DefaultLimitSlippageBps
        : (maxSlippageBps ?? ORDER_SLIPPAGE_CONFIG.DefaultMarketSlippageBps),
  };

  if (formState.type === 'limit' && formState.limitPrice) {
    params.price = formState.limitPrice.replaceAll(',', '');
  }
  if (formState.autoCloseEnabled && formState.takeProfitPrice) {
    params.takeProfitPrice = formState.takeProfitPrice.replaceAll(',', '');
  }
  if (formState.autoCloseEnabled && formState.stopLossPrice) {
    params.stopLossPrice = formState.stopLossPrice.replaceAll(',', '');
  }
  if (mode === 'close') {
    params.reduceOnly = true;
    params.isFullClose = true;
  }

  return params;
}
