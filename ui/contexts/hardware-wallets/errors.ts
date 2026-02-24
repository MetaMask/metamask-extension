import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  LEDGER_ERROR_MAPPINGS,
} from '@metamask/hw-wallet-sdk';
import { ConnectionState } from './connectionState';
import {
  DeviceEvent,
  HardwareWalletType,
  type HardwareWalletConnectionState,
} from './types';

/**
 * Factory function to create hardware wallet errors
 *
 * @param code - The error code from ErrorCode enum
 * @param walletType - The hardware wallet type
 * @param message - Optional custom error message
 * @param options - Optional error options
 * @param options.cause - The underlying error that caused this error
 * @param options.metadata - Additional metadata about the error
 * @returns A new HardwareWalletError instance
 */
export function createHardwareWalletError(
  code: ErrorCode,
  walletType: HardwareWalletType,
  message?: string,
  options?: {
    cause?: Error;
    metadata?: Record<string, unknown>;
  },
): HardwareWalletError {
  // Get error properties based on error code
  const { severity, category, userMessage } = getErrorProperties(code);

  return new HardwareWalletError(message || userMessage, {
    code,
    severity,
    category,
    userMessage,
    cause: options?.cause,
    metadata: {
      ...options?.metadata,
      walletType,
    },
  });
}

/**
 * Error properties map built from LEDGER_ERROR_MAPPINGS
 */
const ERROR_PROPERTIES_MAP = (() => {
  const map = new Map<
    ErrorCode,
    {
      severity: Severity;
      category: Category;
      userMessage: string;
    }
  >();

  // Extract properties from HARDWARE_MAPPINGS
  const extractFromMappings = (
    mappings: Record<
      string,
      {
        code?: ErrorCode;
        severity?: Severity;
        category?: Category;
        userMessage?: string;
      }
    >,
  ) => {
    for (const mapping of Object.values(mappings)) {
      if (mapping.code && typeof mapping.code === 'number') {
        map.set(mapping.code, {
          severity: mapping.severity ?? Severity.Err,
          category: mapping.category ?? Category.Unknown,
          userMessage: mapping.userMessage ?? 'An error occurred',
        });
      }
    }
  };

  // Extract from Ledger
  extractFromMappings(LEDGER_ERROR_MAPPINGS);

  return map;
})();

/**
 * Get error properties based on error code
 *
 * @param code - The error code to get properties for
 * @returns Error properties including severity, category, etc.
 */
function getErrorProperties(code: ErrorCode): {
  severity: Severity;
  category: Category;
  userMessage: string;
} {
  return (
    ERROR_PROPERTIES_MAP.get(code) ?? {
      severity: Severity.Err,
      category: Category.Unknown,
      userMessage: 'An unknown error occurred',
    }
  );
}

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
      return true;
    default:
      return false;
  }
}
