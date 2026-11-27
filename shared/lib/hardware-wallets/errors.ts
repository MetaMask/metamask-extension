import {
  HardwareWalletError,
  ErrorCode,
  Severity,
  Category,
  LEDGER_ERROR_MAPPINGS,
  QR_WALLET_ERROR_MAPPINGS,
  KEYRING_ERROR_MAPPINGS,
  TREZOR_ERROR_MAPPINGS,
} from '@metamask/hw-wallet-sdk';
import { HardwareWalletType } from './types';

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
  // Get error properties based on error code and wallet type
  const { severity, category, userMessage } = getErrorProperties(
    code,
    walletType,
  );

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

/**
 * Get error properties for a code, with wallet-specific copy where needed.
 *
 * @param code - The error code to get properties for.
 * @param walletType - The hardware wallet type raising the error.
 * @returns Error properties including severity, category, etc.
 */
function getErrorProperties(
  code: ErrorCode,
  walletType: HardwareWalletType,
): {
  severity: Severity;
  category: Category;
  userMessage: string;
} {
  if (code === ErrorCode.DeviceMultipleConnected) {
    if (walletType === HardwareWalletType.Ledger) {
      return {
        severity: Severity.Err,
        category: Category.Connection,
        userMessage:
          "You can only connect one Ledger at a time. To use a different Ledger, remove the connected Ledger's accounts from MetaMask first.",
      };
    }

    if (walletType === HardwareWalletType.Trezor) {
      const trezor = TREZOR_ERROR_MAPPINGS.Device_MultipleNotSupported;
      return {
        severity: trezor.severity,
        category: trezor.category,
        userMessage: trezor.userMessage ?? trezor.message,
      };
    }
  }

  return (
    ERROR_PROPERTIES_MAP.get(code) ?? {
      severity: Severity.Err,
      category: Category.Unknown,
      userMessage: 'An unknown error occurred',
    }
  );
}
