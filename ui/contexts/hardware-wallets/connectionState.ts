import { ConnectionStatus, type HardwareWalletConnectionState } from './types';

/**
 * Factory functions for creating connection state objects
 * These ensure type-safe state transitions
 */
export const ConnectionState = {
  disconnected: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.DISCONNECTED,
  }),

  connecting: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.CONNECTING,
  }),

  connected: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.CONNECTED,
  }),

  ready: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.READY,
  }),

  awaitingConfirmation: (): HardwareWalletConnectionState => ({
    status: ConnectionStatus.AWAITING_CONFIRMATION,
  }),

  awaitingApp: (
    reason: string,
    appName?: string,
  ): HardwareWalletConnectionState => ({
    status: ConnectionStatus.AWAITING_APP,
    reason,
    appName,
  }),

  error: (reason: string, error: Error): HardwareWalletConnectionState => ({
    status: ConnectionStatus.ERROR,
    reason,
    error,
  }),
};
