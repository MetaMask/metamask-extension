import { InternalAccount } from '@metamask/keyring-internal-api';
///: BEGIN:ONLY_INCLUDE_IF(solana)
import { SolScope } from '@metamask/keyring-api';
import {
  KeyringInternalSnapClient,
  KeyringInternalSnapClientMessenger,
} from '@metamask/keyring-internal-snap-client';
import { SnapKeyring } from '@metamask/eth-snap-keyring';
import { SOLANA_WALLET_SNAP_ID } from './solana-wallet-snap';
///: END:ONLY_INCLUDE_IF

/**
 * Get the next available account name based on the suggestion and the list of
 * accounts.
 *
 * @param accounts - The list of accounts to check for name availability
 * @param nameSuggestion - The suggested name for the account
 * @returns The next available account name based on the suggestion
 */
export function getUniqueAccountName(
  accounts: InternalAccount[],
  nameSuggestion: string,
): string {
  let suffix = 1;
  let candidateName = nameSuggestion;

  const isNameTaken = (name: string) =>
    accounts.some((account) => account.metadata.name === name);

  while (isNameTaken(candidateName)) {
    suffix += 1;
    candidateName = `${nameSuggestion} ${suffix}`;
  }

  return candidateName;
}

///: BEGIN:ONLY_INCLUDE_IF(solana)
export async function addDiscoveredSolanaAccounts(
  controllerMessenger: KeyringInternalSnapClientMessenger,
  entropySource: string,
  snapKeyring: SnapKeyring,
) {
  const snapId = SOLANA_WALLET_SNAP_ID;
  const scopes = [SolScope.Mainnet, SolScope.Testnet, SolScope.Devnet];
  const client = new KeyringInternalSnapClient({
    messenger: controllerMessenger,
    snapId,
  });

  for (let index = 0; ; index++) {
    const discovered = await client.discoverAccounts(
      scopes,
      entropySource,
      index,
    );

    // We stop discovering accounts if none got discovered for that index.
    if (discovered.length === 0) {
      break;
    }

    await Promise.allSettled(
      discovered.map(async (discoveredAccount) => {
        const options = {
          derivationPath: discoveredAccount.derivationPath,
          entropySource,
        };

        // TODO: Use `withKeyring` instead of using the keyring directly.
        await snapKeyring.createAccount(snapId, options, {
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        });
      }),
    );
  }
}
///: END:ONLY_INCLUDE_IF
