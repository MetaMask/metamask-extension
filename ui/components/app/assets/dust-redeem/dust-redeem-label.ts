const HIDDEN_AMOUNT = '•'.repeat(6);

/**
 * The amount shown in the redeem CTA and confirm button. Masked while fiat
 * balances are hidden (privacy mode).
 *
 * @param formattedAmount - Fiat amount, already formatted with its currency symbol.
 * @param privacyMode - Whether fiat balances are hidden.
 * @returns The text to substitute into `dustRedeemForMusd`.
 */
export function getDustRedeemAmountText(
  formattedAmount: string,
  privacyMode: boolean,
): string {
  return privacyMode ? HIDDEN_AMOUNT : formattedAmount;
}
