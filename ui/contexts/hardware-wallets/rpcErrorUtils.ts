/**
 * Utilities for handling hardware wallet errors across the RPC boundary
 */
import { JsonRpcError } from '@metamask/rpc-errors';
import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  LEDGER_ERROR_MAPPINGS,
} from '@metamask/hw-wallet-sdk';
import {
  is,
  object,
  type as superstructType,
  string,
  number,
  literal,
  optional,
  record,
  unknown,
  union,
  type Infer,
} from '@metamask/superstruct';
import { HardwareWalletType } from './types';
import { createHardwareWalletError } from './errors';

/**
 * Struct for a serialized HardwareWalletError cause object.
 * This represents the structure of a HardwareWalletError after it has been
 * serialized across the RPC boundary.
 */
const SerializedHardwareWalletErrorCauseStruct = object({
  name: literal('HardwareWalletError'),
  message: string(),
  stack: optional(string()),
  code: number(),
});

/**
 * Struct for a serialized RPC error containing a HardwareWalletError.
 * The error is wrapped in data.cause after crossing the RPC boundary.
 * The data object may also contain additional metadata (like recreatedTxId)
 * that was attached when the error was thrown via rpcErrors.internal().
 *
 * Uses superstructType() instead of object() to allow additional properties.
 */
const SerializedRpcHardwareWalletErrorStruct = superstructType({
  data: superstructType({
    cause: SerializedHardwareWalletErrorCauseStruct,
    // Additional metadata from rpcErrors.internal({ data: { metadata: {...} } })
    metadata: optional(record(string(), unknown())),
  }),
  code: number(),
});

/**
 * Struct for HardwareWalletError data embedded in a JsonRpcError.
 * The code can be either a string ErrorCode name (e.g., "AuthenticationDeviceLocked")
 * or a numeric ErrorCode value (e.g., 1100) depending on how it was serialized.
 *
 * Uses superstructType() instead of object() to allow additional properties
 * that may be added by the RPC layer (e.g., cause).
 */
const HardwareWalletErrorDataStruct = superstructType({
  code: union([string(), number()]),
  severity: optional(string()),
  category: optional(string()),
  userMessage: optional(string()),
  metadata: optional(record(string(), unknown())),
});

/**
 * Struct for a deserialized JsonRpcError with HardwareWalletError data.
 * After RPC serialization, the error becomes a plain object.
 *
 * Uses superstructType() instead of object() to allow additional properties
 * that may be present on the deserialized error (e.g., name, cause).
 */
const DeserializedJsonRpcHardwareWalletErrorStruct = superstructType({
  message: optional(string()),
  code: optional(number()),
  stack: optional(string()),
  data: HardwareWalletErrorDataStruct,
});

/**
 * Struct for a plain object with an ErrorCode property (string or number).
 */
const PlainObjectWithErrorCodeStruct = object({
  code: union([string(), number()]),
});

/**
 * Type for the serialized HardwareWalletError cause
 */
type SerializedHardwareWalletErrorCause = Infer<
  typeof SerializedHardwareWalletErrorCauseStruct
>;

/**
 * Type for the serialized RPC error containing a HardwareWalletError
 */
type SerializedRpcHardwareWalletError = Infer<
  typeof SerializedRpcHardwareWalletErrorStruct
>;

/**
 * Type for HardwareWalletError data in a JsonRpcError
 */
type HardwareWalletErrorData = Infer<typeof HardwareWalletErrorDataStruct>;

/**
 * Type for a deserialized JsonRpcError with HardwareWalletError data
 */
type DeserializedJsonRpcHardwareWalletError = Infer<
  typeof DeserializedJsonRpcHardwareWalletErrorStruct
>;

/**
 * Type for a plain object with an ErrorCode
 */
type PlainObjectWithErrorCode = Infer<typeof PlainObjectWithErrorCodeStruct>;

/**
 * Check if an error is a serialized RPC error containing a HardwareWalletError
 *
 * @param error - The error to check
 * @returns True if the error matches the serialized RPC HardwareWalletError structure
 */
function isSerializedRpcHardwareWalletError(
  error: unknown,
): error is SerializedRpcHardwareWalletError {
  return is(error, SerializedRpcHardwareWalletErrorStruct);
}

/**
 * Check if an error is a deserialized JsonRpcError with HardwareWalletError data
 *
 * @param error - The error to check
 * @returns True if the error matches the deserialized JsonRpcError structure
 */
function isDeserializedJsonRpcHardwareWalletError(
  error: unknown,
): error is DeserializedJsonRpcHardwareWalletError {
  return is(error, DeserializedJsonRpcHardwareWalletErrorStruct);
}

/**
 * Check if an error is a plain object with an ErrorCode
 *
 * @param error - The error to check
 * @returns True if the error is a plain object with a string code property
 */
function isPlainObjectWithErrorCode(
  error: unknown,
): error is PlainObjectWithErrorCode {
  return is(error, PlainObjectWithErrorCodeStruct);
}

