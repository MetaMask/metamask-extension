/**
 * Whether a money account has been migrated onto an MPC keyring.
 *
 * The marker is stored on the account options by `MpcMoneyAccountController`.
 * It is read here without importing that controller so the UI can tell MFA
 * is on from Redux state.
 *
 * @param account - A money account, or `undefined`.
 * @returns Whether the account carries the MPC marker and an address.
 */
export function isMpcBackedMoneyAccount(
  account: { address?: string; options?: object } | undefined,
): account is { address: string; options: { mpcKeyring: true } } {
  if (!account?.options || !('mpcKeyring' in account.options)) {
    return false;
  }

  return (
    account.options.mpcKeyring === true && typeof account.address === 'string'
  );
}
