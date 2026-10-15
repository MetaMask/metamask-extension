import type { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { isEvmAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { isHardwareAccount } from '../../../components/app/rewards/utils/isHardwareAccount';
import type { ConsolidatedWallets } from '../../../selectors/multichain-accounts/account-tree.types';

export type EvmAccountGroupedByWallet = {
  id: AccountGroupId;
  name: string;
  address: string;
  type: string;
};

export type EvmWalletWithAccounts = {
  id: AccountWalletId;
  name: string;
  accounts: EvmAccountGroupedByWallet[];
};

type GetEvmAccountsGroupedByWalletOptions = {
  /**
   * When true, omit hardware wallet accounts (Ledger, Trezor, OneKey, Lattice,
   * QR). Used by flows that cannot be funded by a hardware device, so the
   * account is never offered rather than rejected after selection.
   */
  excludeHardwareAccounts?: boolean;
  /**
   * When true, omit QR hardware wallet accounts.
   */
  excludeQrAccounts?: boolean;
  /**
   * When set, omit hardware accounts other than this address.
   */
  allowedHardwareAccountAddress?: string | null;
};

/**
 * Groups EVM accounts from consolidated wallets by wallet, skipping wallets
 * that have no eligible EVM accounts. Uses `isEvmAccountType` for account
 * detection and, when `excludeHardwareAccounts` is set, `isHardwareAccount` to
 * drop hardware wallet accounts.
 *
 * A group is skipped when its only EVM account is excluded, and a wallet is
 * skipped when every one of its groups is skipped — so an all-hardware wallet
 * does not render as an empty section header.
 *
 * @param wallets - Consolidated wallets from `getWalletsWithAccounts`.
 * @param options - Filtering options.
 * @param options.excludeHardwareAccounts - Whether to omit hardware accounts.
 * @param options.excludeQrAccounts
 * @param options.allowedHardwareAccountAddress
 * @returns Wallets with their eligible EVM accounts, preserving wallet order.
 */
export function getEvmAccountsGroupedByWallet(
  wallets: ConsolidatedWallets,
  {
    excludeHardwareAccounts = false,
    excludeQrAccounts = false,
    allowedHardwareAccountAddress,
  }: GetEvmAccountsGroupedByWalletOptions = {},
): EvmWalletWithAccounts[] {
  return Object.values(wallets).reduce(
    (acc: EvmWalletWithAccounts[], wallet) => {
      const accounts: EvmAccountGroupedByWallet[] = [];

      Object.values(wallet.groups).forEach((group) => {
        const evmAccount = group.accounts.find(
          (account) =>
            isEvmAccountType(account.type) &&
            !(excludeHardwareAccounts && isHardwareAccount(account)) &&
            !(
              allowedHardwareAccountAddress !== undefined &&
              isHardwareAccount(account) &&
              (!allowedHardwareAccountAddress ||
                account.address.toLowerCase() !==
                  allowedHardwareAccountAddress.toLowerCase())
            ) &&
            !(
              excludeQrAccounts &&
              account.metadata?.keyring?.type === KeyringTypes.qr
            ),
        );

        if (evmAccount) {
          accounts.push({
            id: group.id,
            name: group.metadata.name,
            address: evmAccount.address,
            type: evmAccount.type,
          });
        }
      });

      if (accounts.length > 0) {
        acc.push({
          id: wallet.id,
          name: wallet.metadata.name,
          accounts,
        });
      }

      return acc;
    },
    [],
  );
}
