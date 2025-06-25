import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
///: BEGIN:ONLY_INCLUDE_IF(multichain)
import { DiscoveredAccount, KeyringAccount } from '@metamask/keyring-api';
import { KeyringInternalSnapClient } from '@metamask/keyring-internal-snap-client';
import {
  SnapKeyring,
  SnapKeyringInternalOptions,
} from '@metamask/eth-snap-keyring';
import { KeyringTypes } from '@metamask/keyring-controller';
import { Messenger } from '@metamask/base-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { HandleSnapRequest as SnapControllerHandleRequest } from '@metamask/snaps-controllers';
import { AccountsControllerGetNextAvailableAccountNameAction } from '@metamask/accounts-controller';
import { captureException } from '@sentry/browser';
///: END:ONLY_INCLUDE_IF
import { MultichainNetworks } from '../../constants/multichain/networks';
import { BITCOIN_WALLET_SNAP_ID } from './bitcoin-wallet-snap';
import { SOLANA_WALLET_SNAP_ID } from './solana-wallet-snap';

/**
 * Supported non-EVM Snaps.
 */
type SUPPORTED_WALLET_SNAP_ID =
  | typeof SOLANA_WALLET_SNAP_ID
  | typeof BITCOIN_WALLET_SNAP_ID;

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

export type SnapAccountNameOptions = {
  chainId?: CaipChainId;
};

/**
 * Get the next available Snap account name for a supported non-EVM Snap.
 *
 * @param getNextAvailableAccountName - Callback to get the next available account name.
 * @param snapId - Snap ID.
 * @param options - Options for this account name.
 * @param options.chainId - Chain ID for this account if available.
 * @returns
 */
export async function getNextAvailableSnapAccountName(
  getNextAvailableAccountName: () => Promise<string>,
  snapId: SUPPORTED_WALLET_SNAP_ID,
  { chainId }: SnapAccountNameOptions = {},
) {
  const defaultSnapAccountName = await getNextAvailableAccountName();

  // FIXME: This is a temporary workaround to suggest a different account name for a first party snap.
  const accountNumber = defaultSnapAccountName.trim().split(' ').pop();

  switch (snapId) {
    case BITCOIN_WALLET_SNAP_ID: {
      if (chainId === MultichainNetworks.BITCOIN_TESTNET) {
        return `Bitcoin Testnet Account ${accountNumber}`;
      }
      if (chainId === MultichainNetworks.BITCOIN_SIGNET) {
        return `Bitcoin Signet Account ${accountNumber}`;
      }
      return `Bitcoin Account ${accountNumber}`;
    }
    case SOLANA_WALLET_SNAP_ID: {
      // Solana accounts should have in their scope the 3 networks
      // mainnet, testnet, and devnet. Therefore, we can use this name
      // for all 3 networks.
      return `Solana Account ${accountNumber}`;
    }
    default:
      return defaultSnapAccountName;
  }
}

///: BEGIN:ONLY_INCLUDE_IF(multichain)
export type CreateAccountSnapOptions = {
  scope?: CaipChainId;
  derivationPath?: DiscoveredAccount['derivationPath'];
  entropySource?: string;
  accountNameSuggestion?: string;
  synchronize?: boolean;
};

export type WalletSnapClient = {
  getSnapId(): SnapId;

  createAccount(
    options: CreateAccountSnapOptions,
    internalOptions?: SnapKeyringInternalOptions,
  ): Promise<KeyringAccount>;

  getNextAvailableAccountName(
    options?: SnapAccountNameOptions,
  ): Promise<string>;
};

export type MultichainWalletSnapClientMessenger = Messenger<
  | SnapControllerHandleRequest
  | AccountsControllerGetNextAvailableAccountNameAction,
  never
>;

export class MultichainWalletSnapClient implements WalletSnapClient {
  readonly #snapId: SUPPORTED_WALLET_SNAP_ID;

  readonly #snapKeyring: SnapKeyring;

  readonly #client: KeyringInternalSnapClient;

  readonly #messenger: MultichainWalletSnapClientMessenger;

  constructor(
    snapId: SUPPORTED_WALLET_SNAP_ID,
    snapKeyring: SnapKeyring,
    messenger: MultichainWalletSnapClientMessenger,
  ) {
    this.#snapId = snapId;
    this.#snapKeyring = snapKeyring;

    this.#messenger = messenger;

    this.#client = new KeyringInternalSnapClient({
      snapId,
      // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
      messenger: messenger.getRestricted({
        name: 'KeyringInternalSnapClient',
        allowedActions: ['SnapController:handleRequest'],
        allowedEvents: [],
      }),
    });
  }

  getSnapId(): SnapId {
    return this.#snapId;
  }

  async createAccount(
    { accountNameSuggestion, ...options }: CreateAccountSnapOptions,
    internalOptions?: SnapKeyringInternalOptions,
  ): Promise<KeyringAccount> {
    // Automatically name the account if not provided.
    const autoAccountNameSuggestion = accountNameSuggestion
      ? { accountNameSuggestion }
      : { accountNameSuggestion: await this.getNextAvailableAccountName() };

    // TODO: Use `withKeyring` instead of using the keyring directly.
    return await this.#snapKeyring.createAccount(
      this.#snapId,
      {
        ...options,
        // TODO: Stop forwarding the account name to the Snap, we should make this
        // an internal option at some point.
        ...autoAccountNameSuggestion,
      },
      internalOptions,
    );
  }

  async getNextAvailableAccountName(
    options: SnapAccountNameOptions = {},
  ): Promise<string> {
    return getNextAvailableSnapAccountName(
      async () => {
        return this.#messenger.call(
          'AccountsController:getNextAvailableAccountName',
          KeyringTypes.snap,
        );
      },
      this.#snapId,
      options,
    );
  }

  async discoverAccounts(
    entropySource: string,
    scope: CaipChainId,
  ): Promise<KeyringAccount[]> {
    const accounts: KeyringAccount[] = [];

    for (let index = 0; ; index++) {
      const discovered = await this.#client.discoverAccounts(
        [scope],
        entropySource,
        index,
      );

      // We stop discovering accounts if none got discovered for that index.
      if (discovered.length === 0) {
        break;
      }

      // NOTE: We are doing this sequentially mainly to avoid race-conditions with the
      // account naming logic.
      for (const { derivationPath } of discovered) {
        try {
          const options: CreateAccountSnapOptions = {
            scope,
            derivationPath,
            entropySource,
            synchronize: true,
          };

          const account = await this.createAccount(options, {
            displayConfirmation: false,
            displayAccountNameSuggestion: false,
            setSelectedAccount: false,
          });
          accounts.push(account);
        } catch (error) {
          console.warn(
            `Unable to create discovered account: ${derivationPath}:`,
            error,
          );
          // Still logging this one to sentry as this is a fairly new process for account discovery.
          captureException(error);
        }
      }
    }

    return accounts;
  }
}
///: END:ONLY_INCLUDE_IF
