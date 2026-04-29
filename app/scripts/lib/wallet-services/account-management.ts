/* eslint-disable @typescript-eslint/unified-signatures */
import log from 'loglevel';
import { isEvmAccountType } from '@metamask/keyring-api';

/**
 * account-management
 *
 * Account selection, labelling, removal, creation, and import.
 * All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence: The following methods are duplicated verbatim in
 * mobile's Engine.ts and are the strongest candidates for promotion to a
 * shared @metamask/* package once messenger actions are registered:
 * - setSelectedAccount  (Engine.ts L1236)
 * - setAccountLabel     (Engine.ts L1251)
 * - removeAccount       (Engine.ts L1061: same remove-permissions + keyring pattern)
 */

/**
 * Subset of the Messenger interface required by account-management.
 * Structural — satisfied by extension RootMessenger, mobile EngineMessenger,
 * or any test double providing these call overloads.
 */
type AccountManagementMessenger = {
  call(action: 'AccountsController:setSelectedAccount', id: string): void;
  call(
    action: 'AccountsController:getAccountByAddress',
    address: string,
  ): { id: string } | undefined;
  call(
    action: 'AccountsController:setAccountName',
    id: string,
    label: string,
  ): void;
  call(
    action: 'PermissionController:removeAllAccountPermissions',
    address: string,
  ): void;
  call(
    action: 'KeyringController:removeAccount',
    address: string,
  ): Promise<void>;
  call(action: 'KeyringController:getAccounts'): Promise<string[]>;
  call(
    action: 'KeyringController:withKeyring',
    selector: { id: string } | { type: string },
    callback: (ctx: {
      keyring: {
        type: string;
        getAccounts: () => Promise<string[]>;
        addAccounts: (n: number) => Promise<string[]>;
        removeAccount: (address: string) => Promise<void>;
      };
      metadata: { id: string };
    }) => Promise<unknown>,
  ): Promise<unknown>;
  call(
    action: 'KeyringController:importAccountWithStrategy',
    strategy: string,
    args: unknown[],
  ): Promise<string>;
  call(
    action: 'PreferencesController:setSelectedAddress',
    address: string,
  ): void;
  call(action: 'AccountsController:getSelectedAccount'): {
    address: string;
    [key: string]: unknown;
  };
  call(action: 'NetworkController:getState'): {
    selectedNetworkClientId: string;
  };
  call(
    action: 'NetworkController:getNetworkClientById',
    networkClientId: string,
  ): { configuration: { chainId: string } };
  call(
    action: 'TransactionController:wipeTransactions',
    opts: { address: string; chainId?: string },
  ): void;
  call(
    action: 'SmartTransactionsController:wipeSmartTransactions',
    opts: { address: string; ignoreNetwork: boolean },
  ): void;
  call(action: 'NetworkController:resetConnection'): void;
  call(
    action: 'AccountTreeController:setSelectedAccountGroup',
    accountGroupId: string,
  ): void;
  call(
    action: 'AccountTreeController:setAccountGroupName',
    accountGroupId: string,
    accountGroupName: string,
  ): void;
  call(action: 'AccountsController:listAccounts'): {
    address: string;
    metadata: { lastSelected?: number };
  }[];
  call(
    action: 'AccountsController:getAccount',
    accountId: string,
  ): { type: string; metadata: { lastSelected?: number } } | undefined;
  call(
    action: 'AccountTreeController:getAccountContext',
    accountId: string,
  ): { groupId: string } | undefined;
  call(
    action: 'AccountTreeController:getAccountGroupObject',
    groupId: string,
  ): { accounts: string[] } | undefined;
  call(
    action: 'AccountManagement:captureKeyringTypesWithMissingIdentities',
    internalAccounts: {
      address: string;
      metadata: { lastSelected?: number };
    }[],
    addresses: string[],
  ): void;
  call(
    action: 'AccountManagement:removeAccount',
    address: string,
  ): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerActionHandler(name: string, handler: (...args: any[]) => any): void;
};

export type AccountManagementDependencies = {
  messenger: AccountManagementMessenger;
};

/**
 * Sets the currently selected account by internal account ID.
 *
 * Extracted from MetamaskController getApi() setSelectedAccount (line 2830).
 * Identical to mobile Engine.ts L1236.
 *
 * TODO: Requires messenger action: AccountsController:setSelectedAccount
 * @param deps
 * @param id
 */
