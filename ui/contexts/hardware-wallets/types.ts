/**
 * Types and interfaces for hardware wallet functionality
 */

/**
 * Hardware wallet types supported by the application
 */
export enum HardwareWalletType {
  Ledger = 'ledger',
  Trezor = 'trezor',
  Qr = 'qr',
}

/**
 * Permission states for hardware wallet connections
 */
export enum HardwareConnectionPermissionState {
  Granted = 'granted',
  Prompt = 'prompt',
  Denied = 'denied',
  Unknown = 'unknown',
}

/**
 * Events that can occur during hardware wallet operations
 */
export enum DeviceEvent {
  Connected = 'connected',
  Disconnected = 'disconnected',
  ConnectionFailed = 'connection_failed',
  DeviceLocked = 'device_locked',
  AppNotOpen = 'app_not_open',
}

/**
 * Options for initializing a hardware wallet adapter
 */
export type HardwareWalletAdapterOptions = {
  onDisconnect: (error?: Error) => void;
  onDeviceEvent: (event: { event: DeviceEvent; error?: Error }) => void;
  onAwaitingConfirmation: () => void;
  onDeviceLocked: (error?: Error) => void;
  onAppNotOpen: (error?: Error) => void;
};

/**
 * Base interface for hardware wallet adapters
 */
export type HardwareWalletAdapter = {
  connect(deviceId?: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  verifyDeviceReady(deviceId?: string): Promise<void>;
  setPendingOperation(pending: boolean): void;
  destroy(): void;
};
