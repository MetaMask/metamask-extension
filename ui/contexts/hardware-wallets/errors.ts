import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  RetryStrategy,
  HARDWARE_MAPPINGS,
} from '@metamask/keyring-utils';
import { ConnectionState } from './connectionState';
import {
  HardwareWalletType,
  type HardwareWalletConnectionState,
} from './types';

/**
 * Re-export types from @metamask/keyring-utils for convenience
 */
export { HardwareWalletError, ErrorCode, Severity, Category, RetryStrategy };

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
  const { severity, category, retryStrategy, userActionable, userMessage } =
    getErrorProperties(code);

  return new HardwareWalletError(message || userMessage, {
    code,
    severity,
    category,
    retryStrategy,
    userActionable,
    userMessage,
    cause: options?.cause,
    metadata: {
      ...options?.metadata,
      walletType,
    },
  });
}

/**
 * Error properties map built from HARDWARE_MAPPINGS
 */
const ERROR_PROPERTIES_MAP = (() => {
  const map = new Map<
    ErrorCode,
    {
      severity: Severity;
      category: Category;
      retryStrategy: RetryStrategy;
      userActionable: boolean;
      userMessage: string;
    }
  >();

  // Extract properties from HARDWARE_MAPPINGS
  const extractFromMappings = (
    mappings: Record<
      string,
      {
        customCode?: ErrorCode;
        severity?: Severity;
        category?: Category;
        retryStrategy?: RetryStrategy;
        userActionable?: boolean;
        userMessage?: string;
      }
    >,
  ) => {
    for (const mapping of Object.values(mappings)) {
      if (mapping.customCode && typeof mapping.customCode === 'number') {
        map.set(mapping.customCode, {
          severity: mapping.severity ?? Severity.Err,
          category: mapping.category ?? Category.Unknown,
          retryStrategy: mapping.retryStrategy ?? RetryStrategy.NoRetry,
          userActionable: mapping.userActionable ?? false,
          userMessage: mapping.userMessage ?? 'An error occurred',
        });
      }
    }
  };

  // Extract from Ledger and Trezor mappings
  extractFromMappings(HARDWARE_MAPPINGS.ledger.errorMappings);
  extractFromMappings(HARDWARE_MAPPINGS.trezor.errorMappings);

  // Add custom properties for specific error codes not in mappings
  map.set(ErrorCode.AuthSecurityCondition, {
    severity: Severity.Err,
    category: Category.Authentication,
    retryStrategy: RetryStrategy.Retry,
    userActionable: true,
    userMessage: 'Permission to access the device was denied',
  });

  map.set(ErrorCode.UserRejected, {
    severity: Severity.Warning,
    category: Category.UserAction,
    retryStrategy: RetryStrategy.NoRetry,
    userActionable: false,
    userMessage: 'Operation cancelled by user',
  });

  map.set(ErrorCode.UserCancelled, {
    severity: Severity.Warning,
    category: Category.UserAction,
    retryStrategy: RetryStrategy.NoRetry,
    userActionable: false,
    userMessage: 'Operation cancelled by user',
  });

  return map;
})();

/**
 * Get error properties based on error code
 *
 * @param code - The error code to get properties for
 * @returns Error properties including severity, category, retry strategy, etc.
 */
function getErrorProperties(code: ErrorCode): {
  severity: Severity;
  category: Category;
  retryStrategy: RetryStrategy;
  userActionable: boolean;
  userMessage: string;
} {
  return (
    ERROR_PROPERTIES_MAP.get(code) ?? {
      severity: Severity.Err,
      category: Category.Unknown,
      retryStrategy: RetryStrategy.NoRetry,
      userActionable: false,
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
  const ledgerMappings = HARDWARE_MAPPINGS.ledger.errorMappings;
  for (const [errorCode, mapping] of Object.entries(ledgerMappings)) {
    if (errorMessageLower.includes(errorCode)) {
      return createHardwareWalletError(
        mapping.customCode,
        walletType,
        errorMessage,
        { cause },
      );
    }
  }

  // Check Trezor mappings
  const trezorMappings = HARDWARE_MAPPINGS.trezor.errorMappings;
  for (const [errorKey, mapping] of Object.entries(trezorMappings)) {
    if (errorMessageLower.includes(errorKey.toLowerCase())) {
      return createHardwareWalletError(
        mapping.customCode,
        walletType,
        errorMessage,
        { cause },
      );
    }
  }

  // Parse common error patterns
  const errorPatterns = [
    {
      patterns: ['locked'],
      code: ErrorCode.AuthDeviceLocked,
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
      code: ErrorCode.ConnTimeout,
    },
    {
      patterns: ['webhid', 'hid'],
      code: ErrorCode.ConnTransportMissing,
    },
    {
      patterns: ['permission.*denied'],
      code: ErrorCode.AuthSecurityCondition,
    },
    {
      patterns: ['disconnected', 'not found'],
      code: ErrorCode.DeviceDisconnected,
    },
    {
      patterns: ['connection', 'connect'],
      code: ErrorCode.ConnClosed,
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
    case ErrorCode.AuthDeviceLocked:
    case ErrorCode.AuthDeviceBlocked:
      return ConnectionState.error('locked', error);
    case ErrorCode.DeviceStateEthAppClosed:
      return ConnectionState.awaitingApp('not_open');
    case ErrorCode.ConnTransportMissing:
      return ConnectionState.error('webhid_not_available', error);
    case ErrorCode.AuthSecurityCondition:
      return ConnectionState.error('webhid_permission_denied', error);
    case ErrorCode.ConnClosed:
    case ErrorCode.DeviceDisconnected:
      return ConnectionState.error('connection_failed', error);
    case ErrorCode.UserRejected:
    case ErrorCode.UserCancelled:
      return ConnectionState.error('user_rejected', error);
    case ErrorCode.ConnTimeout:
      return ConnectionState.error('timeout', error);
    default:
      return ConnectionState.error('unknown', error);
  }
}