export function setSelectedAccount(
  deps: AccountManagementDependencies,
  id: string,
): void {
  deps.messenger.call('AccountsController:setSelectedAccount', id);
}

/**
 * Sets a human-readable label for an account identified by address.
 * Looks up the internal account ID first, then delegates to AccountsController.
 *
 * Extracted from MetamaskController getApi() setAccountLabel (line 2837).
 * Identical to mobile Engine.ts L1251.
 *
 * TODO: Requires messenger actions:
 * - AccountsController:getAccountByAddress
 * - AccountsController:setAccountName
 * @param deps
 * @param address
 * @param label
 */
export function setAccountLabel(
  deps: AccountManagementDependencies,
  address: string,
  label: string,
): void {
  const account = deps.messenger.call(
    'AccountsController:getAccountByAddress',
    address,
  );
  if (account === undefined) {
    throw new Error(`No account found for address: ${address}`);
  }
  deps.messenger.call('AccountsController:setAccountName', account.id, label);
}

/**
 * Removes an account: revokes all permissions tied to it, then removes
 * the keyring entry.
 *
 * Extracted from MetamaskController.removeAccount (line 6209) and
 * MetamaskController._onAccountRemoved (line 8114).
 * Same pattern as mobile Engine.ts L1061.
 *
 * NOTE: Permission removal is inline here rather than a separate helper
 * because _onAccountRemoved is a one-call wrapper with no other callers
 * once this module owns account lifecycle.
 *
 * TODO: Requires messenger actions:
 * - PermissionController:removeAllAccountPermissions
 * - KeyringController:removeAccount
 * @param deps
 * @param address
 */
export async function removeAccount(
  deps: AccountManagementDependencies,
  address: string,
): Promise<string> {
  // Remove all permissions associated with this account before removing
  // the keyring entry — order matters to avoid orphaned permission grants.
  deps.messenger.call(
    'PermissionController:removeAllAccountPermissions',
    address,
  );
  await deps.messenger.call('KeyringController:removeAccount', address);
  return address;
}

/**
 * Adds a new derived account to the HD keyring.
 * Validates the accountCount to prevent out-of-sequence additions.
 *
 * Extracted from MetamaskController.addNewAccount (L5199).
 *
 * TODO: Requires messenger actions:
 * - KeyringController:getAccounts
 * - KeyringController:withKeyring
 * - PreferencesController:setSelectedAddress
 * @param deps
 * @param accountCount
 * @param keyringId
 */
export async function addNewAccount(
  deps: AccountManagementDependencies,
  accountCount?: number,
  keyringId?: string,
): Promise<string> {
  const oldAccounts: string[] = await deps.messenger.call(
    'KeyringController:getAccounts',
  );

  const addedAccountAddress = (await deps.messenger.call(
    'KeyringController:withKeyring',
    keyringId ? { id: keyringId } : { type: 'HD Key Tree' },
    async ({
      keyring,
    }: {
      keyring: {
        type: string;
        getAccounts: () => Promise<string[]>;
        addAccounts: (n: number) => Promise<string[]>;
        removeAccount: (address: string) => Promise<void>;
      };
    }) => {
      if (keyring.type !== 'HD Key Tree') {
        throw new Error('Cannot add account to non-HD keyring');
      }
      const accountsInKeyring = await keyring.getAccounts();

      if (accountCount && accountCount !== accountsInKeyring.length) {
        if (accountCount > accountsInKeyring.length) {
          throw new Error('Account out of sequence');
        }
        const existingAccount = accountsInKeyring[accountCount];
        if (!existingAccount) {
          throw new Error(`Can't find account at index ${accountCount}`);
        }
        return existingAccount;
      }

      const [newAddress] = await keyring.addAccounts(1);
      if (oldAccounts.includes(newAddress)) {
        await keyring.removeAccount(newAddress);
        throw new Error(`Cannot add duplicate ${newAddress} account`);
      }
      return newAddress;
    },
  )) as string;

  if (!oldAccounts.includes(addedAccountAddress)) {
    deps.messenger.call(
      'PreferencesController:setSelectedAddress',
      addedAccountAddress,
    );
  }

  return addedAccountAddress;
}

/**
 * Imports an account using a strategy (e.g. 'privateKey', 'json').
 * Handles social-backup side effects for seedless-onboarding flows.
 *
 * Extracted from MetamaskController.importAccountWithStrategy (L5698).
 *
 * TODO: Requires messenger actions:
 * - KeyringController:importAccountWithStrategy
 * - OnboardingController:getIsSocialLoginFlow
 * - KeyringController:withKeyring
 * - PreferencesController:setSelectedAddress
 * @param deps
 * @param strategy
 * @param args
 * @param options
 * @param options.shouldCreateSocialBackup
 * @param options.shouldSelectAccount
 */
