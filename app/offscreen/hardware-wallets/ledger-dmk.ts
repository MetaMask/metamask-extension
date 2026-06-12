import {
  createLedgerError,
  isKnownLedgerError,
} from '@metamask/eth-ledger-bridge-keyring';

import { LedgerAction } from '../../../shared/constants/offscreen-communication';
import initLegacy, { LedgerLegacyHandler } from './ledger';

function serializeError(error: unknown): {
  message: string;
  statusCode?: number;
  name?: string;
} {
  if (error instanceof Error) {
    const serialized: { message: string; statusCode?: number; name?: string } =
      {
        message: error.message,
        name: error.name,
      };

    if ('statusCode' in error && typeof error.statusCode === 'number') {
      serialized.statusCode = error.statusCode;
    }

    return serialized;
  }
  return { message: String(error) };
}

/**
 * Serializes an error for transmission across message boundaries.
 * Preserves statusCode for TransportStatusError.
 *
 * @param error - The error to serialize.
 * @returns Serialized error object.
 */
export function serializeLedgerError(error: unknown): {
  message: string;
  statusCode?: number;
  name?: string;
  code?: number;
  severity?: string;
  category?: string;
  userMessage?: string;
  extra?: unknown;
} {
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

  return serializeError(error);
}

/**
 * Temporary DMK handler stub that delegates to the legacy offscreen handler.
 * Replaced by the real DMK bridge implementation in a follow-up PR.
 */
export class LedgerDMKBridgeHandler {
  private legacyHandler: LedgerLegacyHandler | null = null;

  async init(skipMessageListener = false): Promise<void> {
    this.legacyHandler = initLegacy();
    await this.legacyHandler.init(skipMessageListener);
  }

  async destroy(): Promise<void> {
    await this.legacyHandler?.destroy();
    this.legacyHandler = null;
  }

  async handleAction(
    action: LedgerAction,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    if (!this.legacyHandler) {
      throw new Error('Ledger DMK stub handler is not initialised');
    }

    return this.legacyHandler.handleAction(action, params);
  }
}
