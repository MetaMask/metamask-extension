import { isUserRejectedHardwareWalletError } from '../../../contexts/hardware-wallets/rpcErrorUtils';

/**
 * Determines whether an error thrown during a hardware-wallet signing flow
 * represents a user-initiated rejection.
 *
 * Augments the canonical RPC rejection check with vendor-specific error
 * message patterns (Trezor, Lattice) that don't surface through the standard
 * RPC error shape.
 *
 * @param error - The error caught while attempting to sign with a hardware wallet.
 * @returns Whether the error should be treated as a user rejection.
 */
export const isHardwareWalletUserRejection = (error: unknown): boolean => {
  if (isUserRejectedHardwareWalletError(error)) {
    return true;
  }

  const errorMessage = (error as Error).message?.toLowerCase() ?? '';

  return (
    (errorMessage.includes('trezor') &&
      (errorMessage.includes('cancelled') ||
        errorMessage.includes('rejected'))) ||
    (errorMessage.includes('lattice') && errorMessage.includes('rejected')) ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user cancelled')
  );
};
