/**
 * Enum for hardware wallet types
 */
export enum HardwareWalletType {
  Ledger = 'ledger',
  Trezor = 'trezor',
  OneKey = 'oneKey',
  Lattice = 'lattice',
  Qr = 'qr',
}

/**
 * Enum for connection status
 */
export enum ConnectionStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Ready = 'ready',
  AwaitingConfirmation = 'awaiting_confirmation',
  AwaitingApp = 'awaiting_app',
  ErrorState = 'error',
}

/**
 * Enum for WebHID/WebUSB permission state
 */
export enum HardwareConnectionPermissionState {
  Unknown = 'unknown',
  Granted = 'granted',
  Prompt = 'prompt',
  Denied = 'denied',
}

/**
 * Enum for device events
 */
export enum DeviceEvent {
  Disconnected = 'disconnected',
  DeviceLocked = 'device_locked',
  AppNotOpen = 'app_not_open',
  AppChanged = 'app_changed',
  ConnectionFailed = 'connection_failed',
  OperationTimeout = 'operation_timeout',
}

/**
 * Connection state type (discriminated union)
 */
export type HardwareWalletConnectionState =
  | { status: ConnectionStatus.Disconnected }
  | { status: ConnectionStatus.Connecting }
  | { status: ConnectionStatus.Connected }
  | { status: ConnectionStatus.Ready }
  | { status: ConnectionStatus.AwaitingConfirmation }
  | { status: ConnectionStatus.AwaitingApp; reason: string; appName?: string }
  | { status: ConnectionStatus.ErrorState; reason: string; error: Error };

/**
 * Device event payload
 */
export type DeviceEventPayload = {
  event: DeviceEvent;
  error?: Error;
  currentAppName?: string;
  previousAppName?: string;
  deviceName?: string;
};

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Adapter interface
 *
 * Note: This adapter manages connection state only.
 * Actual signing operations flow through the existing MetaMask infrastructure
 * (TransactionController, SignatureController, etc.) which already use the
 * KeyringController's hardware wallet keyrings.
 */
export type HardwareWalletAdapter = {
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  destroy(): void;

  // Optional methods
  setPendingOperation?(pending: boolean): void;
  getCurrentAppName?(): Promise<string>;
  /**
   * Verify the device is ready for operations
   * (e.g., Ledger requires the Ethereum app to be open)
   *
   * @returns true if ready
   * @throws {HardwareWalletError} if device is not ready (locked, wrong app, etc.)
   */
  verifyDeviceReady?(deviceId: string): Promise<boolean>;
};

/**
 * Adapter options (callbacks)
 */
export type HardwareWalletAdapterOptions = {
  onDisconnect: (error?: unknown) => void;
  onAwaitingConfirmation: () => void;
  onDeviceLocked: () => void;
  onAppNotOpen: () => void;
  onDeviceEvent: (payload: DeviceEventPayload) => void;
};

/**
 * Context type
 */
export type HardwareWalletContextType = {
  // State
  isHardwareWalletAccount: boolean;
  detectedWalletType: HardwareWalletType | null;
  walletType: HardwareWalletType | null;
  connectionState: HardwareWalletConnectionState;
  deviceId: string | null;
  hardwareConnectionPermissionState: HardwareConnectionPermissionState;
  isWebHidAvailable: boolean;
  isWebUsbAvailable: boolean;
  currentAppName: string | null;

  // Actions
  connect: (type: HardwareWalletType, deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  retry: () => Promise<void>;
  checkHardwareWalletPermission: (
    walletType: HardwareWalletType,
  ) => Promise<HardwareConnectionPermissionState>;
  requestHardwareWalletPermission: (
    walletType: HardwareWalletType,
  ) => Promise<boolean>;
  ensureDeviceReady: () => Promise<boolean>;
};