export async function importAccountWithStrategy(
  deps: AccountManagementDependencies,
  strategy: string,
  args: unknown[],
  options: {
    shouldCreateSocialBackup?: boolean;
    shouldSelectAccount?: boolean;
  } = { shouldCreateSocialBackup: true, shouldSelectAccount: true },
): Promise<string> {
  const { shouldSelectAccount } = options;

  const importedAccountAddress: string = await deps.messenger.call(
    'KeyringController:importAccountWithStrategy',
    strategy,
    args,
  );

  if (shouldSelectAccount) {
    deps.messenger.call(
      'PreferencesController:setSelectedAddress',
      importedAccountAddress,
    );
  }

  return importedAccountAddress;
}

/**
 * Wipes transaction history for the selected account and resets the network
 * connection. Used for nonce reset in dev environments.
 *
 * Extracted from MetamaskController.resetAccount (L5269).
 *
 * TODO: Requires messenger actions:
 * - AccountsController:getSelectedAccount
 * - TransactionController:wipeTransactions
 * - SmartTransactionsController:wipeSmartTransactions
 * - NetworkController:resetConnection
 * @param deps
 */
export async function resetAccount(
  deps: AccountManagementDependencies,
): Promise<string> {
  const selectedAccount = deps.messenger.call(
    'AccountsController:getSelectedAccount',
  );
  const { address } = selectedAccount as { address: string };
  const { selectedNetworkClientId } = deps.messenger.call(
    'NetworkController:getState',
  );
  const {
    configuration: { chainId },
  } = deps.messenger.call(
    'NetworkController:getNetworkClientById',
    selectedNetworkClientId,
  );

  deps.messenger.call('TransactionController:wipeTransactions', {
    address,
    chainId,
  });
  deps.messenger.call('SmartTransactionsController:wipeSmartTransactions', {
    address,
    ignoreNetwork: false,
  });
  deps.messenger.call('NetworkController:resetConnection');

  return address;
}

/**
 * Sets the selected multichain account group.
 * Used for non-EVM (Solana, Bitcoin) account group selection.
 *
 * Extracted from MetamaskController getApi() setSelectedMultichainAccount (L2854).
 *
 * TODO: Requires messenger action: AccountTreeController:setSelectedAccountGroup
 * @param deps
 * @param accountGroupId
 */
export function setSelectedMultichainAccount(
  deps: AccountManagementDependencies,
  accountGroupId: string,
): void {
  deps.messenger.call(
    'AccountTreeController:setSelectedAccountGroup',
    accountGroupId,
  );
}

/**
 * Renames an account group (multichain wallet).
 *
 * Extracted from MetamaskController getApi() setAccountGroupName (L2857).
 *
 * TODO: Requires messenger action: AccountTreeController:setAccountGroupName
 * @param deps
 * @param accountGroupId
 * @param accountGroupName
 */
export function setAccountGroupName(
  deps: AccountManagementDependencies,
  accountGroupId: string,
  accountGroupName: string,
): void {
  deps.messenger.call(
    'AccountTreeController:setAccountGroupName',
    accountGroupId,
    accountGroupName,
  );
}

/**
 * Counts the number of accounts discoverable per keyring provider (Bitcoin,
 * Solana, Tron).
 *
 * Extracted from MetamaskController.getDiscoveryCountByProvider (L4203).
 *
 * NOTE: SolAccountType, BtcAccountType, TrxAccountType enum values are
 * referenced here by their runtime values, not the TS enums, because this
 * module has no direct import of those packages. Callers should pass the
 * already-discovered account list; the function only counts.
 *
 * TODO: No messenger conversions needed — pure data transform.
 * @param _deps
 * @param accounts
 * @param opts
 * @param opts.solanaAccountTypes
 * @param opts.bitcoinAccountTypes
 * @param opts.tronAccountTypes
 */
