import type { OrderParams } from '@metamask/perps-controller';
import type { OrderFormState, OrderMode } from './order-entry.types';

/**
 * Convert UI order form state into PerpsController order params.
 *
 * @param formState - Current order form state.
 * @param currentPrice - Current asset price in USD.
 * @param mode - Order mode.
 * @param existingPositionSize - Existing signed position size for close mode.
 * @returns PerpsController order params.
 */
export function formStateToOrderParams(
  formState: OrderFormState,
  currentPrice: number,
  mode: OrderMode = 'new',
  existingPositionSize?: string,
): OrderParams {
  const isBuy = formState.direction === 'long';
  const cleanAmount = formState.amount.replaceAll(',', '');
  const marginAmount = Number.parseFloat(cleanAmount) || 0;
  const positionSize =
    currentPrice > 0 ? (marginAmount * formState.leverage) / currentPrice : 0;
  const size =
    mode === 'close' && existingPositionSize
      ? Math.abs(Number.parseFloat(existingPositionSize)).toString()
      : positionSize.toString();

  const params: OrderParams = {
    symbol: formState.asset,
    isBuy,
    size,
    orderType: formState.type,
    leverage: formState.leverage,
    currentPrice,
    usdAmount: cleanAmount,
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
