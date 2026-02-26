import { ConnectionStatus, type HardwareWalletConnectionState } from './types';

/**
 * Factory functions for creating connection state objects
 * These ensure type-safe state transitions
 */
export const ConnectionState = {
  disconnected: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.Disconnected,
  }),

  connecting: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.Connecting,
  }),

  connected: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.Connected,
  }),

  ready: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.Ready,
  }),

  awaitingConfirmation: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.AwaitingConfirmation,
  }),

  awaitingApp: (appName?: string): HardwareWalletConnectionState => ({
    status: ConnectionStatus.AwaitingApp,
    appName,
  }),

  error: (error: Error): HardwareWalletConnectionState => ({
    status: ConnectionStatus.ErrorState,
    error,
  }),
};