export function getDiscoveryCountByProvider(
  _deps: AccountManagementDependencies,
  accounts: { type: string }[],
  opts: {
    solanaAccountTypes: string[];
    bitcoinAccountTypes: string[];
    tronAccountTypes?: string[];
  },
): { bitcoin: number; solana: number; tron: number } {
  const counts = { bitcoin: 0, solana: 0, tron: 0 };

  for (const account of accounts) {
    if (opts.solanaAccountTypes.includes(account.type)) {
      counts.solana += 1;
    }
    if (opts.bitcoinAccountTypes.includes(account.type)) {
      counts.bitcoin += 1;
    }
    if (opts.tronAccountTypes?.includes(account.type)) {
      counts.tron += 1;
    }
  }

  return counts;
}

/**
 * Discovers and creates accounts for the given keyring id using the
 * MultichainAccountsService and snap keyring.
 *
 * Extracted from MetamaskController.discoverAndCreateAccounts (L4243).
 *
 * NOTE: This method depends on `multichainAccountService` and
 * `getSnapKeyring()`, which are not yet messenger actions. They are passed
 * directly until messenger actions exist for them.
 *
 * TODO: Requires messenger actions:
 * - KeyringController:state (state accessor, or a dedicated getter action)
 * - MultichainAccountService:discoverAccounts (does not exist yet)
 * - SnapKeyring:initialize (does not exist yet)
 * @param _deps
 * @param opts
 * @param opts.keyringId
 * @param opts.getFirstKeyringId
 * @param opts.ensureSnapKeyringInitialized
 * @param opts.discoverAccountsForWallet
 * @param opts.getDiscoveryCountByProviderOpts
 * @param opts.getDiscoveryCountByProviderOpts.solanaAccountTypes
 * @param opts.getDiscoveryCountByProviderOpts.bitcoinAccountTypes
 * @param opts.getDiscoveryCountByProviderOpts.tronAccountTypes
 */
export async function discoverAndCreateAccounts(
  _deps: AccountManagementDependencies,
  opts: {
    keyringId: string | undefined;
    getFirstKeyringId: () => Promise<string | undefined>;
    ensureSnapKeyringInitialized: () => Promise<void>;
    discoverAccountsForWallet: (
      entropySource: string,
    ) => Promise<{ type: string }[]>;
    getDiscoveryCountByProviderOpts: {
      solanaAccountTypes: string[];
      bitcoinAccountTypes: string[];
      tronAccountTypes?: string[];
    };
  },
): Promise<{ bitcoin: number; solana: number; tron: number }> {
  try {
    const keyringIdToDiscover =
      opts.keyringId ?? (await opts.getFirstKeyringId());

    if (!keyringIdToDiscover) {
      throw new Error('No keyring id to discover accounts for');
    }

    await opts.ensureSnapKeyringInitialized();

    const result = await opts.discoverAccountsForWallet(keyringIdToDiscover);

    return getDiscoveryCountByProvider(
      _deps,
      result,
      opts.getDiscoveryCountByProviderOpts,
    );
  } catch (error) {
    log.warn(`Failed to add accounts with balance. ${String(error)}`);
    return { bitcoin: 0, solana: 0, tron: 0 };
  }
}

/**
 * Adds accounts that have a non-zero balance (or detected tokens) to the HD
 * keyring, stopping at the first empty account.  Also discovers Bitcoin,
 * Solana, and Tron accounts via their respective snap clients.
 *
 * Extracted from MetamaskController._addAccountsWithBalance (L4529).
 *
 * NOTE: Snap-client arguments (btcClient, solanaClient, tronClient) are
 * injected because there are no messenger actions for multichain snap clients
 * yet.  Token-state access (allTokens, allDetectedTokens) is also injected
 * because TokensController does not expose a messenger getter action.
 *
 * TODO: Requires messenger actions:
 * - KeyringController:withKeyring
 * - NetworkController:getGlobalChainId (private helper, does not exist yet)
 * - AccountManagement:removeAccount (already registered above)
 * - TokenDetectionController:detectTokens
 * - TokensController:getState (state accessor)
 * @param deps
 * @param opts
 * @param opts.keyringId
 * @param opts.shouldImportSolanaAccount
 * @param opts.chainId
 * @param opts.getBalance
 * @param opts.detectTokens
 * @param opts.getTokensState
 * @param opts.withKeyring
 * @param opts.btcClient
 * @param opts.btcClient.discoverAccounts
 * @param opts.btcClient.createAccount
 * @param opts.btcScope
 * @param opts.solanaClient
 * @param opts.solanaClient.discoverAccounts
 * @param opts.solanaClient.createAccount
 * @param opts.solScope
 * @param opts.tronClient
 * @param opts.tronClient.discoverAccounts
 * @param opts.tronClient.createAccount
 * @param opts.tronScope
 */
