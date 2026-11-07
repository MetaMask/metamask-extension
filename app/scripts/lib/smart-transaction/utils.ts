import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { MetaMetricsHardwareWalletDeviceType } from '../../../../shared/constants/metametrics';
import {
  CLIENT_ID_EXTENSION_CHROME,
  CLIENT_ID_EXTENSION_FIREFOX,
} from '../../../../shared/constants/smartTransactions';
import { getPlatform } from '../util';

export const getClientForTransactionMetadata = (): string =>
  getPlatform() === PLATFORM_FIREFOX
    ? CLIENT_ID_EXTENSION_FIREFOX
    : CLIENT_ID_EXTENSION_CHROME;

export const getClientVersionForTransactionMetadata = (): string =>
  process.env.METAMASK_VERSION ?? '';

/**
 * Maps a keyring type to the hardware name Segment expects.
 * Segment `device_type` expects `Ledger`, `Trezor`, `QR Hardware`, or `Lattice`.
 * The keyring type is a longer label, such as `Ledger Hardware`.
 * Unknown labels, including OneKey, are omitted.
 *
 * @param value - Keyring type, such as `Ledger Hardware`.
 * @returns The Segment value, or undefined when the signer is not a known hardware wallet.
 */
export const toAccountHardwareType = (
  value?: string,
): MetaMetricsHardwareWalletDeviceType | undefined => {
  switch (value) {
    case 'Ledger Hardware':
      return MetaMetricsHardwareWalletDeviceType.Ledger;
    case 'Trezor Hardware':
      return MetaMetricsHardwareWalletDeviceType.Trezor;
    case 'QR Hardware Wallet Device':
      return MetaMetricsHardwareWalletDeviceType.QrHardware;
    case 'Lattice Hardware':
      return MetaMetricsHardwareWalletDeviceType.Lattice;
    default:
      return undefined;
  }
};

/**
 * Sanitizes transaction origin for analytics.
 * - For URL origins (dApps): extracts hostname only for privacy
 * - For internal origins: returns as-is
 *
 * @param origin - The transaction origin to sanitize
 * @returns The sanitized origin (hostname for URLs, original value otherwise)
 */
export const sanitizeOrigin = (origin?: string): string | undefined => {
  if (!origin) {
    return undefined;
  }

  try {
    // Attempt to parse as URL - will throw for non-URL strings
    const url = new URL(origin);
    // If hostname is empty, the input wasn't a real URL (e.g., 'wc::', 'MMSDKREMOTE::')
    return url.hostname || origin;
  } catch {
    // Not a valid URL (internal origins like 'metamask', 'RAMPS_SEND')
    return origin;
  }
};
