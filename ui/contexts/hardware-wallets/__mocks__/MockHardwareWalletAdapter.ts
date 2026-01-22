/**
 * Mock Hardware Wallet Adapter for testing
 */

import type {
  HardwareWalletAdapter,
  HardwareWalletAdapterOptions,
} from '../types';

export class MockHardwareWalletAdapter implements HardwareWalletAdapter {
  private connected: boolean = false;

  private options: HardwareWalletAdapterOptions;

  public connectMock = jest.fn();

  public disconnectMock = jest.fn();

  public isConnectedMock = jest.fn();

  public destroyMock = jest.fn();

  public ensureDeviceReadyMock = jest.fn();

  public setPendingOperationMock = jest.fn();

  constructor(options: HardwareWalletAdapterOptions) {
    this.options = options;

    // Setup default implementations
    this.connectMock.mockImplementation(async (_deviceId: string) => {
      this.connected = true;
    });

    this.disconnectMock.mockImplementation(async () => {
      this.connected = false;
    });

    this.isConnectedMock.mockImplementation(() => this.connected);

    this.destroyMock.mockImplementation(() => {
      this.connected = false;
    });

    this.ensureDeviceReadyMock.mockResolvedValue(true);
  }

  async connect(deviceId: string): Promise<void> {
    return this.connectMock(deviceId);
  }

  async disconnect(): Promise<void> {
    return this.disconnectMock();
  }

  isConnected(): boolean {
    return this.isConnectedMock();
  }

  destroy(): void {
    return this.destroyMock();
  }

  ensureDeviceReady(deviceId: string): Promise<boolean> {
    return this.ensureDeviceReadyMock(deviceId);
  }

  setPendingOperation(pending: boolean): void {
    return this.setPendingOperationMock(pending);
  }

  // Test helpers
  simulateDisconnect(error?: Error): void {
    this.connected = false;
    this.options.onDisconnect?.(error);
  }

  simulateDeviceLocked(): void {
    this.options.onDeviceLocked?.();
  }

  simulateAppNotOpen(): void {
    this.options.onAppNotOpen?.();
  }

  simulateAwaitingConfirmation(): void {
    this.options.onAwaitingConfirmation?.();
  }

  getOptions(): HardwareWalletAdapterOptions {
    return this.options;
  }

  resetMocks(): void {
    this.connectMock.mockClear();
    this.disconnectMock.mockClear();
    this.isConnectedMock.mockClear();
    this.destroyMock.mockClear();
    this.ensureDeviceReadyMock.mockClear();
    this.setPendingOperationMock.mockClear();
  }

  reset(): void {
    // Reset internal state
    this.connected = false;
    // Reset mocks
    this.resetMocks();
    // Reset mock implementations to defaults
    this.connectMock.mockImplementation(async (_deviceId: string) => {
      this.connected = true;
    });
    this.disconnectMock.mockImplementation(async () => {
      this.connected = false;
    });
    this.isConnectedMock.mockImplementation(() => this.connected);
    this.destroyMock.mockImplementation(() => {
      this.connected = false;
    });
    this.ensureDeviceReadyMock.mockResolvedValue(true);
  }
}
