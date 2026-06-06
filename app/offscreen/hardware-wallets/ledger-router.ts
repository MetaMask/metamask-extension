import { LedgerHandlerMode } from '../../../shared/constants/offscreen-communication';
import { LedgerDMKBridgeHandler } from './ledger-dmk';
import initLegacy from './ledger';

/**
 * Initializes the Ledger offscreen handler based on the active mode.
 *
 * The mode is determined by the `ledgerDmkBridge` remote feature flag,
 * queried from the background before this function is called.
 *
 * @param mode - `LedgerHandlerMode.DMK` to use the new DMK bridge handler,
 *   `LedgerHandlerMode.Legacy` for the original `@ledgerhq/hw-app-eth` handler.
 */
export default async function initLedger(
  mode: LedgerHandlerMode,
): Promise<void> {
  console.debug(
    '[LedgerOffscreen] Module init() — creating handler',
    JSON.stringify({ mode }),
  );
  if (mode === LedgerHandlerMode.DMK) {
    console.debug('[LedgerOffscreen] Module init() — using DMK bridge handler');
    const handler = new LedgerDMKBridgeHandler();
    await handler.init();
  } else {
    console.debug('[LedgerOffscreen] Module init() — using legacy handler');
    await initLegacy();
  }
}
