import { AccountWalletId } from '@metamask/account-api';

/**
 * Strips the type prefix from a wallet ID
 * Examples:
 * - "entropy:01JKAF3DSGM3AB87EM9N0K41AJ" -> "01JKAF3DSGM3AB87EM9N0K41AJ"
 *
 * @param walletId - The wallet ID with a type prefix
 * @returns The wallet ID without the type prefix
 */
export function stripWalletTypePrefixFromWalletId(
  walletId: AccountWalletId,
): string {
  const firstColonIndex = walletId.indexOf(':');

  if (firstColonIndex !== -1) {
    return walletId.slice(firstColonIndex + 1);
  }

  return walletId;
}
