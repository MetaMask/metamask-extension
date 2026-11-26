import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  LEDGER_ERROR_MAPPINGS,
  QR_WALLET_ERROR_MAPPINGS,
  KEYRING_ERROR_MAPPINGS,
} from '@metamask/hw-wallet-sdk';
import { HardwareWalletType } from './types';

/**
 * Hardware-wallet error codes the extension defines until the SDK ships them.
 * 3012 sits in the SDK's device range, after `DeviceMultipleConnected` (3011).
 * Typed as ErrorCode so it flows through the SDK-typed helpers; delete this
 * and use the SDK member once it exists.
 */
export const HardwareWalletErrorCode = {
  DeviceSeedMismatch: 3012 as ErrorCode,
} as const;

/**
 * Factory function to create hardware wallet errors
 *
 * @param code - The hardware wallet error code
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
  extractFromMappings(QR_WALLET_ERROR_MAPPINGS);
  extractFromMappings(KEYRING_ERROR_MAPPINGS);

  return map;
})();

// Extension-local: single-device enforcement (no SDK mapping). The SDK's
// TREZOR_ERROR_MAPPINGS already carries a 3011 entry with Trezor copy, so
// this entry is set after extraction to win the lookup for Ledger errors.
ERROR_PROPERTIES_MAP.set(ErrorCode.DeviceMultipleConnected, {
  severity: Severity.Err,
  category: Category.Connection,
  userMessage:
    "You can only connect one Ledger at a time. To use a different Ledger, remove the connected Ledger's accounts from MetaMask first.",
});

// The connected Ledger does not hold the stored account, raised by the connect
// seed check and mapped from signing. The SDK has no copy for it, so set it
// after extraction. 3011 stays reserved for the single-device model/count gate.
ERROR_PROPERTIES_MAP.set(HardwareWalletErrorCode.DeviceSeedMismatch, {
  severity: Severity.Err,
  category: Category.DeviceState,
  userMessage:
    "This Ledger doesn't hold the account you're trying to use. Connect the Ledger you used to add this account and try again.",
});

/**
 * Substrings of the plain `Error` messages the Ledger keyring throws when the
 * connected device holds a different seed for the requested account. There is
 * no typed error, so both the signing mapping and the connect-time seed check
 * match on these. Both map them to
 * {@link HardwareWalletErrorCode.DeviceSeedMismatch}.
 */
export const LEDGER_SEED_MISMATCH_MESSAGES = [
  'does not belong to the connected device',
  // `signPersonalMessage`
  'doesnt match the right address',
  // EIP-7702 authorization signing
  'does not match the right address',
] as const;

/**
 * True when the keyring has no recorded derivation path for the account, so it
 * cannot re-derive it. This is not a device mismatch: the fix is re-importing
 * the account from the device, and callers fail open rather than accuse the
 * connected device.
 *
 * @param error - The error thrown by the keyring.
 * @returns Whether the account has no recorded derivation path.
 */
export function isLedgerAccountPathMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.message.includes('Ledger:') && error.message.includes('not found')
  );
}

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
