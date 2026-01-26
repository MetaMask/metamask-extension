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
 * Map a numeric ErrorCode value to the enum
 *
 * @param numericCode - The numeric error code to map
 * @returns The corresponding ErrorCode enum value
 */
function mapNumericToErrorCode(numericCode: number): ErrorCode {
  const errorCodeValues = Object.values(ErrorCode).filter(
    (v): v is number => typeof v === 'number',
  );
  if (errorCodeValues.includes(numericCode)) {
    return numericCode as ErrorCode;
  }
  return ErrorCode.Unknown;
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
  debugger;
  try {
    // Log the raw error to understand its structure
    const errorAsAny = error as Record<string, unknown>;

    // If already a HardwareWalletError, return it
    if (error instanceof HardwareWalletError) {
      return error;
    }

    // Check if error has name === 'HardwareWalletError' (duck typing)
    // This handles cases where the class instance check fails due to different module instances
    if (
      errorAsAny?.name === 'HardwareWalletError' &&
      typeof errorAsAny?.code === 'number'
    ) {
      const errorCode = mapNumericToErrorCode(errorAsAny.code as number);
      const errorMessage =
        typeof errorAsAny?.message === 'string'
          ? errorAsAny.message
          : 'Hardware wallet error';
      return createHardwareWalletError(errorCode, walletType, errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }

    // Try to extract error code from data.cause structure
    // This is how errors look after crossing the RPC boundary
    const errorObj = error as {
      data?: {
        cause?: {
          name?: string;
          code?: number;
          message?: string;
        };
      };
      message?: string;
    };

    // Check for data.cause.name === 'HardwareWalletError'
    if (
      errorObj?.data?.cause?.name === 'HardwareWalletError' &&
      typeof errorObj.data.cause.code === 'number'
    ) {
      const causeCode = errorObj.data.cause.code;
      const causeMessage =
        errorObj.data.cause.message ?? 'Hardware wallet error';
      const mappedCode = mapNumericToErrorCode(causeCode);

      return createHardwareWalletError(mappedCode, walletType, causeMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }

    // Check for serialized TransportStatusError in data.cause
    // This handles cases where the Ledger error has been serialized across the RPC boundary
    const dataCause = errorObj?.data?.cause as
      | {
          name?: string;
          statusCode?: number;
          message?: string;
        }
      | undefined;
    if (
      (dataCause?.name === 'TransportStatusError' ||
        dataCause?.name === 'LockedDeviceError') &&
      typeof dataCause?.statusCode === 'number'
    ) {
      const { statusCode } = dataCause;
      const hexCode = `0x${statusCode.toString(16).padStart(4, '0')}`;
      const mapping =
        LEDGER_ERROR_MAPPINGS[hexCode as keyof typeof LEDGER_ERROR_MAPPINGS];
      const mappedCode = mapping?.code ?? ErrorCode.Unknown;
      const causeMessage = dataCause.message ?? 'Ledger device error';

      return createHardwareWalletError(mappedCode, walletType, causeMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }

    // Check for TransportStatusError (Ledger errors) by name or statusCode property
    // TransportStatusError has name: 'TransportStatusError' or 'LockedDeviceError'
    // and a numeric statusCode property (e.g., 0x6985 for user rejection)
    if (
      (errorAsAny?.name === 'TransportStatusError' ||
        errorAsAny?.name === 'LockedDeviceError') &&
      typeof errorAsAny?.statusCode === 'number'
    ) {
      const statusCode = errorAsAny.statusCode as number;
      const hexCode = `0x${statusCode.toString(16).padStart(4, '0')}`;
      const mapping =
        LEDGER_ERROR_MAPPINGS[hexCode as keyof typeof LEDGER_ERROR_MAPPINGS];
      const mappedCode = mapping?.code ?? ErrorCode.Unknown;
      const errorMessage =
        typeof errorAsAny?.message === 'string'
          ? errorAsAny.message
          : 'Ledger device error';

      return createHardwareWalletError(mappedCode, walletType, errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }

    // Check for any error with a numeric statusCode property (Ledger-style errors)
    // This handles cases where the error class check fails but statusCode is present
    if (
      typeof errorAsAny?.statusCode === 'number' &&
      errorAsAny.statusCode > 0
    ) {
      const statusCode = errorAsAny.statusCode as number;
      const hexCode = `0x${statusCode.toString(16).padStart(4, '0')}`;
      const mapping =
        LEDGER_ERROR_MAPPINGS[hexCode as keyof typeof LEDGER_ERROR_MAPPINGS];
      const mappedCode = mapping?.code ?? ErrorCode.Unknown;
      const errorMessage =
        typeof errorAsAny?.message === 'string'
          ? errorAsAny.message
          : 'Ledger device error';

      return createHardwareWalletError(mappedCode, walletType, errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }

    // Check for statusCode in error.data (serialized Ledger error format)
    const dataObj = errorObj?.data as { statusCode?: number } | undefined;
    if (typeof dataObj?.statusCode === 'number' && dataObj.statusCode > 0) {
      const { statusCode } = dataObj;
      const hexCode = `0x${statusCode.toString(16).padStart(4, '0')}`;
      const mapping =
        LEDGER_ERROR_MAPPINGS[hexCode as keyof typeof LEDGER_ERROR_MAPPINGS];
      const mappedCode = mapping?.code ?? ErrorCode.Unknown;
      const errorMessage =
        typeof errorAsAny?.message === 'string'
          ? errorAsAny.message
          : 'Ledger device error';

      return createHardwareWalletError(mappedCode, walletType, errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  } catch (parseError) {}

  // Get error message
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorMessageLower = errorMessage.toLowerCase();
  const cause = error instanceof Error ? error : undefined;

  // Parse hardware wallet error codes using mappings from keyring-utils
  // Only check Ledger mappings for Ledger wallets
  if (walletType === HardwareWalletType.Ledger) {
    for (const [errorCode, mapping] of Object.entries(LEDGER_ERROR_MAPPINGS)) {
      if (errorMessageLower.includes(errorCode.toLowerCase())) {
        return createHardwareWalletError(
          mapping.code,
          walletType,
          errorMessage,
          {
            cause,
          },
        );
      }
    }
  }

  // TODO: Add mappings for other hardware wallets

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
      return ConnectionState.error(error);
    case ErrorCode.DeviceStateEthAppClosed:
      return ConnectionState.awaitingApp();
    case ErrorCode.ConnectionTransportMissing:
      return ConnectionState.error(error);
    case ErrorCode.AuthenticationSecurityCondition:
      return ConnectionState.error(error);
    case ErrorCode.ConnectionClosed:
    case ErrorCode.DeviceDisconnected:
      return ConnectionState.error(error);
    case ErrorCode.UserRejected:
    case ErrorCode.UserCancelled:
      return ConnectionState.error(error);
    case ErrorCode.ConnectionTimeout:
      return ConnectionState.error(error);
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

/**
 * Check if an error is a HardwareWalletError.
 * Uses both instanceof check and duck typing as a fallback since errors
 * may lose their class type when crossing the RPC boundary.
 *
 * @param error - The error to check
 * @returns true if the error is a HardwareWalletError, false otherwise
 */
export function isHardwareWalletError(error: unknown): boolean {
  debugger;
  if (error instanceof HardwareWalletError) {
    return true;
  }

  // Duck typing fallback for errors that lost class type over RPC boundary
  const errorObj = error as { name?: string; code?: number };
  if (
    errorObj?.name === 'HardwareWalletError' &&
    typeof errorObj?.code === 'number'
  ) {
    return true;
  }

  // Check for RPC error format with data.code (from rpcErrors.internal())
  // This is the format used by metamask-controller when throwing hardware wallet errors
  const rpcErrorObj = error as {
    data?: {
      code?: number;
      category?: string;
      severity?: string;
    };
  };
  if (
    typeof rpcErrorObj?.data?.code === 'number' &&
    rpcErrorObj?.data?.category !== undefined
  ) {
    return true;
  }

  return false;
}

/**
 * Get the error code from a HardwareWalletError.
 * Handles both proper instances and duck-typed errors.
 *
 * @param error - The hardware wallet error
 * @returns The error code, or undefined if not available
 */
function getHardwareWalletErrorCode(error: unknown): ErrorCode | undefined {
  if (error instanceof HardwareWalletError) {
    return error.code;
  }

  // Check for direct code property (duck typing)
  const errorObj = error as { code?: number };
  if (typeof errorObj?.code === 'number') {
    return errorObj.code as ErrorCode;
  }

  // Check for RPC error format with data.code
  const rpcErrorObj = error as { data?: { code?: number } };
  if (typeof rpcErrorObj?.data?.code === 'number') {
    return rpcErrorObj.data.code as ErrorCode;
  }

  return undefined;
}

/**
 * Determine if a hardware wallet error is retryable by the user.
 * Retryable errors are transient issues where the user can take action
 * to resolve the problem and retry the operation.
 *
 * Examples of retryable errors:
 * - Device locked (user can unlock)
 * - Device blocked (user can unblock)
 *
 * Note: UserRejected and UserCancelled are NOT retryable - these represent
 * explicit user decisions to not proceed, and the transaction should be cancelled.
 *
 * @param error - The error to check
 * @returns true if the error is retryable, false otherwise
 */
export function isRetryableHardwareWalletError(error: unknown): boolean {
  const isHwError = isHardwareWalletError(error);
  if (!isHwError) {
    console.log('[isRetryableHardwareWalletError] Not a HW error:', {
      errorType: typeof error,
      errorName: (error as { name?: string })?.name,
      errorCode: (error as { code?: number })?.code,
      isInstanceOf: error instanceof HardwareWalletError,
    });
    return false;
  }

  const errorCode = getHardwareWalletErrorCode(error);
  if (errorCode === undefined) {
    console.log(
      '[isRetryableHardwareWalletError] Could not extract error code',
    );
    return false;
  }

  const retryableCodes = [
    ErrorCode.AuthenticationDeviceLocked,
    ErrorCode.AuthenticationDeviceBlocked,
    ErrorCode.DeviceStateEthAppClosed,
    ErrorCode.DeviceStateBlindSignNotSupported,
    ErrorCode.ConnectionClosed, // Can be connection closed or eth app closed.
  ];

  const isRetryable = retryableCodes.includes(errorCode);
  console.log('[isRetryableHardwareWalletError] Check result:', {
    errorCode,
    errorCodeName: ErrorCode[errorCode],
    retryableCodes: retryableCodes.map((c) => ErrorCode[c]),
    isRetryable,
  });

  return isRetryable;
}

/**
 * Check if a hardware wallet error is a user rejection.
 * User rejections occur when the user deliberately rejects/cancels on the device.
 * These are explicit user decisions and should NOT show an error modal.
 *
 * @param error - The error to check
 * @returns true if the error is a user rejection, false otherwise
 */
export function isUserRejectedHardwareWalletError(error: unknown): boolean {
  if (!isHardwareWalletError(error)) {
    return false;
  }

  const errorCode = getHardwareWalletErrorCode(error);
  return (
    errorCode === ErrorCode.UserRejected ||
    errorCode === ErrorCode.UserCancelled
  );
}
