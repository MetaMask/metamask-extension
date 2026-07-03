import { ErrorCode } from '@metamask/hw-wallet-sdk';
import {
  HardwareConnectLegacyErrorMessage,
  HARDWARE_CONNECT_LEDGER_LOCKED_MESSAGES,
  HARDWARE_CONNECT_TIMEOUT_MESSAGE_SUBSTRING,
  HardwareDeviceNames,
  LEDGER_ERRORS_CODES,
  U2F_ERROR,
} from '../../../../../shared/constants/hardware-wallets';
import { getErrorMessage as toErrorMessage } from '../../../../../shared/lib/error';
import {
  HardwareWalletType,
  toHardwareWalletError,
} from '../../../../contexts/hardware-wallets';

/**
 * Resolution category constants for connectHardware error handling.
 * Separates user-facing failures from dismissals and browser popup blocks so
 * index.tsx and the accounts page can react consistently.
 *
 * @property Error - Show a user facing error message.
 * @property Suppress - Hide the error without notifying the user.
 * @property BrowserBlocked - Mark the browser as blocking hardware popups.
 */
export const HardwareConnectErrorResolutionKind = {
  Error: 'error',
  Suppress: 'suppress',
  BrowserBlocked: 'browser_blocked',
} as const;

/** Resolution category value for a connectHardware error. */
export type HardwareConnectErrorResolutionKind =
  (typeof HardwareConnectErrorResolutionKind)[keyof typeof HardwareConnectErrorResolutionKind];

/**
 * Result of resolving a connectHardware error for UI handling.
 * Callers branch on kind instead of parsing raw error strings inline.
 *
 * @property kind - How the UI should handle the error.
 * @property message - User facing message when kind is error.
 */
export type HardwareConnectErrorResolution =
  | {
      kind: typeof HardwareConnectErrorResolutionKind.Error;
      message: string;
    }
  | { kind: typeof HardwareConnectErrorResolutionKind.Suppress }
  | { kind: typeof HardwareConnectErrorResolutionKind.BrowserBlocked };

/**
 * Maps connect hardware device names to hardware wallet adapter types so we
 * can reuse toHardwareWalletError for typed SDK error codes.
 */
const HARDWARE_DEVICE_TO_WALLET_TYPE: Partial<
  Record<HardwareDeviceNames, HardwareWalletType>
> = {
  [HardwareDeviceNames.ledger]: HardwareWalletType.Ledger,
  [HardwareDeviceNames.trezor]: HardwareWalletType.Trezor,
  [HardwareDeviceNames.oneKey]: HardwareWalletType.OneKey,
  [HardwareDeviceNames.lattice]: HardwareWalletType.Lattice,
  [HardwareDeviceNames.qr]: HardwareWalletType.Qr,
};

/**
 * Returns a localized message for a legacy Ledger hex error code.
 * Older bridges embed raw hex codes in error strings instead of ErrorCode.
 *
 * @param errorCode - Ledger hex status code from the error message.
 * @param t - Localization function.
 * @returns Localized message or the original error code when no mapping exists.
 */
function getLedgerLocalizedErrorMessage(
  errorCode: string,
  t: (key: string) => string,
): string {
  const errorCodeLocalized =
    LEDGER_ERRORS_CODES[errorCode as keyof typeof LEDGER_ERRORS_CODES];

  if (errorCodeLocalized !== undefined) {
    return t(errorCodeLocalized);
  }

  return errorCode;
}

/**
 * Checks whether the message is a legacy Ledger locked state token.
 * Pre-SDK bridges throw LEDGER_LOCKED / LEDGER_WRONG_APP strings that should
 * map to the same ledgerLocked message.
 *
 * @param errorMessage - Raw connectHardware error message.
 * @returns True when the message matches a locked state token.
 */
function isLedgerLockedLegacyMessage(errorMessage: string): boolean {
  return HARDWARE_CONNECT_LEDGER_LOCKED_MESSAGES.some(
    (message) => message === errorMessage,
  );
}

/**
 * Checks whether the message is a Keystone out of range error.
 * Returned when pagination requests an account index the device cannot derive.
 *
 * @param errorMessage - Raw connectHardware error message.
 * @returns True when the message matches the Keystone out of range token.
 */
