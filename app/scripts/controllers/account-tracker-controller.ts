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
import { hasProperty, type Hex, type JsonRpcParams } from '@metamask/utils';
import {
  BaseController,
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import { KeyringControllerAccountRemovedEvent } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';

import { LOCALHOST_RPC_URL } from '../../../shared/constants/network';
import { SINGLE_CALL_BALANCES_ADDRESSES } from '../constants/contracts';
import { previousValueComparator } from '../lib/util';
import type {
  OnboardingControllerGetStateAction,
  OnboardingControllerStateChangeEvent,
} from './onboarding';
import { PreferencesControllerGetStateAction } from './preferences-controller';

// Unique name for the controller
const controllerName = 'AccountTrackerController';

type Account = {
  address: string;
  balance: string | null;
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
    persist: true,
    anonymous: false,
  },
  currentBlockGasLimit: {
    persist: true,
    anonymous: true,
  },
  accountsByChainId: {
    persist: true,
    anonymous: false,
  },
  currentBlockGasLimitByChainId: {
    persist: true,
    anonymous: true,
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
 * Actions exposed by the {@link AccountTrackerController}.
 */
export type AccountTrackerControllerActions =
  AccountTrackerControllerGetStateAction;

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
  | PreferencesControllerGetStateAction;

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
export type AccountTrackerControllerMessenger = RestrictedControllerMessenger<
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
    this.#blockTracker.removeListener('latest', this.#updateForBlock);
    // add listener
    this.#blockTracker.addListener('latest', this.#updateForBlock);
    // fetch account balances
    this.updateAccounts();
  }

  /**
   * Stops polling with global selected network
   */
  stop(): void {
    // remove listener
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
   *
   */
  async updateAccountsAllActiveNetworks(): Promise<void> {
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
}