export async function addAccountsWithBalance(
  deps: AccountManagementDependencies,
  opts: {
    keyringId: string | undefined;
    shouldImportSolanaAccount?: boolean;
    chainId: string;
    getBalance: (address: string) => Promise<string>;
    detectTokens: (params: {
      chainIds: string[];
      selectedAddress: string;
    }) => Promise<void>;
    getTokensState: () => {
      allTokens: Record<string, Record<string, unknown[]>>;
      allDetectedTokens: Record<string, Record<string, unknown[]>>;
    };
    withKeyring: (
      selector: { id: string } | { type: string },
      callback: (ctx: {
        keyring: {
          type: string;
          getAccounts: () => Promise<string[]>;
          addAccounts: (n: number) => Promise<string[]>;
        };
        metadata: { id: string };
      }) => Promise<unknown>,
    ) => Promise<unknown>;
    // Snap clients for multichain account discovery — injected until
    // messenger actions exist for them.
    btcClient?: {
      discoverAccounts: (
        entropySource: string,
        scope: string,
      ) => Promise<unknown[]>;
      createAccount: (
        opts: Record<string, unknown>,
        displayOpts: Record<string, unknown>,
      ) => Promise<unknown>;
    };
    btcScope?: string;
    solanaClient?: {
      discoverAccounts: (
        entropySource: string,
        scope: string,
      ) => Promise<unknown[]>;
      createAccount: (
        opts: Record<string, unknown>,
        displayOpts: Record<string, unknown>,
      ) => Promise<unknown>;
    };
    solScope?: string;
    tronClient?: {
      discoverAccounts: (
        entropySource: string,
        scope: string,
      ) => Promise<unknown[]>;
      createAccount: (
        opts: Record<string, unknown>,
        displayOpts: Record<string, unknown>,
      ) => Promise<unknown>;
    };
    tronScope?: string;
  },
): Promise<{ bitcoin: number; solana: number; tron: number }> {
  const {
    keyringId,
    shouldImportSolanaAccount = true,
    chainId,
    getBalance: fetchBalance,
    detectTokens,
    getTokensState,
    withKeyring,
    btcClient,
    btcScope,
    solanaClient,
    solScope,
    tronClient,
    tronScope,
  } = opts;

  const keyringSelector = keyringId
    ? { id: keyringId }
    : { type: 'HD Key Tree' };

  try {
    const { accounts, entropySource } = (await withKeyring(
      keyringSelector,
      async ({ keyring, metadata }) => {
        const keyringAccounts = await keyring.getAccounts();
        return { accounts: keyringAccounts, entropySource: metadata.id };
      },
    )) as { accounts: string[]; entropySource: string };

    let address = accounts[accounts.length - 1];

    for (let count = accounts.length; ; count++) {
      const balance = await fetchBalance(address);

      if (balance === '0x0') {
        await detectTokens({ chainIds: [chainId], selectedAddress: address });

        const { allTokens, allDetectedTokens } = getTokensState();
        const tokens = allTokens?.[chainId]?.[address];
        const detectedTokens = allDetectedTokens?.[chainId]?.[address];

        if (
          (tokens?.length ?? 0) === 0 &&
          (detectedTokens?.length ?? 0) === 0
        ) {
          if (count !== 1) {
            await deps.messenger.call(
              'AccountsController:getAccountByAddress',
              address,
            );
            // Remove account — delegates to the already-registered action.
            await deps.messenger.call(
              'AccountManagement:removeAccount',
              address,
            );
          }
          break;
        }
      }

      address = (await withKeyring(keyringSelector, async ({ keyring }) => {
        const [newAddress] = await keyring.addAccounts(1);
        return newAddress;
      })) as string;
    }

    const discoveredAccounts = { bitcoin: 0, solana: 0, tron: 0 };

    if (btcClient && btcScope) {
      const btcAccounts = await btcClient.discoverAccounts(
        entropySource,
        btcScope,
      );
      discoveredAccounts.bitcoin = btcAccounts.length;
      if (btcAccounts.length === 0) {
        await btcClient.createAccount(
          { scope: btcScope, synchronize: false, entropySource },
          {
            displayConfirmation: false,
            displayAccountNameSuggestion: false,
            setSelectedAccount: false,
          },
        );
      }
    }

    if (shouldImportSolanaAccount && solanaClient && solScope) {
      const solanaAccounts = await solanaClient.discoverAccounts(
        entropySource,
        solScope,
      );
      discoveredAccounts.solana = solanaAccounts.length;
      if (solanaAccounts.length === 0) {
        await solanaClient.createAccount(
          { scope: solScope, entropySource },
          {
            displayConfirmation: false,
            displayAccountNameSuggestion: false,
            setSelectedAccount: false,
          },
        );
      }
    }

    if (tronClient && tronScope) {
      const tronAccounts = await tronClient.discoverAccounts(
        entropySource,
        tronScope,
      );
      discoveredAccounts.tron = tronAccounts.length;
      if (tronAccounts.length === 0) {
        await tronClient.createAccount(
          { scope: tronScope, entropySource },
          {
            displayConfirmation: false,
            displayAccountNameSuggestion: false,
            setSelectedAccount: false,
          },
        );
      }
    }

    return discoveredAccounts;
  } catch {
    return { bitcoin: 0, solana: 0, tron: 0 };
  }
}