function isKeystoneOutOfRangeMessage(errorMessage: string): boolean {
  return errorMessage
    .toLowerCase()
    .includes(
      HardwareConnectLegacyErrorMessage.KeystonePubkeyAccountOutOfRange.toLowerCase(),
    );
}

/**
 * Checks whether the message is a Keystone sync cancel error.
 * The user closed the QR sync flow; this is not a connection failure.
 *
 * @param errorMessage - Raw connectHardware error message.
 * @returns True when the message matches the Keystone sync cancel token.
 */
function isKeystoneSyncCancelMessage(errorMessage: string): boolean {
  return errorMessage
    .toLowerCase()
    .includes(
      HardwareConnectLegacyErrorMessage.KeystoneSyncCancel.toLowerCase(),
    );
}

/**
 * Checks whether the error should be hidden without user notification.
 * Popup/window closes and Keystone sync cancel are user-initiated dismissals.
 *
 * @param errorMessage - Raw connectHardware error message.
 * @returns True when the error should be suppressed in the UI.
 */
function isSuppressedConnectError(errorMessage: string): boolean {
  return (
    errorMessage === HardwareConnectLegacyErrorMessage.WindowClosed ||
    errorMessage === HardwareConnectLegacyErrorMessage.PopupClosed ||
    isKeystoneSyncCancelMessage(errorMessage)
  );
}

/**
 * Maps a connectHardware error to a UI resolution.
 * Centralizes error handling for index.tsx and SelectHardwareAccountsPage.
 * Background bridges still throw a mix of SDK ErrorCode values and legacy
 * string tokens; this normalizes both into one UI action.
 *
 * @param error - Error thrown by connectHardware.
 * @param device - Connected hardware device.
 * @param t - Localization function for legacy fallback messages.
 * @returns Resolution telling the UI whether to show, suppress, or handle a blocked popup.
 */
export function resolveHardwareConnectUserError(
  error: unknown,
  device: HardwareDeviceNames,
  t: (key: string) => string,
): HardwareConnectErrorResolution {
  const errorMessage = toErrorMessage(error);
  const walletType = HARDWARE_DEVICE_TO_WALLET_TYPE[device];

  if (walletType) {
    const hwError = toHardwareWalletError(error, walletType);

    if (hwError.code === ErrorCode.ConnectionTimeout) {
      return {
        kind: HardwareConnectErrorResolutionKind.Error,
        message: t('ledgerTimeout') as string,
      };
    }

    if (
      hwError.code !== ErrorCode.Unknown &&
      hwError.code !== ErrorCode.ConnectionClosed
    ) {
      return {
        kind: HardwareConnectErrorResolutionKind.Error,
        message: hwError.userMessage,
      };
    }
  }

  const ledgerErrorCode = Object.keys(LEDGER_ERRORS_CODES).find((errorCode) =>
    errorMessage.includes(errorCode),
  );

  if (errorMessage === HardwareConnectLegacyErrorMessage.WindowBlocked) {
    return { kind: HardwareConnectErrorResolutionKind.BrowserBlocked };
  }

  if (errorMessage.includes(U2F_ERROR)) {
    return {
      kind: HardwareConnectErrorResolutionKind.Error,
      message: U2F_ERROR,
    };
  }

  if (isLedgerLockedLegacyMessage(errorMessage)) {
    return {
      kind: HardwareConnectErrorResolutionKind.Error,
      message: t('ledgerLocked') as string,
    };
  }

  if (errorMessage.includes(HARDWARE_CONNECT_TIMEOUT_MESSAGE_SUBSTRING)) {
    return {
      kind: HardwareConnectErrorResolutionKind.Error,
      message: t('ledgerTimeout') as string,
    };
  }

  if (ledgerErrorCode) {
    return {
      kind: HardwareConnectErrorResolutionKind.Error,
      message: `${errorMessage} - ${getLedgerLocalizedErrorMessage(ledgerErrorCode, t)}`,
    };
  }

  if (isKeystoneOutOfRangeMessage(errorMessage)) {
    return {
      kind: HardwareConnectErrorResolutionKind.Error,
      message: t('QRHardwarePubkeyAccountOutOfRange') as string,
    };
  }

  if (isSuppressedConnectError(errorMessage)) {
    return { kind: HardwareConnectErrorResolutionKind.Suppress };
  }

  return {
    kind: HardwareConnectErrorResolutionKind.Error,
    message: errorMessage,
  };
}
