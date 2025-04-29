import {
  Caip25CaveatValue,
  getPermittedAccountsForScopes,
  KnownSessionProperties,
} from '@metamask/chain-agnostic-permission';
import { CaipAccountId, parseCaipAccountId } from '@metamask/utils';
import { uniq } from 'lodash';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { SolAccountType } from '@metamask/keyring-api';
import {
  getOriginsWithSessionProperty,
  getPermittedAccountsForScopesByOrigin,
} from '../controllers/permissions';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';

export const handlePermissionControllerStateChangeSolanaAccountChanged = (
  currentValue: Map<string, Caip25CaveatValue>,
  previousValue: Map<string, Caip25CaveatValue>,
  hooks: {
    sortMultichainAccountsByLastSelected: (addresses: string[]) => string[];
    notifySolanaAccountChange: (origin: string, addresses: string[]) => void;
  },
) => {
  const origins = uniq([...previousValue.keys(), ...currentValue.keys()]);
  origins.forEach((origin) => {
    const previousCaveatValue = previousValue.get(origin);
    const currentCaveatValue = currentValue.get(origin);

    const previousSolanaAccountChangedNotificationsEnabled = Boolean(
      previousCaveatValue?.sessionProperties?.[
        KnownSessionProperties.SolanaAccountChangedNotifications
      ],
    );
    const currentSolanaAccountChangedNotificationsEnabled = Boolean(
      currentCaveatValue?.sessionProperties?.[
        KnownSessionProperties.SolanaAccountChangedNotifications
      ],
    );

    if (
      !previousSolanaAccountChangedNotificationsEnabled &&
      !currentSolanaAccountChangedNotificationsEnabled
    ) {
      return;
    }

    const previousSolanaCaipAccountIds = previousCaveatValue
      ? getPermittedAccountsForScopes(previousCaveatValue, [
          MultichainNetworks.SOLANA,
          MultichainNetworks.SOLANA_DEVNET,
          MultichainNetworks.SOLANA_TESTNET,
        ])
      : [];
    const previousNonUniqueSolanaHexAccountAddresses =
      previousSolanaCaipAccountIds.map((caipAccountId) => {
        const { address } = parseCaipAccountId(caipAccountId);
        return address;
      });
    const previousSolanaHexAccountAddresses = uniq(
      previousNonUniqueSolanaHexAccountAddresses,
    );
    const [previousSelectedSolanaAccountAddress] =
      hooks.sortMultichainAccountsByLastSelected(
        previousSolanaHexAccountAddresses,
      );

    const currentSolanaCaipAccountIds = currentCaveatValue
      ? getPermittedAccountsForScopes(currentCaveatValue, [
          MultichainNetworks.SOLANA,
          MultichainNetworks.SOLANA_DEVNET,
          MultichainNetworks.SOLANA_TESTNET,
        ])
      : [];
    const currentNonUniqueSolanaHexAccountAddresses =
      currentSolanaCaipAccountIds.map((caipAccountId) => {
        const { address } = parseCaipAccountId(caipAccountId);
        return address;
      });
    const currentSolanaHexAccountAddresses = uniq(
      currentNonUniqueSolanaHexAccountAddresses,
    );
    const [currentSelectedSolanaAccountAddress] =
      hooks.sortMultichainAccountsByLastSelected(
        currentSolanaHexAccountAddresses,
      );

    if (
      previousSelectedSolanaAccountAddress !==
      currentSelectedSolanaAccountAddress
    ) {
      hooks.notifySolanaAccountChange(
        origin,
        currentSelectedSolanaAccountAddress
          ? [currentSelectedSolanaAccountAddress]
          : [],
      );
    }
  });
};

export const handleAccountsControllerSelectedAccountChangeSolanaAccountChanged =
  (
    account: InternalAccount,
    hooks: {
      sortMultichainAccountsByLastSelected: (addresses: string[]) => string[];
      notifySolanaAccountChange: (origin: string, addresses: string[]) => void;
      permissionControllerState: Record<string, unknown>;
      lastSelectedSolanaAccountAddress: string;
    },
  ) => {
    if (
      account.type === SolAccountType.DataAccount &&
      account.address !== hooks.lastSelectedSolanaAccountAddress
    ) {
      // lastSelectedSolanaAccountAddress = account.address;

      const originsWithSolanaAccountChangedNotifications =
        getOriginsWithSessionProperty(
          hooks.permissionControllerState,
          KnownSessionProperties.SolanaAccountChangedNotifications,
        ) as Record<string, boolean>;

      // returns a map of origins to permitted solana accounts
      const solanaAccounts = getPermittedAccountsForScopesByOrigin(
        hooks.permissionControllerState,
        [
          MultichainNetworks.SOLANA,
          MultichainNetworks.SOLANA_DEVNET,
          MultichainNetworks.SOLANA_TESTNET,
        ],
      ) as Map<string, string[]>;

      if (solanaAccounts.size > 0) {
        for (const [origin, accounts] of solanaAccounts.entries()) {
          const parsedSolanaAddresses = accounts.map((caipAccountId) => {
            const { address } = parseCaipAccountId(
              caipAccountId as CaipAccountId,
            );
            return address;
          });

          if (
            parsedSolanaAddresses.includes(account.address) &&
            originsWithSolanaAccountChangedNotifications[origin]
          ) {
            hooks.notifySolanaAccountChange(origin, [account.address]);
          }
        }
      }
    }
  };
