const UNFUNDED_DEPOSIT_FUNNEL_KEY = 'perps.unfundedDepositFunnel';

/**
 * Marks this tab's session as an unfunded trade-screen deposit so later
 * deposit-opened / deposit-confirmed / order-submitted events can be joined.
 */
export function markUnfundedDepositFunnel(): void {
  try {
    sessionStorage.setItem(UNFUNDED_DEPOSIT_FUNNEL_KEY, '1');
  } catch {
    // sessionStorage can throw in locked or quota-exceeded contexts.
  }
}

export function isUnfundedDepositFunnelActive(): boolean {
  try {
    return sessionStorage.getItem(UNFUNDED_DEPOSIT_FUNNEL_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Returns whether the unfunded funnel was active, then clears it. Call once
 * from the successful order-submit path so a later unrelated order does not
 * inherit the flag.
 */
export function consumeUnfundedDepositFunnel(): boolean {
  if (!isUnfundedDepositFunnelActive()) {
    return false;
  }
  try {
    sessionStorage.removeItem(UNFUNDED_DEPOSIT_FUNNEL_KEY);
  } catch {
    // Ignore storage failures; the boolean already reflects the prior value.
  }
  return true;
}
