/* Account Tracker
 *
 * This module is responsible for tracking any number of accounts
 * and caching their current balances & transaction counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status
 * on each new block.
 */

import { v4 as random } from 'uuid';

import log from 'loglevel';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import SINGLE_CALL_BALANCES_ABI from 'single-call-balance-checker-abi';
import { cloneDeep } from 'lodash';
import {
  BlockTracker,
  NetworkClientConfiguration,
  NetworkClientId,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  Provider,
} from '@metamask/network-controller';
import {
  hasProperty,
  toCaipAccountId,
  type Hex,
  type JsonRpcParams,
} from '@metamask/utils';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedMessenger,
} from '@metamask/base-controller';
import { toHex } from '@metamask/controller-utils';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import { KeyringControllerAccountRemovedEvent } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';

import { LOCALHOST_RPC_URL } from '../../../shared/constants/network';
import { SINGLE_CALL_BALANCES_ADDRESSES } from '../constants/contracts';
import { ACCOUNTS_PROD_API_BASE_URL } from '../../../shared/constants/accounts';
import { previousValueComparator } from '../lib/util';
import {
  fetchAccountBalancesInBatches,
  type AccountApiBalanceResponse,
} from '../lib/batch-utils';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from './onboarding';
import { PreferencesControllerGetStateAction } from './preferences-controller';

// Unique name for the controller
const controllerName = 'AccountTrackerController';

// Maximum number of accounts per Account API request to avoid API limits
const ACCOUNT_API_BATCH_SIZE = 50;

export type StakedBalance = string;

type Account = {
  address: string;
  balance: string | null;
  stakedBalance?: StakedBalance;
};

/**
 * The state of the {@link AccountTrackerController}
 *
 * @property accounts - The accounts currently stored in this AccountTrackerController
 * @property accountsByChainId - The accounts currently stored in this AccountTrackerController keyed by chain id
 * @property currentBlockGasLimit - A hex string indicating the gas limit of the current block
 * @property currentBlockGasLimitByChainId - A hex string indicating the gas limit of the current block keyed by chain id
 */
export type AccountTrackerControllerState = {
  accounts: Record<string, Account | Record<string, never>>;
  currentBlockGasLimit: string;
  accountsByChainId: Record<string, AccountTrackerControllerState['accounts']>;
  currentBlockGasLimitByChainId: Record<Hex, string>;
};

/**
 * {@link AccountTrackerController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const controllerMetadata = {
  accounts: {
    includeInStateLogs: false,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  currentBlockGasLimit: {
    includeInStateLogs: false,
    persist: true,
    anonymous: true,
    usedInUi: true,
  },
  accountsByChainId: {
    includeInStateLogs: false,
    persist: true,
    anonymous: false,
    usedInUi: true,
  },
  currentBlockGasLimitByChainId: {
    includeInStateLogs: false,
    persist: true,
    anonymous: true,
    usedInUi: true,
  },
};

/**
 * Function to get default state of the {@link AccountTrackerController}.
 */
export const getDefaultAccountTrackerControllerState =
  (): AccountTrackerControllerState => ({
    accounts: {},
    currentBlockGasLimit: '',
    accountsByChainId: {},
    currentBlockGasLimitByChainId: {},
  });

/**
 * Returns the state of the {@link AccountTrackerController}.
 */
export type AccountTrackerControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  AccountTrackerControllerState
>;

/**
 * Action to update native balances.
 */
export type AccountTrackerUpdateNativeBalancesAction = {
  type: `${typeof controllerName}:updateNativeBalances`;
  handler: AccountTrackerController['updateNativeBalances'];
};

/**
 * Action to update staked balances.
 */
export type AccountTrackerUpdateStakedBalancesAction = {
  type: `${typeof controllerName}:updateStakedBalances`;
  handler: AccountTrackerController['updateStakedBalances'];
};

/**
 * Actions exposed by the {@link AccountTrackerController}.
 */
export type AccountTrackerControllerActions =
  | AccountTrackerControllerGetStateAction
  | AccountTrackerUpdateNativeBalancesAction
  | AccountTrackerUpdateStakedBalancesAction;

/**
 * Event emitted when the state of the {@link AccountTrackerController} changes.
 */
export type AccountTrackerControllerStateChangeEvent =
  ControllerStateChangeEvent<
    typeof controllerName,
    AccountTrackerControllerState
  >;

/**
 * Events emitted by {@link AccountTrackerController}.
 */
