/**
 * Enum for hardware wallet types
 */
export enum HardwareWalletType {
  LEDGER = 'ledger',
}

/**
 * Enum for connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  READY = 'ready',
  AWAITING_CONFIRMATION = 'awaiting_confirmation',
  AWAITING_APP = 'awaiting_app',
  ERROR = 'error',
}

/**
 * Enum for WebHID permission state
 */
export enum WebHIDPermissionState {
  UNKNOWN = 'unknown',
  GRANTED = 'granted',
  PROMPT = 'prompt',
  DENIED = 'denied',
}

/**
 * Enum for device events
 */
export enum DeviceEvent {
  DISCONNECTED = 'disconnected',
  DEVICE_LOCKED = 'device_locked',
  APP_NOT_OPEN = 'app_not_open',
  APP_CHANGED = 'app_changed',
  CONNECTION_FAILED = 'connection_failed',
  OPERATION_TIMEOUT = 'operation_timeout',
}

/**
 * Connection state type (discriminated union)
 */
export type HardwareWalletConnectionState =
  | { status: ConnectionStatus.DISCONNECTED }
  | { status: ConnectionStatus.CONNECTING }
  | { status: ConnectionStatus.CONNECTED }
  | { status: ConnectionStatus.READY }
  | { status: ConnectionStatus.AWAITING_CONFIRMATION }
  | { status: ConnectionStatus.AWAITING_APP; reason: string; appName?: string }
  | { status: ConnectionStatus.ERROR; reason: string; error: Error };

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
   * @returns true if ready
   * @throws {HardwareWalletError} if device is not ready (locked, wrong app, etc.)
   */
  verifyDeviceReady?(): Promise<boolean>;
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
  webHidPermissionState: WebHIDPermissionState;
  isWebHidAvailable: boolean;
  currentAppName: string | null;

  // Actions
  connect: (type: HardwareWalletType, deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  executeWithWallet: <T>(
    operation: (adapter: HardwareWalletAdapter) => Promise<T>,
  ) => Promise<T>;
  clearError: () => void;
  retry: () => Promise<void>;
  checkWebHidPermission: () => Promise<WebHIDPermissionState>;
  requestWebHidPermission: () => Promise<boolean>;
  ensureDeviceReady: () => Promise<boolean>;
};
