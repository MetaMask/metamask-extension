import {
  createLedgerError,
  isKnownLedgerError,
} from '@metamask/eth-ledger-bridge-keyring';
import {
  Category,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import { extractMessageFromUnknownError } from '../../../shared/lib/error';

/**
 * Serialized shape of a Ledger error that is safe to send across message
 * boundaries (chrome.runtime / window.postMessage).
 *
 * The optional fields are populated when the source error is either a known
 * Ledger status-code error (TransportStatusError with a mapped status code)
 * or a structured `HardwareWalletError` from `@metamask/hw-wallet-sdk`.
 * Otherwise only `message` and (optionally) `name` are present.
 */
export type SerializedLedgerError = {
  message: string;
  statusCode?: number;
  name?: string;
  code?: number;
  severity?: Severity;
  category?: Category;
  userMessage?: string;
};

/**
 * Serializes a plain error (or non-Error value) into a JSON-safe shape.
 *
 * Preserves `statusCode` when present (used by `TransportStatusError`).
 *
 * @param error - The error to serialize.
 * @returns Serialized error object safe to send across message boundaries.
 */
export function serializeError(error: unknown): SerializedLedgerError {
  if (error instanceof Error) {
    const serialized: SerializedLedgerError = {
      message: error.message,
      name: error.name,
    };

    if ('statusCode' in error && typeof error.statusCode === 'number') {
      serialized.statusCode = error.statusCode;
    }

    return serialized;
  }
  return { message: extractMessageFromUnknownError(error) };
}

/**
 * Serializes an error for transmission across message boundaries.
 *
 * Two enriched paths are supported so the receiving side (background / UI)
 * can reconstruct a typed error instance:
 *
 * 1. Ledger status code — when the source error carries a numeric
 * `statusCode` that maps to a known Ledger status, the result is enriched
 * with the structured fields (`code`, `severity`, `category`,
 * `userMessage`) from the shared Ledger error catalogue. This is the path
 * taken by `TransportStatusError` from `@ledgerhq/errors`.
 * 2. HardwareWalletError — when the source error is already a structured
 * `HardwareWalletError` (e.g. thrown directly by the DMK bridge), its
 * structured fields are preserved verbatim. Without this branch those
 * fields would be stripped by the generic `serializeError` fallback and
 * the receiver would be unable to reconstruct the original error class.
 *
 * Anything else falls through to `serializeError`.
 *
 * @param error - The error to serialize.
 * @returns Serialized error object.
 */
export function serializeLedgerError(error: unknown): SerializedLedgerError {
  if (
    error instanceof Error &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    const statusCodeHex = `0x${error.statusCode.toString(16)}`;

    if (isKnownLedgerError(statusCodeHex)) {
      const hwError = createLedgerError(statusCodeHex);
      return {
        message: hwError.message,
        name: hwError.name,
        code: hwError.code,
        severity: hwError.severity,
        category: hwError.category,
        userMessage: hwError.userMessage,
        statusCode: error.statusCode,
      };
    }
  }

  if (error instanceof HardwareWalletError) {
    return {
      message: error.message,
      name: error.name,
      code: error.code,
      severity: error.severity,
      category: error.category,
      userMessage: error.userMessage,
    };
  }

  return serializeError(error);
}
