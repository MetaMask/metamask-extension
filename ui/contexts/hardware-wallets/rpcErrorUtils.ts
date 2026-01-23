/**
 * Utilities for handling hardware wallet errors across the RPC boundary
 */
import { JsonRpcError } from '@metamask/rpc-errors';
import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
} from '@metamask/hw-wallet-sdk';
import { HardwareWalletType } from './types';
import { createHardwareWalletError } from './errors';

type HardwareWalletErrorData = {
  [key: string]: unknown;
  code: ErrorCode;
  severity?: string;
  category?: string;
  userMessage?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Known valid ErrorCode values from @metamask/hw-wallet-sdk
 * This whitelist ensures we only accept valid error codes
 */
const VALID_ERROR_CODES = new Set<number>([
  ErrorCode.AuthenticationSecurityCondition,
  ErrorCode.UserRejected,
  ErrorCode.UserCancelled,
  ErrorCode.Unknown,
  ErrorCode.AuthenticationDeviceLocked,
  ErrorCode.AuthenticationDeviceBlocked,
  ErrorCode.DeviceStateEthAppClosed,
  ErrorCode.ConnectionTransportMissing,
  ErrorCode.ConnectionClosed,
  ErrorCode.DeviceDisconnected,
  ErrorCode.ConnectionTimeout,
]);

function isValidErrorCode(code: unknown): code is ErrorCode {
  return typeof code === 'number' && VALID_ERROR_CODES.has(code);
}

/**
 * Type guard to check if error is a JsonRpcError with HardwareWalletError data
 *
 * @param error - The error to check
 * @returns True if the error is a JsonRpcError with HardwareWalletError data
 */
export function isJsonRpcHardwareWalletError(
  error: unknown,
): error is JsonRpcError<HardwareWalletErrorData> & {
  data: HardwareWalletErrorData;
} {
  return (
    error instanceof JsonRpcError &&
    error.data !== null &&
    error.data !== undefined &&
    typeof error.data === 'object' &&
    'code' in error.data &&
    isValidErrorCode(error.data.code)
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

  // Check if it's a plain object with a valid ErrorCode
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    isValidErrorCode(error.code)
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
    const hwError = new HardwareWalletError(
      error.message ||
        error.data.userMessage ||
        'Hardware wallet error occurred',
      {
        code: error.data.code,
        severity: (error?.data?.severity as Severity) ?? Severity.Err,
        category: (error?.data?.category as Category) ?? Category.Unknown,
        userMessage:
          error?.data?.userMessage ?? 'Hardware wallet error occurred',
        metadata: {
          ...error?.data?.metadata,
          walletType,
        },
      },
    );

    // Preserve stack trace from the original error
    if (error.stack) {
      hwError.stack = error.stack;
    }

    return hwError;
  }

  // Fallback: use the error parser to create a HardwareWalletError
  return createHardwareWalletError(
    ErrorCode.Unknown,
    walletType,
    error instanceof Error ? error.message : String(error),
  );
}
