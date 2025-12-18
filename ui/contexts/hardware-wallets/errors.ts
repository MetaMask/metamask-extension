import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  RetryStrategy,
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
 * @param options.documentationUrl - URL to documentation about this error
 * @returns A new HardwareWalletError instance
 */
export function createHardwareWalletError(
  code: ErrorCode,
  walletType: HardwareWalletType,
  message?: string,
  options?: {
    cause?: Error;
    metadata?: Record<string, unknown>;
    documentationUrl?: string;
  },
): HardwareWalletError {
  // Determine error properties based on error code
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
    documentationUrl: options?.documentationUrl,
  });
}

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
  switch (code) {
    case ErrorCode.AUTH_LOCK_001:
      return {
        severity: Severity.ERROR,
        category: Category.AUTHENTICATION,
        retryStrategy: RetryStrategy.RETRY,
        userActionable: true,
        userMessage: 'Please unlock your hardware wallet device',
      };
    case ErrorCode.DEVICE_STATE_001:
      return {
        severity: Severity.ERROR,
        category: Category.DEVICE_STATE,
        retryStrategy: RetryStrategy.RETRY,
        userActionable: true,
        userMessage: 'Please open the Ethereum app on your device',
      };
    case ErrorCode.CONN_TRANSPORT_001:
      return {
        severity: Severity.ERROR,
        category: Category.CONNECTION,
        retryStrategy: RetryStrategy.NO_RETRY,
        userActionable: true,
        userMessage: 'WebHID is not available in your browser',
      };
    case ErrorCode.CONFIG_PERM_001:
      return {
        severity: Severity.ERROR,
        category: Category.CONFIGURATION,
        retryStrategy: RetryStrategy.RETRY,
        userActionable: true,
        userMessage: 'Permission to access the device was denied',
      };
    case ErrorCode.USER_CANCEL_001:
    case ErrorCode.USER_CANCEL_002:
      return {
        severity: Severity.WARNING,
        category: Category.USER_ACTION,
        retryStrategy: RetryStrategy.NO_RETRY,
        userActionable: false,
        userMessage: 'Operation cancelled by user',
      };
    case ErrorCode.CONN_TIMEOUT_001:
      return {
        severity: Severity.ERROR,
        category: Category.CONNECTION,
        retryStrategy: RetryStrategy.RETRY,
        userActionable: true,
        userMessage: 'Connection timeout. Please try again',
      };
    case ErrorCode.CONN_CLOSED_001:
    case ErrorCode.DEVICE_STATE_003:
      return {
        severity: Severity.ERROR,
        category: Category.CONNECTION,
        retryStrategy: RetryStrategy.RETRY,
        userActionable: true,
        userMessage: 'Device connection failed. Please reconnect your device',
      };
    default:
      return {
        severity: Severity.ERROR,
        category: Category.UNKNOWN,
        retryStrategy: RetryStrategy.NO_RETRY,
        userActionable: false,
        userMessage: 'An unknown error occurred',
      };
  }
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

  // Parse Ledger-specific error codes (hex codes from Ledger APDU responses)
  if (errorMessageLower.includes('0x5515')) {
    return createHardwareWalletError(
      ErrorCode.AUTH_LOCK_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (
    errorMessageLower.includes('0x6804') ||
    errorMessageLower.includes('0x6511') ||
    errorMessageLower.includes('0x6d00')
  ) {
    return createHardwareWalletError(
      ErrorCode.DEVICE_STATE_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (
    errorMessageLower.includes('0x5501') ||
    errorMessageLower.includes('0x6985')
  ) {
    return createHardwareWalletError(
      ErrorCode.USER_CANCEL_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  // Parse common error patterns
  if (errorMessageLower.includes('locked')) {
    return createHardwareWalletError(
      ErrorCode.AUTH_LOCK_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (errorMessageLower.includes('app')) {
    return createHardwareWalletError(
      ErrorCode.DEVICE_STATE_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (
    errorMessageLower.includes('rejected') ||
    errorMessageLower.includes('denied') ||
    errorMessageLower.includes('cancelled') ||
    errorMessageLower.includes('canceled')
  ) {
    return createHardwareWalletError(
      ErrorCode.USER_CANCEL_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (errorMessageLower.includes('timeout')) {
    return createHardwareWalletError(
      ErrorCode.CONN_TIMEOUT_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (
    errorMessageLower.includes('webhid') ||
    errorMessageLower.includes('hid')
  ) {
    return createHardwareWalletError(
      ErrorCode.CONN_TRANSPORT_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (
    errorMessageLower.includes('permission') &&
    errorMessageLower.includes('denied')
  ) {
    return createHardwareWalletError(
      ErrorCode.CONFIG_PERM_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (
    errorMessageLower.includes('disconnected') ||
    errorMessageLower.includes('not found')
  ) {
    return createHardwareWalletError(
      ErrorCode.DEVICE_STATE_003,
      walletType,
      errorMessage,
      { cause },
    );
  }

  if (
    errorMessageLower.includes('connection') ||
    errorMessageLower.includes('connect')
  ) {
    return createHardwareWalletError(
      ErrorCode.CONN_CLOSED_001,
      walletType,
      errorMessage,
      { cause },
    );
  }

  // Default to unknown error
  return createHardwareWalletError(
    ErrorCode.UNKNOWN_001,
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
    case ErrorCode.AUTH_LOCK_001:
    case ErrorCode.AUTH_LOCK_002:
      return ConnectionState.error('locked', error);
    case ErrorCode.DEVICE_STATE_001:
      return ConnectionState.awaitingApp('not_open');
    case ErrorCode.CONN_TRANSPORT_001:
      return ConnectionState.error('webhid_not_available', error);
    case ErrorCode.CONFIG_PERM_001:
      return ConnectionState.error('webhid_permission_denied', error);
    case ErrorCode.CONN_CLOSED_001:
    case ErrorCode.DEVICE_STATE_003:
      return ConnectionState.error('connection_failed', error);
    case ErrorCode.USER_CANCEL_001:
    case ErrorCode.USER_CANCEL_002:
      return ConnectionState.error('user_rejected', error);
    case ErrorCode.CONN_TIMEOUT_001:
      return ConnectionState.error('timeout', error);
    default:
      return ConnectionState.error('unknown', error);
  }
}
