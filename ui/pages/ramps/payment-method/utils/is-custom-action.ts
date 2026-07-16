import type { Quote } from '@metamask/ramps-controller';

/**
 * Whether a quote is for a custom-action provider (e.g. PayPal).
 *
 * Custom-action quotes keep the payment method selectable but do not show
 * amountOut / amountOutInFiat in the list item.
 *
 * @param quote - Quote from the ramps quotes response.
 * @returns True when the quote is marked as a custom action.
 */
export function isCustomAction(quote: Quote): boolean {
  return (quote.quote as { isCustomAction?: boolean })?.isCustomAction === true;
}
