import { HardwareWalletError, ErrorCode } from '@metamask/hw-wallet-sdk';
import { ConnectionState } from './connectionState';
import {
  DeviceEvent,
  type HardwareWalletConnectionState,
} from './types';

export { createHardwareWalletError } from '../../../shared/lib/hardware-wallets/errors';

/**
 * Convert a HardwareWalletError to an appropriate connection state
 *
 * @param error - The hardware wallet error
 * @returns The corresponding connection state
 */
export function getConnectionStateFromError(
  error: HardwareWalletError,
): HardwareWalletConnectionState {
  switch (error.code) {
    case ErrorCode.AuthenticationDeviceLocked:
    case ErrorCode.AuthenticationDeviceBlocked:
    case ErrorCode.ConnectionTransportMissing:
    case ErrorCode.AuthenticationSecurityCondition:
    case ErrorCode.ConnectionClosed:
    case ErrorCode.DeviceDisconnected:
    case ErrorCode.UserRejected:
    case ErrorCode.UserCancelled:
    case ErrorCode.ConnectionTimeout:
      return ConnectionState.error(error);
    case ErrorCode.DeviceStateEthAppClosed:
      return ConnectionState.awaitingApp();
    default:
      return ConnectionState.error(error);
  }
}

/**
 * Map an error code to the appropriate device event
 *
 * @param code - The error code to map
 * @param defaultEvent - The default event to return if no specific mapping exists
 * @returns The corresponding DeviceEvent
 */
export function getDeviceEventForError(
  code: ErrorCode,
  defaultEvent: DeviceEvent = DeviceEvent.ConnectionFailed,
): DeviceEvent {
  switch (code) {
    case ErrorCode.AuthenticationDeviceLocked:
    case ErrorCode.AuthenticationDeviceBlocked:
      return DeviceEvent.DeviceLocked;
    case ErrorCode.DeviceStateEthAppClosed:
      return DeviceEvent.AppNotOpen;
    case ErrorCode.DeviceDisconnected:
    case ErrorCode.ConnectionClosed:
      return DeviceEvent.Disconnected;
    case ErrorCode.ConnectionTimeout:
      return DeviceEvent.OperationTimeout;
    case ErrorCode.ConnectionTransportMissing:
      return DeviceEvent.ConnectionFailed;
    default:
      return defaultEvent;
  }
}

export function isRetryableHardwareWalletError(error: HardwareWalletError) {
  switch (error.code) {
    case ErrorCode.AuthenticationDeviceLocked:
    case ErrorCode.DeviceStateEthAppClosed:
    case ErrorCode.ConnectionTransportMissing:
    case ErrorCode.AuthenticationSecurityCondition:
    case ErrorCode.ConnectionTimeout:
    case ErrorCode.ConnectionClosed:
    case ErrorCode.DeviceDisconnected:
    case ErrorCode.DeviceStateBlindSignNotSupported:
    case ErrorCode.PermissionCameraDenied:
    case ErrorCode.PermissionCameraPromptDismissed:
      return true;
    default:
      return false;
  }
}