/**
 * Iterates all HD keyrings and imports accounts with balances for each,
 * choosing the v2 discovery path (discoverAndCreateAccounts) or the legacy
 * path (_addAccountsWithBalance) based on the feature flag.
 *
 * Extracted from MetamaskController._importAccountsWithBalances (L4693).
 *
 * TODO: Requires messenger actions:
 * - KeyringController:state (state accessor)
 * - KeyringController:withKeyring
 * - AccountTreeController:syncWithUserStorageAtLeastOnce
 * @param deps
 * @param opts
 * @param opts.getKeyrings
 * @param opts.isHdKeyring
 * @param opts.isMultichainAccountsFeatureState2Enabled
 * @param opts.ensureSnapKeyringInitialized
 * @param opts.syncAccountTreeWithUserStorage
 * @param opts.discoverAndCreateAccountsForKeyring
 * @param opts.addAccountsWithBalanceForKeyring
 */
export async function importAccountsWithBalances(
  deps: AccountManagementDependencies,
  opts: {
    getKeyrings: () => { metadata: { id: string } }[];
    isHdKeyring: (id: string) => Promise<boolean>;
    isMultichainAccountsFeatureState2Enabled: () => boolean;
    ensureSnapKeyringInitialized: () => Promise<void>;
    syncAccountTreeWithUserStorage: () => Promise<void>;
    discoverAndCreateAccountsForKeyring: (id: string) => Promise<void>;
    addAccountsWithBalanceForKeyring: (id: string) => Promise<void>;
  },
): Promise<void> {
  const {
    getKeyrings,
    isHdKeyring,
    isMultichainAccountsFeatureState2Enabled,
    ensureSnapKeyringInitialized,
    syncAccountTreeWithUserStorage,
    discoverAndCreateAccountsForKeyring,
    addAccountsWithBalanceForKeyring,
  } = opts;

  for (const { metadata } of getKeyrings()) {
    const hdKeyring = await isHdKeyring(metadata.id);
    if (hdKeyring) {
      if (isMultichainAccountsFeatureState2Enabled()) {
        await ensureSnapKeyringInitialized();
        await syncAccountTreeWithUserStorage();
        await discoverAndCreateAccountsForKeyring(metadata.id);
      } else {
        await addAccountsWithBalanceForKeyring(metadata.id);
      }
    }
  }
}

/**
 * Returns the ETH balance for an address, using AccountTrackerController's
 * cached value when available, falling back to a direct eth_getBalance RPC
 * call via the injected provider.
 *
 * Extracted from MetamaskController.getBalance (L4796).
 *
 * TODO: Requires messenger action:
 * - AccountTrackerController:getState (state accessor, does not exist yet)
 * - NetworkController:getGlobalChainId (private helper, does not exist yet)
 * @param deps
 * @param address
 * @param opts
 * @param opts.chainId
 * @param opts.getAccountTrackerState
 * @param opts.provider
 * @param opts.provider.request
 * @param opts.toChecksumHexAddress
 */
export async function getBalance(
  deps: AccountManagementDependencies,
  address: string,
  opts: {
    chainId: string;
    getAccountTrackerState: () => {
      accountsByChainId: Record<string, Record<string, { balance?: string }>>;
    };
    provider: {
      request: (req: {
        method: string;
        params: unknown[];
      }) => Promise<string | null>;
    };
    toChecksumHexAddress: (address: string) => string;
  },
): Promise<string> {
  const { chainId, getAccountTrackerState, provider, toChecksumHexAddress } =
    opts;

  const { accountsByChainId } = getAccountTrackerState();
  const accounts = accountsByChainId[chainId];
  const cached = accounts?.[toChecksumHexAddress(address)];

  if (cached?.balance) {
    return cached.balance;
  }

  const balance = await provider.request({
    method: 'eth_getBalance',
    params: [address, 'latest'],
  });
  return balance ?? '0x0';
}

