import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  LEDGER_ERROR_MAPPINGS,
} from '@metamask/hw-wallet-sdk';
import { ConnectionState } from './connectionState';
import {
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

  // Add custom properties for specific error codes not in mappings
  map.set(ErrorCode.AuthenticationSecurityCondition, {
    severity: Severity.Err,
    category: Category.Authentication,
    userMessage: 'Permission to access the device was denied',
  });

  map.set(ErrorCode.UserRejected, {
    severity: Severity.Warning,
    category: Category.UserAction,
    userMessage: 'Operation cancelled by user',
  });

  map.set(ErrorCode.UserCancelled, {
    severity: Severity.Warning,
    category: Category.UserAction,
    userMessage: 'Operation cancelled by user',
  });

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
 * Parse an unknown error and convert it to a HardwareWalletError
 *
 * @param error - The error to parse
 * @param walletType - The hardware wallet type
 * @returns A HardwareWalletError instance
 */
export function parseErrorByType(
  error: unknown,
  walletType: HardwareWalletType,
): HardwareWalletError {
  // If already a HardwareWalletError, return it
  if (error instanceof HardwareWalletError) {
    return error;
  }

  // Get error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorMessageLower = errorMessage.toLowerCase();
  const cause = error instanceof Error ? error : undefined;

  // Parse hardware wallet error codes using mappings from keyring-utils
  for (const [errorCode, mapping] of Object.entries(LEDGER_ERROR_MAPPINGS)) {
    if (errorMessageLower.includes(errorCode)) {
      return createHardwareWalletError(mapping.code, walletType, errorMessage, {
        cause,
      });
    }
  }

  // Parse common error patterns
  const errorPatterns = [
    {
      patterns: ['locked'],
      code: ErrorCode.AuthenticationDeviceLocked,
    },
    {
      patterns: ['app'],
      code: ErrorCode.DeviceStateEthAppClosed,
    },
    {
      patterns: ['rejected', 'denied', 'cancelled', 'canceled'],
      code: ErrorCode.UserRejected,
    },
    {
      patterns: ['timeout'],
      code: ErrorCode.ConnectionTimeout,
    },
    {
      patterns: ['webhid', 'hid'],
      code: ErrorCode.ConnectionTransportMissing,
    },
    {
      patterns: ['permission.*denied'],
      code: ErrorCode.AuthenticationSecurityCondition,
    },
    {
      patterns: ['disconnected', 'not found'],
      code: ErrorCode.DeviceDisconnected,
    },
    {
      patterns: ['connection', 'connect'],
      code: ErrorCode.ConnectionClosed,
    },
  ];

  for (const { patterns, code } of errorPatterns) {
    if (
      patterns.some((pattern) => {
        if (pattern.includes('.*')) {
          // Use regex for patterns with wildcards
          return new RegExp(pattern, 'u').test(errorMessageLower);
        }
        return errorMessageLower.includes(pattern);
      })
    ) {
      return createHardwareWalletError(code, walletType, errorMessage, {
        cause,
      });
    }
  }

  // Default to unknown error
  return createHardwareWalletError(
    ErrorCode.Unknown,
    walletType,
    errorMessage,
    { cause },
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
      return ConnectionState.error('locked', error);
    case ErrorCode.DeviceStateEthAppClosed:
      return ConnectionState.awaitingApp('not_open');
    case ErrorCode.ConnectionTransportMissing:
      return ConnectionState.error('webhid_not_available', error);
    case ErrorCode.AuthenticationSecurityCondition:
      return ConnectionState.error('webhid_permission_denied', error);
    case ErrorCode.ConnectionClosed:
    case ErrorCode.DeviceDisconnected:
      return ConnectionState.error('connection_failed', error);
    case ErrorCode.UserRejected:
    case ErrorCode.UserCancelled:
      return ConnectionState.error('user_rejected', error);
    case ErrorCode.ConnectionTimeout:
      return ConnectionState.error('timeout', error);
    default:
      return ConnectionState.error('unknown', error);
  }
}

export function isRetryableHardwareWalletError(
  error: HardwareWalletError,
): boolean {
  const retryableCodes = [
    ErrorCode.ConnectionTimeout,
    ErrorCode.ConnectionClosed,
    ErrorCode.DeviceDisconnected,
    ErrorCode.AuthenticationDeviceLocked,
    ErrorCode.AuthenticationDeviceBlocked,
    ErrorCode.AuthenticationSecurityCondition,
    ErrorCode.DeviceBtcOnlyFirmware,
    ErrorCode.DeviceIncompatibleMode,
    ErrorCode.DeviceStateBlindSignNotSupported,
    ErrorCode.DeviceStateOnlyV4Supported,
    ErrorCode.DeviceStateEthAppClosed,
  ];
  return retryableCodes.includes(error.code);
}
