/**
 * Hardware wallet types normalized for the hardware wallet context
 */
export enum HardwareWalletType {
  Ledger = 'ledger',
  Trezor = 'trezor',
  OneKey = 'oneKey',
  Lattice = 'lattice',
  Qr = 'qr',
}

/**
 * Hardware wallet connection status
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
 * Hardware wallet connection permission state
 */
export enum HardwareConnectionPermissionState {
  Unknown = 'unknown',
  Granted = 'granted',
  Prompt = 'prompt',
  Denied = 'denied',
}

/**
 * Hardware wallet device events
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
 * Hardware wallet connection State
 */
export type HardwareWalletConnectionState =
  | { status: ConnectionStatus.Disconnected }
  | { status: ConnectionStatus.Connecting }
  | { status: ConnectionStatus.Connected }
  | { status: ConnectionStatus.Ready }
  | { status: ConnectionStatus.AwaitingConfirmation }
  | { status: ConnectionStatus.AwaitingApp; appName?: string }
  | { status: ConnectionStatus.ErrorState; error: Error };

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

  /**
   * Ensure the device is ready for operations
   * (e.g., Ledger requires the Ethereum app to be open)
   *
   * @returns true if ready
   * @throws {HardwareWalletError} if device is not ready (locked, wrong app, etc.)
   */
  ensureDeviceReady?(deviceId: string): Promise<boolean>;

  /**
   * Check the current permission state for device access.
   * Does NOT require a user gesture.
   *
   * @returns The current permission state
   */
  checkPermission?(): Promise<HardwareConnectionPermissionState>;

  /**
   * Request permission to access the hardware device.
   * MUST be called from within a user gesture handler (e.g., button click).
   *
   * @returns true if permission was granted
   */
  requestPermission?(): Promise<boolean>;
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
