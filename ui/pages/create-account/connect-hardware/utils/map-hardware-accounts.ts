import { ETH_TOKEN_IMAGE_URL } from '../../../../../shared/constants/network';
import type { HardwareWalletAccount } from '../../../../components/multichain-accounts/hardware-account-card';
import type {
  ConnectHardwarePageAccount,
  HardwareConnectAccount,
  RawHardwareAccount,
} from '../types';

/**
 * Maps raw hardware rows into {@link HardwareWalletAccount} card props.
 * The new selector renders HardwareAccountCard, which expects wallet-style ids,
 * labels, and network rows rather than the connectHardware response shape.
 *
 * @param accounts - Accounts returned from connectHardware.
 * @param connectedAccounts - Lowercase addresses already imported in MetaMask.
 * @param networkName - Localized Ethereum network name for each address row.
 */
export function mapHardwareAccountsToWalletAccounts(
  accounts: RawHardwareAccount[],
  connectedAccounts: string[],
  networkName: string,
): HardwareWalletAccount[] {
  return accounts.map((account) => {
    const normalizedAddress = account.address.toLowerCase();
    const isAlreadyConnected = connectedAccounts.includes(normalizedAddress);

    return {
      id: `account-${account.index}`,
      name: `Account ${account.index + 1}`,
      addresses: [
        {
          id: `eth-${account.index}`,
          networkName,
          address: account.address,
          iconUrl: ETH_TOKEN_IMAGE_URL,
        },
      ],
      isAlreadyConnected,
    };
  });
}

/**
 * Adapts index.tsx account rows for SelectHardwareAccountsPage state.
 * The parent enriches connectHardware results with balance strings for the
 * legacy AccountList; the new selector only tracks address and index.
 *
 * @param accounts - Hardware connect accounts from the parent page.
 * @returns Raw hardware accounts for the account selector state.
 */
export function toRawHardwareAccounts(
  accounts: HardwareConnectAccount[],
): RawHardwareAccount[] {
  return accounts.map(({ address, index }) => ({ address, index }));
}

/**
 * Normalizes connectHardware pagination responses so every row has a stable
 * index. Bridges may omit index on page rows; we fall back to array position
 * so card ids, append deduplication, and unlock calls stay consistent.
 *
 * @param accounts - Page rows returned from connectHardware.
 * @returns Raw hardware accounts with a resolved index for each row.
 */
export function mapConnectHardwarePageAccounts(
  accounts: ConnectHardwarePageAccount[],
): RawHardwareAccount[] {
  return accounts.map((account, index) => ({
    address: account.address,
    index: account.index ?? index,
  }));
}

/**
 * Parses HardwareAccountCard selection ids back to device indices.
 * unlockHardwareWalletAccounts expects numeric derivation indices, not card ids.
 *
 * @param accountIds - Selected account card ids from the account selector.
 */
export function mapAccountIdsToIndices(accountIds: string[]): number[] {
  return accountIds.flatMap((accountId) => {
    const index = Number.parseInt(accountId.replace('account-', ''), 10);

    return Number.isNaN(index) ? [] : [index];
  });
}

/**
 * Builds HardwareAccountCard ids from selected device indices so checkbox
 * selection state matches the ids produced by mapHardwareAccountsToWalletAccounts.
 *
 * @param indices - Selected hardware account indices.
 */
export function mapIndicesToAccountIds(indices: number[]): string[] {
  return indices.map((index) => `account-${index}`);
}
