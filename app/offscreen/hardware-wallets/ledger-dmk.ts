import { LedgerAction } from '../../../shared/constants/offscreen-communication';
import initLegacy, { LedgerLegacyHandler } from './ledger';

/**
 * Temporary DMK handler stub that delegates to the legacy offscreen handler.
 *
 * Replaced by the real DMK bridge implementation in a follow-up PR. Exists so
 * the router can already target a distinct handler implementation today.
 */
export class LedgerDmkBridgeHandler {
  private legacyHandler: LedgerLegacyHandler | null = null;

  /**
   * Initialises the underlying legacy handler.
   *
   * @returns Resolves once the legacy handler is ready to dispatch actions.
   */
  async init(): Promise<void> {
    this.legacyHandler = initLegacy();
    await this.legacyHandler.init();
  }

  /**
   * Cleans up the underlying legacy handler.
   *
   * @returns Resolves once the legacy handler has been destroyed.
   */
  async destroy(): Promise<void> {
    await this.legacyHandler?.destroy();
    this.legacyHandler = null;
  }

  /**
   * Forwards an action to the underlying legacy handler.
   *
   * @param action - The Ledger action to perform.
   * @param params - Optional parameters required by the action.
   * @returns The result produced by the legacy handler.
   */
  async handleAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    if (!this.legacyHandler) {
      throw new Error('Ledger DMK stub handler is not initialised');
    }

    return this.legacyHandler.handleAction(action, params);
  }
}