/**
 * Type guard to check if error is a JsonRpcError with HardwareWalletError data
 * Handles both actual JsonRpcError instances AND plain objects that were
 * deserialized from JsonRpcError (which lose their class type across RPC boundary)
 *
 * @param error - The error to check
 * @returns True if the error is a JsonRpcError with HardwareWalletError data
 */
function isJsonRpcHardwareWalletError(
  error: unknown,
): error is JsonRpcError<HardwareWalletErrorData> & {
  data: HardwareWalletErrorData;
} {
  // Check for actual JsonRpcError instance
  if (error instanceof JsonRpcError) {
    return is(error.data, HardwareWalletErrorDataStruct);
  }

  // Check for deserialized JsonRpcError (plain object with data property)
  return isDeserializedJsonRpcHardwareWalletError(error);
}
/**
 * Convert a serialized HardwareWalletError cause to a HardwareWalletError instance
 *
 * @param cause - The serialized cause object
 * @param walletType - The hardware wallet type
 * @param parentData - Optional parent data object that may contain additional metadata
 * @param parentData.metadata - Optional metadata from the parent error (e.g., recreatedTxId)
 * @returns A reconstructed HardwareWalletError instance
 */
function convertSerializedCauseToHardwareWalletError(
  cause: SerializedHardwareWalletErrorCause,
  walletType: HardwareWalletType,
  parentData?: { metadata?: Record<string, unknown> },
): HardwareWalletError {
  const errorCode = mapNumericCodeToErrorCode(cause.code);

  // Extract metadata from parent data if available (e.g., recreatedTxId)
  // This is needed because when the error crosses the RPC boundary, custom
  // metadata like recreatedTxId is placed in the parent data object, not in data.cause
  const metadata = parentData?.metadata;

  const hwError = createHardwareWalletError(
    errorCode,
    walletType,
    cause.message,
    { metadata },
  );

  // Preserve the original stack trace if available
  if (cause.stack) {
    hwError.stack = cause.stack;
  }

  return hwError;
}

/**
 * Convert HardwareWalletErrorData to a HardwareWalletError instance
 *
 * @param data - The hardware wallet error data
 * @param message - The error message
 * @param walletType - The hardware wallet type to include in metadata
 * @param stack - Optional stack trace
 * @returns A reconstructed HardwareWalletError instance
 */
function convertDataToHardwareWalletError(
  data: HardwareWalletErrorData,
  message: string,
  walletType: HardwareWalletType,
  stack?: string,
): HardwareWalletError {
  // Handle both string and numeric error codes
  const errorCode =
    typeof data.code === 'number'
      ? mapNumericCodeToErrorCode(data.code)
      : mapStringCodeToErrorCode(data.code);

  const hwError = new HardwareWalletError(
    message || data.userMessage || 'Hardware wallet error',
    {
      code: errorCode,
      severity: data.severity as Severity,
      category: data.category as Category,
      userMessage: data.userMessage ?? '',
      metadata: {
        ...(data.metadata as Record<string, unknown>),
        walletType,
      },
    },
  );

  if (stack) {
    hwError.stack = stack;
  }

  return hwError;
}

/**
 * Map a numeric error code from serialized error to an ErrorCode enum value
 *
 * @param numericCode - The numeric error code
 * @returns The corresponding ErrorCode enum value
 */
function mapNumericCodeToErrorCode(numericCode: number): ErrorCode {
  const errorCodeValues = Object.values(ErrorCode).filter(
    (v): v is number => typeof v === 'number',
  );

  if (errorCodeValues.includes(numericCode)) {
    return numericCode as ErrorCode;
  }

  return ErrorCode.Unknown;
}

/**
 * Map a string error code name to an ErrorCode enum value
 * Handles cases where the code is serialized as the enum key name (e.g., "ConnectionClosed")
 *
 * @param stringCode - The string error code name
 * @returns The corresponding ErrorCode enum value
 */
function mapStringCodeToErrorCode(stringCode: string): ErrorCode {
  // Check if it's a valid ErrorCode key name
  const errorCodeKey = stringCode as keyof typeof ErrorCode;
  if (errorCodeKey in ErrorCode) {
    return ErrorCode[errorCodeKey];
  }

  // Try parsing as a number (in case it's a numeric string)
  const numericCode = parseInt(stringCode, 10);
  if (!Number.isNaN(numericCode)) {
    return mapNumericCodeToErrorCode(numericCode);
  }

  return ErrorCode.Unknown;
}

/**
 * Extract a hex status code from an error message
 * Handles formats like "Locked device (0x5515)" or "Error 0x6982"
 *
 * @param message - The error message to parse
 * @returns The hex status code if found (e.g., "0x5515"), null otherwise
 */
function extractHexStatusCodeFromMessage(message: string): string | null {
  const hexMatch = message.match(/0x[\da-fA-F]{4}/u);
  return hexMatch ? hexMatch[0].toLowerCase() : null;
}

/**
 * Map a Ledger status code (hex string) to an ErrorCode
 *
 * @param statusCode - The Ledger status code (e.g., "0x5515")
 * @returns The corresponding ErrorCode, or ErrorCode.Unknown if not found
 */
