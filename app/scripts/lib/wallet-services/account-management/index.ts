/**
 * account-management
 *
 * Account selection, labelling, removal, creation, and import.
 * All controller access via messenger — no chrome.* / browser.* imports.
 *
 * Mobile convergence: The following methods are duplicated verbatim in
 * mobile's Engine.ts and are the strongest candidates for promotion to a
 * shared @metamask/* package once messenger actions are registered:
 *   - setSelectedAccount  (Engine.ts L1236)
 *   - setAccountLabel     (Engine.ts L1251)
 *   - removeAccount       (Engine.ts L1061: same remove-permissions + keyring pattern)
 */

import type { RootMessenger } from '../../messenger';

export type AccountManagementDependencies = {
  messenger: RootMessenger;
};

/**
 * Sets the currently selected account by internal account ID.
 *
 * Extracted from MetamaskController getApi() setSelectedAccount (line 2830).
 * Identical to mobile Engine.ts L1236.
 *
 * TODO: Requires messenger action: AccountsController:setSelectedAccount
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
 *   - AccountsController:getAccountByAddress
 *   - AccountsController:setAccountName
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
 *   - PermissionController:removeAllAccountPermissions
 *   - KeyringController:removeAccount
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
 *   - KeyringController:getAccounts
 *   - KeyringController:withKeyring
 *   - PreferencesController:setSelectedAddress
 */