export type AccountTrackerControllerEvents =
  AccountTrackerControllerStateChangeEvent;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | OnboardingControllerGetStateAction
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents =
  | AccountsControllerSelectedEvmAccountChangeEvent
  | KeyringControllerAccountRemovedEvent
  | OnboardingControllerStateChangeEvent;

/**
 * Messenger type for the {@link AccountTrackerController}.
 */
export type AccountTrackerControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  AccountTrackerControllerActions | AllowedActions,
  AccountTrackerControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

export type AccountTrackerControllerOptions = {
  state: Partial<AccountTrackerControllerState>;
  messenger: AccountTrackerControllerMessenger;
  provider: Provider;
  blockTracker: BlockTracker;
  getNetworkIdentifier: (config?: NetworkClientConfiguration) => string;
  accountsApiChainIds?: () => string[];
};

/**
 * This module is responsible for tracking any number of accounts and caching their current balances & transaction
 * counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status on each new block.
 *
 */
export default class AccountTrackerController extends BaseController<
  typeof controllerName,
  AccountTrackerControllerState,
  AccountTrackerControllerMessenger
> {
  #pollingTokenSets = new Map<NetworkClientId, Set<string>>();

  #listeners: Record<NetworkClientId, (blockNumber: string) => Promise<void>> =
    {};

  #provider: Provider;

  #blockTracker: BlockTracker;

  #currentBlockNumberByChainId: Record<Hex, string | null> = {};

  #getNetworkIdentifier: AccountTrackerControllerOptions['getNetworkIdentifier'];

  #selectedAccount: InternalAccount;

  #accountsApiChainIds: () => string[];

  /**
   * @param options - Options for initializing the controller
   * @param options.state - Initial controller state.
   * @param options.messenger - Messenger used to communicate with BaseV2 controller.
   * @param options.provider - An EIP-1193 provider instance that uses the current global network
   * @param options.blockTracker - A block tracker, which emits events for each new block
   * @param options.getNetworkIdentifier - A function that returns the current network or passed network configuration
   * @param options.preferencesControllerState - The state of preferences controller
   */
  constructor(options: AccountTrackerControllerOptions) {
    super({
      name: controllerName,
      metadata: controllerMetadata,
      state: {
        ...getDefaultAccountTrackerControllerState(),
        ...options.state,
      },
      messenger: options.messenger,
    });

    this.#provider = options.provider;
    this.#blockTracker = options.blockTracker;

    this.#getNetworkIdentifier = options.getNetworkIdentifier;

    // Initialize account API configuration
    this.#accountsApiChainIds = options.accountsApiChainIds ?? (() => []);

    // subscribe to account removal
    this.messagingSystem.subscribe(
      'KeyringController:accountRemoved',
      (address) => this.removeAccounts([address]),
    );

    const onboardingState = this.messagingSystem.call(
      'OnboardingController:getState',
    );
    this.messagingSystem.subscribe(
      'OnboardingController:stateChange',
      previousValueComparator((prevState, currState) => {
        const { completedOnboarding: prevCompletedOnboarding } = prevState;
        const { completedOnboarding: currCompletedOnboarding } = currState;
        if (!prevCompletedOnboarding && currCompletedOnboarding) {
          this.updateAccountsAllActiveNetworks();
        }
        return true;
      }, onboardingState),
    );

    this.#selectedAccount = this.messagingSystem.call(
      'AccountsController:getSelectedAccount',
    );

    this.messagingSystem.subscribe(
      'AccountsController:selectedEvmAccountChange',
      (newAccount) => {
        const { useMultiAccountBalanceChecker } = this.messagingSystem.call(
          'PreferencesController:getState',
        );

        if (
          this.#selectedAccount.id !== newAccount.id &&
          !useMultiAccountBalanceChecker
        ) {
          this.#selectedAccount = newAccount;
          this.updateAccountsAllActiveNetworks();
        }
      },
    );

    // Register message handlers
    this._registerMessageHandlers();
  }

  resetState(): void {
    const {
      accounts,
      accountsByChainId,
      currentBlockGasLimit,
      currentBlockGasLimitByChainId,
    } = getDefaultAccountTrackerControllerState();
    this.update((state) => {
      state.accounts = accounts;
      state.accountsByChainId = accountsByChainId;
      state.currentBlockGasLimit = currentBlockGasLimit;
      state.currentBlockGasLimitByChainId = currentBlockGasLimitByChainId;
    });
  }

  /**
   * Starts polling with global selected network
   */
  start(): void {
    // blockTracker.currentBlock may be null
    this.#currentBlockNumberByChainId = {
      [this.#getCurrentChainId()]: this.#blockTracker.getCurrentBlock(),
    };
    this.#blockTracker.once('latest', (blockNumber) => {
      this.#currentBlockNumberByChainId[this.#getCurrentChainId()] =
        blockNumber;
    });

    // remove first to avoid double add
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.#blockTracker.removeListener('latest', this.#updateForBlock);
    // add listener
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.#blockTracker.addListener('latest', this.#updateForBlock);
    // fetch account balances
    this.updateAccounts();
  }

  /**
   * Stops polling with global selected network
   */
  stop(): void {
    // remove listener
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.#blockTracker.removeListener('latest', this.#updateForBlock);
  }

  /**
   * Gets the current chain ID.
   */
  #getCurrentChainId(): Hex {
    const { selectedNetworkClientId } = this.messagingSystem.call(
      'NetworkController:getState',
    );
    const {
      configuration: { chainId },
    } = this.messagingSystem.call(
      'NetworkController:getNetworkClientById',
      selectedNetworkClientId,
    );
    return chainId;
  }

  /**
   * Resolves a networkClientId to a network client config
   * or globally selected network config if not provided
   *
   * @param networkClientId - Optional networkClientId to fetch a network client with
   * @returns network client config
   */
  #getCorrectNetworkClient(networkClientId?: NetworkClientId): {
    chainId: Hex;
    provider: Provider;
    blockTracker: BlockTracker;
    identifier: string;
  } {
    if (networkClientId) {
      const { configuration, provider, blockTracker } =
        this.messagingSystem.call(
          'NetworkController:getNetworkClientById',
          networkClientId,
        );

      return {
        chainId: configuration.chainId,
        provider,
        blockTracker,
        identifier: this.#getNetworkIdentifier(configuration),
      };
    }
    return {
      chainId: this.#getCurrentChainId(),
      provider: this.#provider,
      blockTracker: this.#blockTracker,
      identifier: this.#getNetworkIdentifier(),
    };
  }

  /**
   * Starts polling for a networkClientId
   *
   * @param networkClientId - The networkClientId to start polling for
   * @returns pollingToken
   */
  startPollingByNetworkClientId(networkClientId: NetworkClientId): string {
    const pollToken = random();

    const pollingTokenSet = this.#pollingTokenSets.get(networkClientId);
    if (pollingTokenSet) {
      pollingTokenSet.add(pollToken);
    } else {
      const set = new Set<string>();
      set.add(pollToken);
      this.#pollingTokenSets.set(networkClientId, set);
      this.#subscribeWithNetworkClientId(networkClientId);
    }
    return pollToken;
  }

  /**
   * Stops polling for all networkClientIds
   */
  stopAllPolling(): void {
    this.stop();
    this.#pollingTokenSets.forEach((tokenSet, _networkClientId) => {
      tokenSet.forEach((token) => {
        this.stopPollingByPollingToken(token);
      });
    });
  }

  /**
   * Stops polling for a networkClientId
   *
   * @param pollingToken - The polling token to stop polling for
   */
  stopPollingByPollingToken(pollingToken: string | undefined): void {
    if (!pollingToken) {
      throw new Error('pollingToken required');
    }
    this.#pollingTokenSets.forEach((tokenSet, key) => {
      if (tokenSet.has(pollingToken)) {
        tokenSet.delete(pollingToken);
        if (tokenSet.size === 0) {
          this.#pollingTokenSets.delete(key);
          this.#unsubscribeWithNetworkClientId(key);
        }
      }
    });
  }

  /**
   * Subscribes from the block tracker for the given networkClientId if not currently subscribed
   *
   * @param networkClientId - network client ID to fetch a block tracker with
   */
  #subscribeWithNetworkClientId(networkClientId: NetworkClientId): void {
    if (this.#listeners[networkClientId]) {
      return;
    }
    const { blockTracker } = this.#getCorrectNetworkClient(networkClientId);
    const updateForBlock = (blockNumber: string) =>
      this.#updateForBlockByNetworkClientId(networkClientId, blockNumber);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    blockTracker.addListener('latest', updateForBlock);

    this.#listeners[networkClientId] = updateForBlock;

    this.updateAccounts(networkClientId);
  }

  /**
   * Unsubscribes from the block tracker for the given networkClientId if currently subscribed
   *
   * @param networkClientId - The network client ID to fetch a block tracker with
   */
  #unsubscribeWithNetworkClientId(networkClientId: NetworkClientId): void {
    if (!this.#listeners[networkClientId]) {
      return;
    }
    const { blockTracker } = this.#getCorrectNetworkClient(networkClientId);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    blockTracker.removeListener('latest', this.#listeners[networkClientId]);

    delete this.#listeners[networkClientId];
  }

  /**
   * Returns the accounts object for the chain ID, or initializes it from the globally selected
   * if it doesn't already exist.
   *
   * @param chainId - The chain ID
   */
  #getAccountsForChainId(
    chainId: Hex,
  ): AccountTrackerControllerState['accounts'] {
    const { accounts, accountsByChainId } = this.state;
    if (accountsByChainId[chainId]) {
      return cloneDeep(accountsByChainId[chainId]);
    }

    const newAccounts: AccountTrackerControllerState['accounts'] = {};
    Object.keys(accounts).forEach((address) => {
      newAccounts[address] = {};
    });
    return newAccounts;
  }

  /**
   * Ensures that the locally stored accounts are in sync with a set of accounts stored externally to this
   * AccountTrackerController.
   *
   * Once this AccountTrackerController accounts are up to date with those referenced by the passed addresses, each
   * of these accounts are given an updated balance via Provider.
   *
   * @param addresses - The array of hex addresses for accounts with which this AccountTrackerController accounts should be
   * in sync
   */
  syncWithAddresses(addresses: string[]): void {
    const { accounts } = this.state;
    const locals = Object.keys(accounts);

    const accountsToAdd: string[] = [];
    addresses.forEach((upstream) => {
      if (!locals.includes(upstream)) {
        accountsToAdd.push(upstream);
      }
    });

    const accountsToRemove: string[] = [];
    locals.forEach((local) => {
      if (!addresses.includes(local)) {
        accountsToRemove.push(local);
      }
    });

    this.addAccounts(accountsToAdd);
    this.removeAccounts(accountsToRemove);
  }

  /**
   * Adds new addresses to track the balances of
   * given a balance as long this.#currentBlockNumberByChainId is defined for the chainId.
   *
   * @param addresses - An array of hex addresses of new accounts to track
   */
  addAccounts(addresses: string[]): void {
    const { accounts: _accounts, accountsByChainId: _accountsByChainId } =
      this.state;
    const accounts = cloneDeep(_accounts);
    const accountsByChainId = cloneDeep(_accountsByChainId);

    // add initial state for addresses
    addresses.forEach((address) => {
      accounts[address] = {};
    });
    Object.keys(accountsByChainId).forEach((chainId) => {
      addresses.forEach((address) => {
        accountsByChainId[chainId][address] = {};
      });
    });
    // save accounts state
    this.update((state) => {
      state.accounts = accounts;
      state.accountsByChainId = accountsByChainId;
    });

    // fetch balances for the accounts if there is block number ready
    if (this.#currentBlockNumberByChainId[this.#getCurrentChainId()]) {
      this.updateAccounts();
    }
    this.#pollingTokenSets.forEach((_tokenSet, networkClientId) => {
      const { chainId } = this.#getCorrectNetworkClient(networkClientId);
      if (this.#currentBlockNumberByChainId[chainId]) {
        this.updateAccounts(networkClientId);
      }
    });
  }

  /**
   * Removes accounts from being tracked
   *
   * @param addresses - An array of hex addresses to stop tracking.
   */
  removeAccounts(addresses: string[]): void {
    const { accounts: _accounts, accountsByChainId: _accountsByChainId } =
      this.state;
    const accounts = cloneDeep(_accounts);
    const accountsByChainId = cloneDeep(_accountsByChainId);

    // remove each state object
    addresses.forEach((address) => {
      delete accounts[address];
    });
    Object.keys(accountsByChainId).forEach((chainId) => {
      addresses.forEach((address) => {
        delete accountsByChainId[chainId][address];
      });
    });
    // save accounts state
    this.update((state) => {
      state.accounts = accounts;
      state.accountsByChainId = accountsByChainId;
    });
  }

  /**
   * Removes all addresses and associated balances
   */
  clearAccounts(): void {
    this.update((state) => {
      state.accounts = {};
      state.accountsByChainId = {
        [this.#getCurrentChainId()]: {},
      };
    });
  }

  /**
   * Given a block, updates this AccountTrackerController currentBlockGasLimit and currentBlockGasLimitByChainId and then updates
   * each local account's balance via Provider
   *
   * @private
   * @param blockNumber - the block number to update to.
   * @fires 'block' The updated state, if all account updates are successful
   */
  #updateForBlock = async (blockNumber: string): Promise<void> => {
    await this.#updateForBlockByNetworkClientId(undefined, blockNumber);
  };

  /**
   * Given a block, updates this AccountTrackerController currentBlockGasLimitByChainId, and then updates each local account's balance
   * via Provider
   *
   * @private
   * @param networkClientId - optional network client ID to use instead of the globally selected network.
   * @param blockNumber - the block number to update to.
   * @fires 'block' The updated state, if all account updates are successful
   */
  async #updateForBlockByNetworkClientId(
    networkClientId: NetworkClientId | undefined,
    blockNumber: string,
  ): Promise<void> {
    const { chainId, provider } =
      this.#getCorrectNetworkClient(networkClientId);
    this.#currentBlockNumberByChainId[chainId] = blockNumber;

    // block gasLimit polling shouldn't be in account-tracker shouldn't be here...
    const currentBlock = await provider.request<
      JsonRpcParams,
      { gasLimit: string }
    >({
      method: 'eth_getBlockByNumber',
      params: [blockNumber, false],
    });
    if (!currentBlock) {
      return;
    }
    const currentBlockGasLimit = currentBlock.gasLimit;
    this.update((state) => {
      if (chainId === this.#getCurrentChainId()) {
        state.currentBlockGasLimit = currentBlockGasLimit;
      }
      state.currentBlockGasLimitByChainId[chainId] = currentBlockGasLimit;
    });

    try {
      await this.updateAccounts(networkClientId);
    } catch (err) {
      log.error(err);
    }
  }

  /**
   * Updates accounts for the globally selected network
   * and all networks that are currently being polled.
   * Uses v4 multiaccount API when possible for efficiency.
   */
  async updateAccountsAllActiveNetworks(): Promise<void> {
    const { completedOnboarding } = this.messagingSystem.call(
      'OnboardingController:getState',
    );
    if (!completedOnboarding) {
      return;
    }

    const { useMultiAccountBalanceChecker } = this.messagingSystem.call(
      'PreferencesController:getState',
    );

    let addresses = [];
    if (useMultiAccountBalanceChecker) {
      const { accounts } = this.state;
      addresses = Object.keys(accounts);
    } else {
      const selectedAddress = this.messagingSystem.call(
        'AccountsController:getSelectedAccount',
      ).address;
      addresses = [selectedAddress];
    }

    // Try multichain API first if we have supported chains and multiple accounts
    const { useExternalServices: allowExternalServices } =
      this.messagingSystem.call('PreferencesController:getState');

    const hasAccountApiChains = this.#accountsApiChainIds().length > 0;
    if (
      hasAccountApiChains &&
      allowExternalServices &&
      useMultiAccountBalanceChecker
    ) {
      try {
        const success = await this.#updateAccountsAllChainsViaApi(addresses);
        if (success) {
          log.debug(
            'Successfully updated all accounts via multiaccount API v4',
          );
          return;
        }
      } catch (error) {
        log.warn(
          'Multiaccount API failed, falling back to individual requests:',
          error,
        );
      }
    }

    // Fallback to individual network requests
    await this.updateAccounts();
    await Promise.all(
      Array.from(this.#pollingTokenSets).map(([networkClientId]) => {
        return this.updateAccounts(networkClientId);
      }),
    );
  }

  /**
   * balanceChecker is deployed on main eth (test)nets and requires a single call
   * for all other networks, calls this.#updateAccount for each account in this.store
   *
   * @param networkClientId - optional network client ID to use instead of the globally selected network.
   */
  async updateAccounts(networkClientId?: NetworkClientId): Promise<void> {
    const { completedOnboarding } = this.messagingSystem.call(
      'OnboardingController:getState',
    );
    if (!completedOnboarding) {
      return;
    }

    const { chainId, provider, identifier } =
      this.#getCorrectNetworkClient(networkClientId);
    const { useMultiAccountBalanceChecker, useExternalServices } =
      this.messagingSystem.call('PreferencesController:getState');

    let addresses = [];
    if (useMultiAccountBalanceChecker) {
      const { accounts } = this.state;

      addresses = Object.keys(accounts);
    } else {
      const selectedAddress = this.messagingSystem.call(
        'AccountsController:getSelectedAccount',
      ).address;

      addresses = [selectedAddress];
    }

    // Try account API first if chain is supported by feature flag
    let accountApiSuccess = false;
    const isChainSupported = this.#accountsApiChainIds().includes(chainId);

    if (
      isChainSupported &&
      useExternalServices &&
      useMultiAccountBalanceChecker
    ) {
      try {
        accountApiSuccess = await this.#updateAccountsViaApi(
          addresses,
          chainId,
        );
        if (accountApiSuccess) {
          log.debug(
            `Successfully updated balances via multiaccount API v4 for chain ${chainId}`,
          );
          return;
        }
      } catch (error) {
        log.warn(
          'Account API failed, falling back to RPC/balance checker:',
          error,
        );
      }
    }

    // Fallback to existing methods if account API wasn't successful
    const rpcUrl = 'http://127.0.0.1:8545';
    if (
      identifier === LOCALHOST_RPC_URL ||
      identifier === rpcUrl ||
      !((id): id is keyof typeof SINGLE_CALL_BALANCES_ADDRESSES =>
        id in SINGLE_CALL_BALANCES_ADDRESSES)(chainId)
    ) {
      await Promise.all(
        addresses.map((address) =>
          this.#updateAccount(address, provider, chainId),
        ),
      );
    } else {
      await this.#updateAccountsViaBalanceChecker(
        addresses,
        SINGLE_CALL_BALANCES_ADDRESSES[chainId],
        provider,
        chainId,
      );
    }
  }

  async updateAccountByAddress({
    address,
    networkClientId,
  }: {
    address?: string;
    networkClientId?: NetworkClientId;
  } = {}): Promise<void> {
    const { completedOnboarding } = this.messagingSystem.call(
      'OnboardingController:getState',
    );
    if (!completedOnboarding) {
      return;
    }

    const selectedAddress =
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      address ||
      this.messagingSystem.call('AccountsController:getSelectedAccount')
        .address;

    if (!selectedAddress) {
      return;
    }

    const { chainId, provider } =
      this.#getCorrectNetworkClient(networkClientId);

    await this.#updateAccount(selectedAddress, provider, chainId);
  }

  /**
   * Updates the current balance of an account.
   *
   * @private
   * @param address - A hex address of a the account to be updated
   * @param provider - The provider instance to fetch the balance with
   * @param chainId - The chain ID to update in state
   */

  async #updateAccount(
    address: string,
    provider: Provider,
    chainId: Hex,
  ): Promise<void> {
    const { useMultiAccountBalanceChecker } = this.messagingSystem.call(
      'PreferencesController:getState',
    );

    let balance = '0x0';

    // query balance
    try {
      balance = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        hasProperty(error, 'data') &&
        error.data &&
        hasProperty(error.data, 'request') &&
        error.data.request &&
        hasProperty(error.data.request, 'method') &&
        error.data.request.method !== 'eth_getBalance'
      ) {
        throw error;
      }
    }

    const result = { address, balance };
    // update accounts state
    const accounts = this.#getAccountsForChainId(chainId);
    // only populate if the entry is still present
    if (!accounts[address]) {
      return;
    }

    let newAccounts = accounts;
    if (!useMultiAccountBalanceChecker) {
      newAccounts = {};
      Object.keys(accounts).forEach((accountAddress) => {
        if (address !== accountAddress) {
          newAccounts[accountAddress] = {
            address: accountAddress,
            balance: null,
          };
        }
      });
    }

    newAccounts[address] = result;

    this.update((state) => {
      if (chainId === this.#getCurrentChainId()) {
        state.accounts = newAccounts;
      }
      state.accountsByChainId[chainId] = newAccounts;
    });
  }

  /**
   * Updates current address balances from balanceChecker deployed contract instance
   *
   * @private
   * @param addresses - A hex addresses of a the accounts to be updated
   * @param deployedContractAddress - The contract address to fetch balances with
   * @param provider - The provider instance to fetch the balance with
   * @param chainId - The chain ID to update in state
   */
  async #updateAccountsViaBalanceChecker(
    addresses: string[],
    deployedContractAddress: string,
    provider: Provider,
    chainId: Hex,
  ): Promise<void> {
    const ethContract = await new Contract(
      deployedContractAddress,
      SINGLE_CALL_BALANCES_ABI,
      new Web3Provider(provider),
    );
    const ethBalance = ['0x0000000000000000000000000000000000000000'];

    try {
      const balances = await ethContract.balances(addresses, ethBalance);

      const accounts = this.#getAccountsForChainId(chainId);
      const newAccounts: AccountTrackerControllerState['accounts'] = {};
      Object.keys(accounts).forEach((address) => {
        if (!addresses.includes(address)) {
          newAccounts[address] = { address, balance: null };
        }
      });
      addresses.forEach((address, index) => {
        const balance = balances[index] ? balances[index].toHexString() : '0x0';
        newAccounts[address] = { address, balance };
      });

      this.update((state) => {
        if (chainId === this.#getCurrentChainId()) {
          state.accounts = newAccounts;
        }
        state.accountsByChainId[chainId] = newAccounts;
      });
    } catch (error) {
      log.warn(
        `MetaMask - Account Tracker single call balance fetch failed`,
        error,
      );
      Promise.allSettled(
        addresses.map((address) =>
          this.#updateAccount(address, provider, chainId),
        ),
      );
    }
  }

  /**
   * Updates the balances of multiple native tokens in a single batch operation.
   * This is more efficient than calling updateNativeToken multiple times as it
   * triggers only one state update.
   *
   * @param balances - Array of balance updates, each containing address, chainId, and balance.
   */
  updateNativeBalances(
    balances: { address: string; chainId: Hex; balance: string }[],
  ) {
    this.update((state) => {
      balances.forEach(({ address, chainId, balance }) => {
        // Temporary until moving AccountTrackerController in core with an normalized format
        // accountsByChainId works with lowercase addresses, this is just a safe guard in case address is in checksum format
        // Convert address to lowercase to match extension's accountsByChainId format
        const lowercaseAddress = address.toLowerCase();

        // Ensure the chainId exists in the state
        if (!state.accountsByChainId[chainId]) {
          state.accountsByChainId[chainId] = {};
        }
        // Ensure the address exists for this chain
        if (!state.accountsByChainId[chainId][lowercaseAddress]) {
          state.accountsByChainId[chainId][lowercaseAddress] = {
            address: lowercaseAddress,
            balance: '0x0',
          };
        }
        // Update the balance
        if (balance) {
          state.accountsByChainId[chainId][lowercaseAddress].balance =
            toHex(balance);
        }
      });
    });
  }

  /**
   * Updates the staked balances of multiple accounts in a single batch operation.
   * This is more efficient than updating staked balances individually as it
   * triggers only one state update.
   *
   * @param stakedBalances - Array of staked balance updates, each containing address, chainId, and stakedBalance.
   */
  updateStakedBalances(
    stakedBalances: {
      address: string;
      chainId: Hex;
      stakedBalance: StakedBalance;
    }[],
  ) {
    this.update((state) => {
      stakedBalances.forEach(({ address, chainId, stakedBalance }) => {
        // Ensure the chainId exists in the state
        if (!state.accountsByChainId[chainId]) {
          state.accountsByChainId[chainId] = {};
        }
        // Ensure the address exists for this chain
        if (!state.accountsByChainId[chainId][address]) {
          state.accountsByChainId[chainId][address] = {
            address,
            balance: '0x0',
          };
        }
        // Update the staked balance
        if (stakedBalance) {
          state.accountsByChainId[chainId][address].stakedBalance =
            toHex(stakedBalance);
        }
      });
    });
  }

  /**
   * Fetches account balances from the account API service (v4 multiaccount endpoint)
   * Supports multichain and multiAccount requests with automatic batching
   * Uses CAIP format for addresses: eip155:0:0x...
   * Batches requests to maximum of 50 accounts per API call to avoid API limits
   *
   * @private
   * @param addresses - Array of account addresses (hex format, will be converted to CAIP)
   * @param chainIds - Array of chain IDs to fetch balances for
   * @returns Promise resolving to account balance data or null if failed
   */
  async #fetchAccountBalancesFromApi(
    addresses: string[],
    chainIds: Hex[],
  ): Promise<AccountApiBalanceResponse | null> {
    try {
      // Check if external services are allowed
      const { useExternalServices } = this.messagingSystem.call(
        'PreferencesController:getState',
      );
      if (!useExternalServices) {
        return null;
      }

      // Filter chain IDs by feature flag support (hex format), then convert to decimal for API
      const supportedChainIds = chainIds
        .filter((chainId) => this.#accountsApiChainIds().includes(chainId))
        .map((chainId) => chainId);

      if (supportedChainIds.length === 0) {
        return null;
      }

      // Use batch utility to process addresses in parallel using Promise.all
      const result = await fetchAccountBalancesInBatches({
        addresses,
        supportedChainIds,
        accountApiBaseUrl: ACCOUNTS_PROD_API_BASE_URL,
        batchSize: ACCOUNT_API_BATCH_SIZE,
        logger: {
          warn: (message: string) => log.warn(message),
          debug: (message: string) => log.debug(message),
        },
      });
      return result;
    } catch (error) {
      log.warn('Failed to fetch balances from account API:', error);
      return null;
    }
  }

  /**
   * Updates account balances using data from the account API (v4 multiaccount)
   *
   * @private
   * @param addresses - Array of account addresses
   * @param chainId - Single chain ID to fetch balances for
   * @returns Promise resolving to true if successful, false otherwise
   */
  async #updateAccountsViaApiMultichain(
    addresses: string[],
    chainId: Hex,
  ): Promise<boolean> {
    try {
      const apiData = await this.#fetchAccountBalancesFromApi(addresses, [
        chainId,
      ]);

      if (!apiData?.balances) {
        return false;
      }

      // Process API data and update state for the chain
      this.update((state) => {
        const accounts = this.#getAccountsForChainId(chainId);
        const newAccounts: AccountTrackerControllerState['accounts'] = {};

        // Initialize all accounts with null balance first
        Object.keys(accounts).forEach((address) => {
          if (!addresses.includes(address)) {
            newAccounts[address] = { address, balance: null };
          }
        });

        // Update with API data if available
        // The API returns token objects indexed by numbers, not by chain ID
        addresses.forEach((address) => {
          // Convert address to CAIP format for API lookup
          const caipAddress = toCaipAccountId('eip155', chainId, address);

          // Find the native token for this address in the API response
          let nativeToken = null;
          for (const tokenKey in apiData.balances) {
            if (
              Object.prototype.hasOwnProperty.call(apiData.balances, tokenKey)
            ) {
              const token = apiData.balances[tokenKey];
              if (
                token.accountAddress === caipAddress &&
                token.type === 'native' &&
                token.address === '0x0000000000000000000000000000000000000000'
              ) {
                nativeToken = token;
                break;
              }
            }
          }

          if (nativeToken) {
            // Convert decimal balance to hex
            const balanceInWei = BigInt(
              Math.floor(
                parseFloat(nativeToken.balance) *
                  Math.pow(10, nativeToken.decimals),
              ),
            );
            newAccounts[address] = {
              address,
              balance: `0x${balanceInWei.toString(16)}`,
            };
          } else {
            // No API data for this address - keep existing balance or set to null
            const existingAccount = accounts[address];
            newAccounts[address] = existingAccount || {
              address,
              balance: null,
            };
          }
        });

        // Update state for this chain
        if (chainId === this.#getCurrentChainId()) {
          state.accounts = newAccounts;
        }
        state.accountsByChainId[chainId] = newAccounts;
      });

      return true;
    } catch (error) {
      log.warn('Failed to update accounts via multiaccount API:', error);
      return false;
    }
  }

  /**
   * Updates account balances using data from the account API (single chain)
   * Fallback method for single-chain requests
   *
   * @private
   * @param addresses - Array of account addresses
   * @param chainId - The chain ID
   * @returns Promise resolving to true if successful, false otherwise
   */
  async #updateAccountsViaApi(
    addresses: string[],
    chainId: Hex,
  ): Promise<boolean> {
    return this.#updateAccountsViaApiMultichain(addresses, chainId);
  }

  /**
   * Updates account balances for all active networks using v4 multiaccount API
   *
   * @private
   * @param addresses - Array of account addresses
   * @returns Promise resolving to true if successful, false otherwise
   */
  async #updateAccountsAllChainsViaApi(addresses: string[]): Promise<boolean> {
    try {
      // Get all active chain IDs from pollingTokenSets and current chain
      const activeChainIds = new Set<Hex>();
      activeChainIds.add(this.#getCurrentChainId());

      // Add chain IDs from all actively polled networks
      this.#pollingTokenSets.forEach((_tokenSet, networkClientId) => {
        const { chainId } = this.#getCorrectNetworkClient(networkClientId);
        activeChainIds.add(chainId);
      });

      // Update each chain individually
      const chainIdsArray = Array.from(activeChainIds);
      let allSuccessful = true;

      for (const chainId of chainIdsArray) {
        const success = await this.#updateAccountsViaApiMultichain(
          addresses,
          chainId,
        );
        if (!success) {
          allSuccessful = false;
        }
      }

      return allSuccessful;
    } catch (error) {
      log.warn(
        'Failed to update accounts for all chains via multiaccount API:',
        error,
      );
      return false;
    }
  }

  _registerMessageHandlers() {
    this.messagingSystem.registerActionHandler(
      `${controllerName}:updateNativeBalances` as const,
      this.updateNativeBalances.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:updateStakedBalances` as const,
      this.updateStakedBalances.bind(this),
    );
  }
}
