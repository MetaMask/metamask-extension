/**
 * The funding intent behind a Money Account deposit. Not cosmetic: the intent
 * selects the Pay pipeline (only generic/`convert` deposits take the optimized
 * quote pipeline), the confirmation loader, and the toast copy. `card` is
 * plumbed for parity with mobile but unreachable until the Card product ships
 * in the extension.
 */
export type MoneyAccountDepositIntent = 'convert' | 'addMusd' | 'card';

/**
 * Batch id → deposit intent, keyed by lowercased batch id.
 *
 * Module-level state rather than redux, matching mobile: the intent is
 * transient UI-session context for an in-flight deposit, written once at
 * initiation and cleared when the transaction reaches a terminal state. It
 * does not need to survive a UI reload — the fallback derivation from the
 * transaction's payment method covers that case.
 */
const depositIntentByBatchId = new Map<string, MoneyAccountDepositIntent>();

/**
 * Records the funding intent for a deposit batch. Only explicit intents
 * (`card` / `addMusd`) should be recorded — generic deposits are left unset so
 * consumers derive the intent from the transaction's actual payment method
 * instead of a guess.
 *
 * @param batchId - The batch id of the deposit.
 * @param intent - The funding intent.
 */
export function setMoneyAccountDepositIntent(
  batchId: string | undefined,
  intent: MoneyAccountDepositIntent,
): void {
  if (!batchId) {
    return;
  }
  depositIntentByBatchId.set(batchId.toLowerCase(), intent);
}

/**
 * Reads the funding intent recorded for a deposit batch.
 *
 * @param batchId - The batch id of the deposit.
 * @returns The recorded intent, or `undefined` for generic deposits and after
 * a UI reload.
 */
export function getMoneyAccountDepositIntent(
  batchId: string | undefined,
): MoneyAccountDepositIntent | undefined {
  if (!batchId) {
    return undefined;
  }
  return depositIntentByBatchId.get(batchId.toLowerCase());
}

/**
 * Clears the recorded intent for a deposit batch.
 *
 * Currently only called when deposit setup fails before submission
 * (`useMoneyAccountDeposit`'s catch path). Terminal-state clearing
 * (confirmed, failed, dropped, rejected) belongs with the toast/status work
 * that reads this intent and has not landed yet — see
 * `docs/money-account-integration.md`.
 *
 * @param batchId - The batch id of the deposit.
 */
export function clearMoneyAccountDepositIntent(
  batchId: string | undefined,
): void {
  if (!batchId) {
    return;
  }
  depositIntentByBatchId.delete(batchId.toLowerCase());
}