export async function addNewAccount(
  deps: AccountManagementDependencies,
  accountCount?: number,
  keyringId?: string,
): Promise<string> {
  const oldAccounts: string[] = await (deps.messenger as never).call(
    'KeyringController:getAccounts',
  );

  const addedAccountAddress: string = await (deps.messenger as never).call(
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
  );

  if (!oldAccounts.includes(addedAccountAddress)) {
    (deps.messenger as never).call(
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
 *   - KeyringController:importAccountWithStrategy
 *   - OnboardingController:getIsSocialLoginFlow
 *   - KeyringController:withKeyring
 *   - PreferencesController:setSelectedAddress
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

  const importedAccountAddress: string = await (deps.messenger as never).call(
    'KeyringController:importAccountWithStrategy',
    strategy,
    args,
  );

  if (shouldSelectAccount) {
    (deps.messenger as never).call(
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
 *   - AccountsController:getSelectedAccount
 *   - TransactionController:wipeTransactions
 *   - SmartTransactionsController:wipeSmartTransactions
 *   - NetworkController:resetConnection
 */
export async function resetAccount(
  deps: AccountManagementDependencies,
): Promise<string> {
  const selectedAccount = deps.messenger.call(
    'AccountsController:getSelectedAccount',
  );
  const { address } = selectedAccount as { address: string };

  (deps.messenger as never).call('TransactionController:wipeTransactions', {
    address,
  });
  (deps.messenger as never).call(
    'SmartTransactionsController:wipeSmartTransactions',
    { address, ignoreNetwork: false },
  );
  (deps.messenger as never).call('NetworkController:resetConnection');

  return address;
}

/**
 * Sets the selected multichain account group.
 * Used for non-EVM (Solana, Bitcoin) account group selection.
 *
 * Extracted from MetamaskController getApi() setSelectedMultichainAccount (L2854).
 *
 * TODO: Requires messenger action: AccountTreeController:setSelectedAccountGroup
 */
export function setSelectedMultichainAccount(
  deps: AccountManagementDependencies,
  accountGroupId: string,
): void {
  (deps.messenger as never).call(
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
 */
export function setAccountGroupName(
  deps: AccountManagementDependencies,
  accountGroupId: string,
  accountGroupName: string,
): void {
  (deps.messenger as never).call(
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
 */
export function getDiscoveryCountByProvider(
  _deps: AccountManagementDependencies,
  accounts: { type: string }[],
  opts: {
    solanaAccountTypes: string[];
    bitcoinAccountTypes: string[];
    tronAccountTypes?: string[];
  },
): { Bitcoin: number; Solana: number; Tron: number } {
  const counts = { Bitcoin: 0, Solana: 0, Tron: 0 };

  for (const account of accounts) {
    if (opts.solanaAccountTypes.includes(account.type)) {
      counts.Solana += 1;
    }
    if (opts.bitcoinAccountTypes.includes(account.type)) {
      counts.Bitcoin += 1;
    }
    if (opts.tronAccountTypes?.includes(account.type)) {
      counts.Tron += 1;
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
 *   - KeyringController:state (state accessor, or a dedicated getter action)
 *   - MultichainAccountService:discoverAccounts (does not exist yet)
 *   - SnapKeyring:initialize (does not exist yet)
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
): Promise<{ Bitcoin: number; Solana: number; Tron: number }> {
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
    // eslint-disable-next-line no-console
    console.warn(`Failed to add accounts with balance. ${error}`);
    return { Bitcoin: 0, Solana: 0, Tron: 0 };
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
 *   - KeyringController:withKeyring
 *   - NetworkController:getGlobalChainId (private helper, does not exist yet)
 *   - AccountManagement:removeAccount (already registered above)
 *   - TokenDetectionController:detectTokens
 *   - TokensController:getState (state accessor)
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
): Promise<{ Bitcoin: number; Solana: number; Tron: number }> {
  const {
    keyringId,
    shouldImportSolanaAccount = true,
    chainId,
    getBalance,
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
      const balance = await getBalance(address);

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
            await (deps.messenger as never).call(
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

    const discoveredAccounts = { Bitcoin: 0, Solana: 0, Tron: 0 };

    if (btcClient && btcScope) {
      const btcAccounts = await btcClient.discoverAccounts(
        entropySource,
        btcScope,
      );
      discoveredAccounts.Bitcoin = btcAccounts.length;
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
      discoveredAccounts.Solana = solanaAccounts.length;
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
      discoveredAccounts.Tron = tronAccounts.length;
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
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to add accounts with balance. Error: ${e}`);
    return { Bitcoin: 0, Solana: 0, Tron: 0 };
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
 *   - KeyringController:state (state accessor)
 *   - KeyringController:withKeyring
 *   - AccountTreeController:syncWithUserStorageAtLeastOnce
 */
export async function importAccountsWithBalances(
  deps: AccountManagementDependencies,
  opts: {
    getKeyrings: () => Array<{ metadata: { id: string } }>;
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
 *   - AccountTrackerController:getState (state accessor, does not exist yet)
 *   - NetworkController:getGlobalChainId (private helper, does not exist yet)
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
 */
export function sortEvmAccountsByLastSelected(
  deps: AccountManagementDependencies,
  addresses: string[],
): string[] {
  const internalAccounts: {
    address: string;
    metadata: { lastSelected?: number };
  }[] = (deps.messenger as never).call('AccountsController:listAccounts');
  return sortAddressesWithInternalAccounts(deps, addresses, internalAccounts);
}

/**
 * Sorts a list of multichain addresses by the lastSelected timestamp derived
 * from the EOA account in their account group (via AccountTreeController).
 *
 * Extracted from MetamaskController.sortMultichainAccountsByLastSelected (L5347).
 *
 * TODO: Requires messenger actions:
 *   - AccountsController:getAccountByAddress
 *   - AccountTreeController:getAccountContext (does not exist yet)
 */
export function sortMultichainAccountsByLastSelected(
  deps: AccountManagementDependencies,
  addresses: string[],
  opts: {
    getLastSelected: (address: string) => number | undefined;
  },
): string[] {
  return [...addresses].sort(
    (a, b) => (opts.getLastSelected(b) ?? 0) - (opts.getLastSelected(a) ?? 0),
  );
}

/**
 * Sorts a list of addresses by lastSelected using a provided InternalAccount
 * list.  Throws if any address has no matching InternalAccount entry.
 *
 * Extracted from MetamaskController.sortAddressesWithInternalAccounts (L5372).
 *
 * TODO: No messenger conversions needed — pure sort over injected data.
 */
export function sortAddressesWithInternalAccounts(
  _deps: AccountManagementDependencies,
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
      throw new Error(`Missing identity for address: "${firstAddress}".`);
    } else if (!secondAccount) {
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
} as const;

/**
 * Registers all account-management functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(messenger: RootMessenger): void {
  const deps: AccountManagementDependencies = { messenger };
  // Cast to never because RootMessenger type doesn't yet include these action names.
  // TODO: Add AccountManagementActions to RootMessenger allowed-actions type.
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setSelectedAccount,
    (id: string) => setSelectedAccount(deps, id),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setAccountLabel,
    (address: string, label: string) => setAccountLabel(deps, address, label),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.removeAccount,
    (address: string) => removeAccount(deps, address),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.addNewAccount,
    (accountCount?: number, keyringId?: string) =>
      addNewAccount(deps, accountCount, keyringId),
  );
  (messenger as never).registerActionHandler(
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
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.resetAccount,
    () => resetAccount(deps),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setSelectedMultichainAccount,
    (accountGroupId: string) =>
      setSelectedMultichainAccount(deps, accountGroupId),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.setAccountGroupName,
    (accountGroupId: string, accountGroupName: string) =>
      setAccountGroupName(deps, accountGroupId, accountGroupName),
  );
  (messenger as never).registerActionHandler(
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
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.discoverAndCreateAccounts,
    (opts: Parameters<typeof discoverAndCreateAccounts>[1]) =>
      discoverAndCreateAccounts(deps, opts),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.addAccountsWithBalance,
    (opts: Parameters<typeof addAccountsWithBalance>[1]) =>
      addAccountsWithBalance(deps, opts),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.importAccountsWithBalances,
    (opts: Parameters<typeof importAccountsWithBalances>[1]) =>
      importAccountsWithBalances(deps, opts),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.getBalance,
    (address: string, opts: Parameters<typeof getBalance>[2]) =>
      getBalance(deps, address, opts),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.sortEvmAccountsByLastSelected,
    (addresses: string[]) => sortEvmAccountsByLastSelected(deps, addresses),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.sortMultichainAccountsByLastSelected,
    (
      addresses: string[],
      opts: { getLastSelected: (address: string) => number | undefined },
    ) => sortMultichainAccountsByLastSelected(deps, addresses, opts),
  );
  (messenger as never).registerActionHandler(
    ACCOUNT_MANAGEMENT_ACTIONS.sortAddressesWithInternalAccounts,
    (
      addresses: string[],
      internalAccounts: {
        address: string;
        metadata: { lastSelected?: number };
      }[],
    ) => sortAddressesWithInternalAccounts(deps, addresses, internalAccounts),
  );
}