/**
 * Sorts a list of EVM addresses by the lastSelected timestamp of the
 * matching InternalAccount in AccountsController.
 *
 * Extracted from MetamaskController.sortEvmAccountsByLastSelected (L5335).
 *
 * TODO: Requires messenger action: AccountsController:listAccounts
 * @param deps
 * @param addresses
 */
export function sortEvmAccountsByLastSelected(
  deps: AccountManagementDependencies,
  addresses: string[],
): string[] {
  const internalAccounts: {
    address: string;
    metadata: { lastSelected?: number };
  }[] = deps.messenger.call('AccountsController:listAccounts');
  return sortAddressesWithInternalAccounts(deps, addresses, internalAccounts);
}

/**
 * Sorts a list of multichain addresses by the lastSelected timestamp derived
 * from the EOA account in their account group (via AccountTreeController).
 *
 * Extracted from MetamaskController.sortMultichainAccountsByLastSelected (L5347).
 * @param deps
 * @param addresses
 */
export function sortMultichainAccountsByLastSelected(
  deps: AccountManagementDependencies,
  addresses: string[],
): string[] {
  const getLastSelected = (address: string): number | undefined => {
    const account = deps.messenger.call(
      'AccountsController:getAccountByAddress',
      address,
    );
    if (!account) {
      return undefined;
    }
    const context = deps.messenger.call(
      'AccountTreeController:getAccountContext',
      (account as { id: string }).id,
    );
    if (!context) {
      return undefined;
    }
    const group = deps.messenger.call(
      'AccountTreeController:getAccountGroupObject',
      context.groupId,
    );
    if (!group) {
      return undefined;
    }
    for (const accountId of group.accounts) {
      const groupAccount = deps.messenger.call(
        'AccountsController:getAccount',
        accountId,
      );
      if (groupAccount && isEvmAccountType(groupAccount.type as never)) {
        return groupAccount.metadata.lastSelected;
      }
    }
    return undefined;
  };

  return [...addresses].sort(
    (a, b) => (getLastSelected(b) ?? 0) - (getLastSelected(a) ?? 0),
  );
}

/**
 * Sorts a list of addresses by lastSelected using a provided InternalAccount
 * list.  Throws if any address has no matching InternalAccount entry.
 * Calls captureKeyringTypesWithMissingIdentities before throwing so the
 * MC-level spy intercepts the diagnostic capture call.
 *
 * Extracted from MetamaskController.sortAddressesWithInternalAccounts (L5372).
 * @param deps
 * @param addresses
 * @param internalAccounts
 */
