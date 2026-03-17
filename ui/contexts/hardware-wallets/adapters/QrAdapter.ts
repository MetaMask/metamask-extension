import { ErrorCode } from '@metamask/hw-wallet-sdk';
import WebcamUtils from '../../../helpers/utils/webcam-utils';
import { createHardwareWalletError, getDeviceEventForError } from '../errors';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletAdapter,
  type HardwareWalletAdapterOptions,
} from '../types';

/**
 * QR hardware wallet adapter (Keystone, Ngrave Zero, etc.)
 *
 * For QR wallets the "transport" is the camera. This adapter gates the
 * swaps/send flow by checking whether camera permission has been explicitly
 * denied before the QR scanner popover is even opened. If permission is
 * 'granted' or 'prompt' we let the flow continue — the QR scanner popover
 * handles requesting permission and surfacing dismissal/denial states in its
 * own UI. We only surface an error here when the OS/browser has persistently
 * blocked camera access so the user gets actionable recovery instructions.
 */
export class QrAdapter implements HardwareWalletAdapter {
  private options: HardwareWalletAdapterOptions;

  private connected = false;

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;
  }

  /**
   * Returns the current camera PermissionState, or null on browsers that
   * don't support navigator.permissions (e.g. older Safari).
   */
  private async getCameraPermissionState(): Promise<PermissionState | null> {
    const permissionStatus = await WebcamUtils.getPermissionState();
    return permissionStatus?.state ?? null;
  }

  /**
   * Creates and emits a ConnectionTransportMissing error, then returns it so
   * callers can throw it after emitting.
   */
  private emitCameraPermissionError(): ReturnType<
    typeof createHardwareWalletError
  > {
    const hwError = createHardwareWalletError(
      ErrorCode.ConnectionTransportMissing,
      HardwareWalletType.Qr,
      'Camera permission is denied',
    );
    this.options.onDeviceEvent({
      event: getDeviceEventForError(hwError.code),
      error: hwError,
    });
    return hwError;
  }

  /**
   * Mark the adapter as connected unless camera permission is explicitly denied.
   * 'prompt' is allowed through — the QR scanner popover will request access.
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const state = await this.getCameraPermissionState();
    if (state === 'denied') {
      this.connected = false;
      throw this.emitCameraPermissionError();
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.options.onDeviceEvent({ event: DeviceEvent.Disconnected });
  }

  isConnected(): boolean {
    return this.connected;
  }

  destroy(): void {
    this.connected = false;
  }

  /**
   * Verify the camera is accessible before the user reaches the QR scanner.
   * Throws ConnectionTransportMissing only when the browser has persistently
   * blocked camera access ('denied'). 'prompt' and 'granted' both pass through.
   *
   * @returns true if camera access is not denied
   */
  async ensureDeviceReady(): Promise<boolean> {
    const state = await this.getCameraPermissionState();
    if (state === 'denied') {
      this.connected = false;
      throw this.emitCameraPermissionError();
    }
    this.connected = true;
    return true;
  }
}
