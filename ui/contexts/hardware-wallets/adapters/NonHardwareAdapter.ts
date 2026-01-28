import {
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';

/**
 * Non-Hardware adapter for regular (non-hardware wallet) accounts.
 *
 * This adapter is used when the current account is a regular account.
 * All methods return affirmative values since there is no hardware device
 * to manage - the account is always ready for operations.
 */
export class NonHardwareAdapter implements HardwareWalletAdapter {
  // Store options to satisfy the constructor signature, but they won't be used
  #options: HardwareWalletAdapterOptions;

  constructor(options: HardwareWalletAdapterOptions) {
    this.#options = options;
  }

  /**
   * Connect resolves successfully - regular accounts are always connected
   *
   * @param _deviceId
   */
  async connect(_deviceId: string): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Disconnect resolves successfully - regular accounts can always disconnect
   */
  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Always returns true - regular accounts are always considered "connected"
   * since there's no hardware device state to manage
   */
  isConnected(): boolean {
    return true;
  }

  /**
   * Destroy completes successfully - no resources to clean up
   */
  destroy(): void {
    // No resources to clean up
  }

  /**
   * Always returns true - regular accounts are always ready
   * since there's no hardware device state to check
   *
   * @param _deviceId
   */
  async ensureDeviceReady(_deviceId: string): Promise<boolean> {
    return true;
  }
}