export function sortAddressesWithInternalAccounts(
  deps: AccountManagementDependencies,
  addresses: string[],
  internalAccounts: {
    address: string;
    metadata: { lastSelected?: number };
  }[],
): string[] {
  return [...addresses].sort((firstAddress, secondAddress) => {
    const firstAccount = internalAccounts.find(
      (account) => account.address.toLowerCase() === firstAddress.toLowerCase(),
    );

    const secondAccount = internalAccounts.find(
      (account) =>
        account.address.toLowerCase() === secondAddress.toLowerCase(),
    );

    if (!firstAccount) {
      deps.messenger.call(
        'AccountManagement:captureKeyringTypesWithMissingIdentities',
        internalAccounts,
        addresses,
      );
      throw new Error(`Missing identity for address: "${firstAddress}".`);
    } else if (!secondAccount) {
      deps.messenger.call(
        'AccountManagement:captureKeyringTypesWithMissingIdentities',
        internalAccounts,
        addresses,
      );
      throw new Error(`Missing identity for address: "${secondAddress}".`);
    } else if (
      firstAccount.metadata.lastSelected === secondAccount.metadata.lastSelected
    ) {
      return 0;
    } else if (firstAccount.metadata.lastSelected === undefined) {
      return 1;
    } else if (secondAccount.metadata.lastSelected === undefined) {
      return -1;
    }

    return (
      secondAccount.metadata.lastSelected - firstAccount.metadata.lastSelected
    );
  });
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for account-management messenger actions. */
export const ACCOUNT_MANAGEMENT_ACTIONS = {
  setSelectedAccount: 'AccountManagement:setSelectedAccount',
  setAccountLabel: 'AccountManagement:setAccountLabel',
  removeAccount: 'AccountManagement:removeAccount',
  addNewAccount: 'AccountManagement:addNewAccount',
  importAccountWithStrategy: 'AccountManagement:importAccountWithStrategy',
  resetAccount: 'AccountManagement:resetAccount',
  setSelectedMultichainAccount:
    'AccountManagement:setSelectedMultichainAccount',
  setAccountGroupName: 'AccountManagement:setAccountGroupName',
  getDiscoveryCountByProvider: 'AccountManagement:getDiscoveryCountByProvider',
  discoverAndCreateAccounts: 'AccountManagement:discoverAndCreateAccounts',
  addAccountsWithBalance: 'AccountManagement:addAccountsWithBalance',
  importAccountsWithBalances: 'AccountManagement:importAccountsWithBalances',
  getBalance: 'AccountManagement:getBalance',
  sortEvmAccountsByLastSelected:
    'AccountManagement:sortEvmAccountsByLastSelected',
  sortMultichainAccountsByLastSelected:
    'AccountManagement:sortMultichainAccountsByLastSelected',
  sortAddressesWithInternalAccounts:
    'AccountManagement:sortAddressesWithInternalAccounts',
  captureKeyringTypesWithMissingIdentities:
    'AccountManagement:captureKeyringTypesWithMissingIdentities',
} as const;

/**
 * Registers all account-management functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 * @param messenger
 */
export function registerActions(messenger: AccountManagementMessenger): void {
  const deps: AccountManagementDependencies = { messenger };
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setSelectedAccount,
    (id: string) => setSelectedAccount(deps, id),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setAccountLabel,
    (address: string, label: string) => setAccountLabel(deps, address, label),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.removeAccount,
    (address: string) => removeAccount(deps, address),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.addNewAccount,
    (accountCount?: number, keyringId?: string) =>
      addNewAccount(deps, accountCount, keyringId),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.importAccountWithStrategy,
    (
      strategy: string,
      args: unknown[],
      options?: {
        shouldCreateSocialBackup?: boolean;
        shouldSelectAccount?: boolean;
      },
    ) => importAccountWithStrategy(deps, strategy, args, options),
  );
  messenger.registerActionHandler(ACCOUNT_MANAGEMENT_ACTIONS.resetAccount, () =>
    resetAccount(deps),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setSelectedMultichainAccount,
    (accountGroupId: string) =>
      setSelectedMultichainAccount(deps, accountGroupId),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setAccountGroupName,
    (accountGroupId: string, accountGroupName: string) =>
      setAccountGroupName(deps, accountGroupId, accountGroupName),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.getDiscoveryCountByProvider,
    (
      accounts: { type: string }[],
      opts: {
        solanaAccountTypes: string[];
        bitcoinAccountTypes: string[];
        tronAccountTypes?: string[];
      },
    ) => getDiscoveryCountByProvider(deps, accounts, opts),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.discoverAndCreateAccounts,
    (opts: Parameters<typeof discoverAndCreateAccounts>[1]) =>
      discoverAndCreateAccounts(deps, opts),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.addAccountsWithBalance,
    (opts: Parameters<typeof addAccountsWithBalance>[1]) =>
      addAccountsWithBalance(deps, opts),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.importAccountsWithBalances,
    (opts: Parameters<typeof importAccountsWithBalances>[1]) =>
      importAccountsWithBalances(deps, opts),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.getBalance,
    (address: string, opts: Parameters<typeof getBalance>[2]) =>
      getBalance(deps, address, opts),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.sortEvmAccountsByLastSelected,
    (addresses: string[]) => sortEvmAccountsByLastSelected(deps, addresses),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.sortMultichainAccountsByLastSelected,
    (addresses: string[]) =>
      sortMultichainAccountsByLastSelected(deps, addresses),
  );
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.sortAddressesWithInternalAccounts,
    (
      addresses: string[],
      internalAccounts: {
        address: string;
        metadata: { lastSelected?: number };
      }[],
    ) => sortAddressesWithInternalAccounts(deps, addresses, internalAccounts),
  );
  // captureKeyringTypesWithMissingIdentities: MC overrides this handler in tests
  // to route to the MC instance method. In production, no-op is acceptable since
  // this is a diagnostic Sentry capture that should not block the error throw.
  messenger.registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.captureKeyringTypesWithMissingIdentities,
    () => undefined,
  );
}
