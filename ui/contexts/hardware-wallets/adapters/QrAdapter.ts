import { ErrorCode, type HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { createHardwareWalletError, getDeviceEventForError } from '../errors';
import { toHardwareWalletError } from '../rpcErrorUtils';
import {
  DeviceEvent,
  HardwareWalletType,
  type EnsureDeviceReadyOptions,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';
import { CameraPermissionState } from '../constants';
import { checkCameraPermission } from '../webConnectionUtils';

/**
 * QR hardware wallet adapter.
 *
 * Readiness depends on camera availability and permission state for QR scanning.
 */
export class QrAdapter implements HardwareWalletAdapter {
  private readonly options: HardwareWalletAdapterOptions;

  private connected = false;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
  }

  /**
   * Marks the adapter as connected.
   */
  async connect(): Promise<void> {
    this.connected = true;
  }

  /**
   * Clears connection state and notifies listeners that the QR flow is no longer active.
   */
  async disconnect(): Promise<void> {
    try {
      this.connected = false;
      this.options.onDeviceEvent({
        event: DeviceEvent.Disconnected,
      });
    } catch (error) {
      this.options.onDisconnect(error);
    }
  }

  /**
   * Whether the adapter considers the QR account flow active (after connection).
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Resets local connection state.
   */
  destroy(): void {
    this.connected = false;
  }

  /**
   * Emits a device event for the given error and returns a rejected promise with that error.
   *
   * @param hwError - Structured hardware wallet error to surface to the UI layer.
   * @returns A promise that rejects with `hwError`.
   */
  private failEnsureDeviceReady(hwError: HardwareWalletError): Promise<never> {
    this.options.onDeviceEvent({
      event: getDeviceEventForError(hwError.code),
      error: hwError,
    });
    return Promise.reject(hwError);
  }

  /**
   * Ensures camera permission state allows QR scanning (via Permissions API probe).
   * Rejects with `HardwareWalletError` when permission is denied, still prompt, or the probe fails.
   *
   * @param _options - Reserved for parity with other hardware adapters; ignored for QR.
   * @returns True when camera permission is granted.
   */
  async ensureDeviceReady(
    _options?: EnsureDeviceReadyOptions,
  ): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }

    let permissionState: PermissionState;
    try {
      permissionState = await checkCameraPermission();
    } catch (error) {
      return this.failEnsureDeviceReady(
        toHardwareWalletError(error, HardwareWalletType.Qr),
      );
    }

    if (permissionState === CameraPermissionState.Granted) {
      return true;
    }

    if (permissionState === CameraPermissionState.Denied) {
      return this.failEnsureDeviceReady(
        createHardwareWalletError(
          ErrorCode.PermissionCameraDenied,
          HardwareWalletType.Qr,
        ),
      );
    }

    return this.failEnsureDeviceReady(
      createHardwareWalletError(
        ErrorCode.PermissionCameraPromptDismissed,
        HardwareWalletType.Qr,
      ),
    );
  }
}