function mapLedgerStatusCodeToErrorCode(statusCode: string): ErrorCode {
  const mapping =
    LEDGER_ERROR_MAPPINGS[statusCode as keyof typeof LEDGER_ERROR_MAPPINGS];
  return mapping?.code ?? ErrorCode.Unknown;
}

/**
 * Get a human-readable name for an ErrorCode
 *
 * @param code - The error code
 * @returns The name of the error code or the code itself
 */
function getErrorCodeName(code: ErrorCode): string {
  const entries = Object.entries(ErrorCode);
  const entry = entries.find(([, value]) => value === code);
  return entry ? entry[0] : String(code);
}

// #endregion

// #region Exported Functions

/**
 * Map a code (string or number) to an ErrorCode
 *
 * @param code - The error code (string name or numeric value)
 * @returns The corresponding ErrorCode enum value
 */
function mapCodeToErrorCode(code: string | number): ErrorCode {
  return typeof code === 'number'
    ? mapNumericCodeToErrorCode(code)
    : mapStringCodeToErrorCode(code);
}

/**
 * Extract HardwareWalletError code from a JsonRpcError
 *
 * @param error - The error to extract from
 * @returns The ErrorCode if found, null otherwise
 */
export function extractHardwareWalletErrorCode(
  error: unknown,
): ErrorCode | null {
  // Check for serialized RPC error with cause
  if (isSerializedRpcHardwareWalletError(error)) {
    return mapNumericCodeToErrorCode(error.data.cause.code);
  }

  // Check for JsonRpcError with hardware wallet data
  if (isJsonRpcHardwareWalletError(error)) {
    return mapCodeToErrorCode(error.data.code);
  }

  // Check if it's already a HardwareWalletError instance
  if (error instanceof HardwareWalletError) {
    return error.code;
  }

  // Check if it's a plain object with a code property
  if (isPlainObjectWithErrorCode(error)) {
    return mapCodeToErrorCode(error.code);
  }

  return null;
}

/**
 * Reconstruct a HardwareWalletError from a JsonRpcError
 *
 * When errors cross the RPC boundary, they lose their class instance type.
 * This function reconstructs a proper HardwareWalletError from the serialized data.
 *
 * @param error - The error to reconstruct
 * @param walletType - The hardware wallet type
 * @returns A reconstructed HardwareWalletError
 */
export function reconstructHardwareWalletError(
  error: unknown,
  walletType: HardwareWalletType,
): HardwareWalletError {
  // Log full error structure for debugging
  const errorData = (error as { data?: unknown })?.data;
  console.log(LOG_TAG, 'reconstructHardwareWalletError called with:', {
    error,
    errorType: typeof error,
    isHardwareWalletError: error instanceof HardwareWalletError,
    isJsonRpcErrorInstance: error instanceof JsonRpcError,
    hasData: Boolean(errorData),
    dataKeys:
      errorData && typeof errorData === 'object'
        ? Object.keys(errorData)
        : null,
    dataCode: (errorData as { code?: unknown })?.code,
    dataCodeType: typeof (errorData as { code?: unknown })?.code,
    dataMetadata: (errorData as { metadata?: unknown })?.metadata,
  });

  // Already a HardwareWalletError instance
  if (error instanceof HardwareWalletError) {
    return error;
  }

  // Check for serialized RPC error with HardwareWalletError in data.cause
  // Structure: { data: { cause: { name: 'HardwareWalletError', ... }, metadata?: {...} }, code: -32603 }
  if (isSerializedRpcHardwareWalletError(error)) {
    // Pass parent data which contains metadata like recreatedTxId
    // When the error is thrown via rpcErrors.internal({ data: { metadata: { recreatedTxId } } }),
    // the metadata is in error.data.metadata, not in error.data.cause
    return convertSerializedCauseToHardwareWalletError(
      error.data.cause,
      walletType,
      error.data,
    );
  }

  // JsonRpcError with hardware wallet data (data.code is a string or numeric ErrorCode)
  if (isJsonRpcHardwareWalletError(error)) {
    const hwError = convertDataToHardwareWalletError(
      error.data,
      error.message || '',
      walletType,
      error.stack,
    );

    return hwError;
  }

  // Helper to extract message from error (handles plain objects from RPC boundary)
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    // Handle plain objects with message property (from RPC boundary)
    const errObj = err as { message?: string };
    if (errObj?.message && typeof errObj.message === 'string') {
      return errObj.message;
    }
    return String(err);
  };

  // For Ledger errors, the status code might be in the error message
  // (e.g., "Device is locked (Ledger device: Locked device (0x5515))")
  if (walletType === HardwareWalletType.Ledger) {
    const errorMessage = getErrorMessage(error);
    const hexStatusCode = extractHexStatusCodeFromMessage(errorMessage);

    if (hexStatusCode) {
      const errorCode = mapLedgerStatusCodeToErrorCode(hexStatusCode);

      return createHardwareWalletError(errorCode, walletType, errorMessage, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  } else {
  }

  // Fallback: use the error parser to create a HardwareWalletError
  const fallbackMessage = getErrorMessage(error);
  return createHardwareWalletError(
    ErrorCode.Unknown,
    walletType,
    fallbackMessage,
  );
}

// #endregion
