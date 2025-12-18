/**
 * Utilities for handling hardware wallet errors across the RPC boundary
 */
import { JsonRpcError } from '@metamask/rpc-errors';
import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  RetryStrategy,
  parseErrorByType,
} from './errors';
import { HardwareWalletType } from './types';

const LOG_TAG = '[RpcErrorUtils]';

/**
 * Type guard to check if error is a JsonRpcError with HardwareWalletError data
 */
export function isJsonRpcHardwareWalletError(
  error: unknown,
): error is JsonRpcError & {
  data: {
    code: ErrorCode;
    severity?: string;
    category?: string;
    retryStrategy?: string;
    userActionable?: boolean;
    userMessage?: string;
    metadata?: Record<string, unknown>;
    documentationUrl?: string;
  };
} {
  return (
    error instanceof JsonRpcError &&
    error.data !== null &&
    typeof error.data === 'object' &&
    'code' in error.data &&
    typeof error.data.code === 'string'
  );
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
  if (isJsonRpcHardwareWalletError(error)) {
    return error.data.code;
  }

  // Also check if it's already a HardwareWalletError
  if (error instanceof HardwareWalletError) {
    return error.code;
  }

  // Check if it's a plain object with a code property
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code as ErrorCode;
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
  // Already a HardwareWalletError instance
  if (error instanceof HardwareWalletError) {
    return error;
  }

  // JsonRpcError with hardware wallet data
  if (isJsonRpcHardwareWalletError(error)) {
    console.log(LOG_TAG, 'Reconstructing HardwareWalletError from JsonRpcError');
    console.log(LOG_TAG, 'Error code:', error.data.code);
    console.log(LOG_TAG, 'Error data:', error.data);

    const hwError = new HardwareWalletError(
      error.message || error.data.userMessage || 'Hardware wallet error',
      {
        code: error.data.code,
        severity: error.data.severity as Severity,
        category: error.data.category as Category,
        retryStrategy: error.data.retryStrategy as RetryStrategy,
        userActionable: error.data.userActionable,
        userMessage: error.data.userMessage,
        metadata: error.data.metadata,
        documentationUrl: error.data.documentationUrl,
      },
    );

    // Preserve stack trace from the original error
    if (error.stack) {
      hwError.stack = error.stack;
    }

    return hwError;
  }

  // Fallback: use the error parser to create a HardwareWalletError
  console.log(LOG_TAG, 'Parsing unknown error type');
  return parseErrorByType(error, walletType);
}

/**
 * Wrapper for RPC calls that automatically reconstructs hardware wallet errors
 *
 * @param rpcCall - The RPC function to call
 * @param walletType - The hardware wallet type
 * @param onError - Optional callback to handle the reconstructed error before re-throwing
 * @returns The result of the RPC call
 * @throws The reconstructed HardwareWalletError if the call fails
 */
export async function callHardwareWalletRPC<T>(
  rpcCall: () => Promise<T>,
  walletType: HardwareWalletType,
  onError?: (error: HardwareWalletError) => void,
): Promise<T> {
  try {
    return await rpcCall();
  } catch (error) {
    console.error(LOG_TAG, 'RPC call failed:', error);

    // Reconstruct as a proper HardwareWalletError
    const hwError = reconstructHardwareWalletError(error, walletType);

    console.log(LOG_TAG, 'Reconstructed error:', {
      code: hwError.code,
      userActionable: hwError.userActionable,
      retryStrategy: hwError.retryStrategy,
    });

    // Allow caller to handle the error before re-throwing
    if (onError) {
      onError(hwError);
    }

    // Re-throw the reconstructed error
    throw hwError;
  }
}

/**
 * Check if an error code matches any of the specified codes
 *
 * @param error - The error to check
 * @param codes - Array of error codes to match against
 * @returns True if the error code matches any of the specified codes
 */
export function errorCodeMatches(
  error: unknown,
  codes: ErrorCode[],
): boolean {
  const errorCode = extractHardwareWalletErrorCode(error);
  return errorCode !== null && codes.includes(errorCode);
}

