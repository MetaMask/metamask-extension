/**
 * Determines whether a bridge/swap quote should be submitted via the smart
 * transaction (STX) / batch path.
 *
 * STX batch submission signs every transaction before publishing any of them
 * (`CollectPublishHook`). For hardware wallets that require a separate
 * approval confirmation, rejecting the trade on-device rejects the deferred
 * publish promises for *all* collected signatures — including the approval the
 * user already confirmed. That incorrectly marks the approval as failed in
 * Activity.
 *
 * Force the sequential path when a hardware wallet must confirm an approval so
 * the approval is published before the trade is requested on the device.
 *
 * @param options - Decision inputs.
 * @param options.isStxEnabled - Whether STX is enabled for the source chain.
 * @param options.isHardwareWallet - Whether the selected account is a hardware wallet.
 * @param options.quoteResponse - Quote that may include approval / resetApproval txs.
 * @param options.quoteResponse.approval
 * @param options.quoteResponse.resetApproval
 * @returns Whether submit should use the STX/batch strategy.
 */
export function shouldUseSmartTransactionsForQuote({
  isStxEnabled,
  isHardwareWallet,
  quoteResponse,
}: {
  isStxEnabled: boolean;
  isHardwareWallet: boolean;
  quoteResponse: {
    approval?: unknown;
    resetApproval?: unknown;
  };
}): boolean {
  if (!isStxEnabled) {
    return false;
  }

  const requiresDeviceApproval =
    Boolean(quoteResponse.approval) || Boolean(quoteResponse.resetApproval);

  if (isHardwareWallet && requiresDeviceApproval) {
    return false;
  }

  return true;
}
