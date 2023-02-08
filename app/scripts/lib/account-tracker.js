/* Account Tracker
 *
 * This module is responsible for tracking any number of accounts
 * and caching their current balances & transaction counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status
 * on each new block.
 */

import EthQuery from 'eth-query';

import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import pify from 'pify';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import SINGLE_CALL_BALANCES_ABI from 'single-call-balance-checker-abi';
import {
  CHAIN_IDS,
  LOCALHOST_RPC_URL,
} from '../../../shared/constants/network';

import {
  SINGLE_CALL_BALANCES_ADDRESS,
  SINGLE_CALL_BALANCES_ADDRESS_GOERLI,
  SINGLE_CALL_BALANCES_ADDRESS_SEPOLIA,
  SINGLE_CALL_BALANCES_ADDRESS_BSC,
  SINGLE_CALL_BALANCES_ADDRESS_OPTIMISM,
  SINGLE_CALL_BALANCES_ADDRESS_POLYGON,
  SINGLE_CALL_BALANCES_ADDRESS_AVALANCHE,
  SINGLE_CALL_BALANCES_ADDRESS_FANTOM,
  SINGLE_CALL_BALANCES_ADDRESS_ARBITRUM,
} from '../constants/contracts';
import { previousValueComparator } from './util';

/**
 * This module is responsible for tracking any number of accounts and caching their current balances & transaction
 * counts.
 *
 * It also tracks transaction hashes, and checks their inclusion status on each new block.
 *
 * @typedef {object} AccountTracker
 * @property {object} store The stored object containing all accounts to track, as well as the current block's gas limit.
 * @property {object} store.accounts The accounts currently stored in this AccountTracker
 * @property {string} store.currentBlockGasLimit A hex string indicating the gas limit of the current block
 * @property {object} _provider A provider needed to create the EthQuery instance used within this AccountTracker.
 * @property {EthQuery} _query An EthQuery instance used to access account information from the blockchain
 * @property {BlockTracker} _blockTracker A BlockTracker instance. Needed to ensure that accounts and their info updates
 * when a new block is created.
 * @property {object} _currentBlockNumber Reference to a property on the _blockTracker: the number (i.e. an id) of the the current block
 */
export default class AccountTracker {
  /**
   * @param {object} opts - Options for initializing the controller
   * @param {object} opts.provider - An EIP-1193 provider instance that uses the current global network
   * @param {object} opts.blockTracker - A block tracker, which emits events for each new block
   * @param {Function} opts.getCurrentChainId - A function that returns the `chainId` for the current global network
   * @param {Function} opts.getNetworkIdentifier - A function that returns the current network
   */
  constructor(opts = {}) {
    const initState = {
      accounts: {},
      currentBlockGasLimit: '',
    };
    this.store = new ObservableStore(initState);

    this.resetState = () => {
      this.store.updateState(initState);
    };

    this._provider = opts.provider;
    this._query = pify(new EthQuery(this._provider));
    this._blockTracker = opts.blockTracker;
    // blockTracker.currentBlock may be null
    this._currentBlockNumber = this._blockTracker.getCurrentBlock();
    this._blockTracker.once('latest', (blockNumber) => {
      this._currentBlockNumber = blockNumber;
    });
    // bind function for easier listener syntax
    this._updateForBlock = this._updateForBlock.bind(this);
    this.getCurrentChainId = opts.getCurrentChainId;
    this.getNetworkIdentifier = opts.getNetworkIdentifier;
    this.preferencesController = opts.preferencesController;
    this.onboardingController = opts.onboardingController;

    this.onboardingController.store.subscribe(
      previousValueComparator(async (prevState, currState) => {
        const { completedOnboarding: prevCompletedOnboarding } = prevState;
        const { completedOnboarding: currCompletedOnboarding } = currState;
        if (!prevCompletedOnboarding && currCompletedOnboarding) {
          this._updateAccounts();
        }
      }, this.onboardingController.store.getState()),
    );

    this.preferencesController.store.subscribe(
      previousValueComparator(async (prevState, currState) => {
        const { selectedAddress: prevSelectedAddress } = prevState;
        const {
          selectedAddress: currSelectedAddress,
          useMultiAccountBalanceChecker,
        } = currState;
        if (
          prevSelectedAddress !== currSelectedAddress &&
          !useMultiAccountBalanceChecker
        ) {
          this._updateAccounts();
        }
      }, this.onboardingController.store.getState()),
    );
    this.ethersProvider = new Web3Provider(this._provider);
  }

  start() {
    // remove first to avoid double add
    this._blockTracker.removeListener('latest', this._updateForBlock);
    // add listener
    this._blockTracker.addListener('latest', this._updateForBlock);
    // fetch account balances
    this._updateAccounts();
  }

  stop() {
    // remove listener
    this._blockTracker.removeListener('latest', this._updateForBlock);
  }

  /**
   * Ensures that the locally stored accounts are in sync with a set of accounts stored externally to this
   * AccountTracker.
   *
   * Once this AccountTracker's accounts are up to date with those referenced by the passed addresses, each
   * of these accounts are given an updated balance via EthQuery.
   *
   * @param {Array} addresses - The array of hex addresses for accounts with which this AccountTracker's accounts should be
   * in sync
   */
  syncWithAddresses(addresses) {
    const { accounts } = this.store.getState();
    const locals = Object.keys(accounts);

    const accountsToAdd = [];
    addresses.forEach((upstream) => {
      if (!locals.includes(upstream)) {
        accountsToAdd.push(upstream);
      }
    });

    const accountsToRemove = [];
    locals.forEach((local) => {
      if (!addresses.includes(local)) {
        accountsToRemove.push(local);
      }
    });

    this.addAccounts(accountsToAdd);
    this.removeAccount(accountsToRemove);
  }

  /**
   * Adds new addresses to track the balances of
   * given a balance as long this._currentBlockNumber is defined.
   *
   * @param {Array} addresses - An array of hex addresses of new accounts to track
   */
  addAccounts(addresses) {
    const { accounts } = this.store.getState();
    // add initial state for addresses
    addresses.forEach((address) => {
      accounts[address] = {};
    });
    // save accounts state
    this.store.updateState({ accounts });
    // fetch balances for the accounts if there is block number ready
    if (!this._currentBlockNumber) {
      return;
    }
    this._updateAccounts();
  }

  /**
   * Removes accounts from being tracked
   *
   * @param {Array} addresses - An array of hex addresses to stop tracking.
   */
  removeAccount(addresses) {
    const { accounts } = this.store.getState();
    // remove each state object
    addresses.forEach((address) => {
      delete accounts[address];
    });
    // save accounts state
    this.store.updateState({ accounts });
  }

  /**
   * Removes all addresses and associated balances
   */

  clearAccounts() {
    this.store.updateState({ accounts: {} });
  }

  /**
   * Given a block, updates this AccountTracker's currentBlockGasLimit, and then updates each local account's balance
   * via EthQuery
   *
   * @private
   * @param {number} blockNumber - the block number to update to.
   * @fires 'block' The updated state, if all account updates are successful
   */
  async _updateForBlock(blockNumber) {
    this._currentBlockNumber = blockNumber;

    // block gasLimit polling shouldn't be in account-tracker shouldn't be here...
    const currentBlock = await this._query.getBlockByNumber(blockNumber, false);
    if (!currentBlock) {
      return;
    }
    const currentBlockGasLimit = currentBlock.gasLimit;
    this.store.updateState({ currentBlockGasLimit });

    try {
      await this._updateAccounts();
    } catch (err) {
      log.error(err);
    }
  }

  /**
   * balanceChecker is deployed on main eth (test)nets and requires a single call
   * for all other networks, calls this._updateAccount for each account in this.store
   *
   * @returns {Promise} after all account balances updated
   */
  async _updateAccounts() {
    const { completedOnboarding } = this.onboardingController.store.getState();
    if (!completedOnboarding) {
      return;
    }
    const { useMultiAccountBalanceChecker } =
      this.preferencesController.store.getState();

    let addresses = [];
    if (useMultiAccountBalanceChecker) {
      const { accounts } = this.store.getState();

      addresses = Object.keys(accounts);
    } else {
      const selectedAddress = this.preferencesController.getSelectedAddress();

      addresses = [selectedAddress];
    }

    const chainId = this.getCurrentChainId();
    const networkId = this.getNetworkIdentifier();
    const rpcUrl = 'http://127.0.0.1:8545';

    if (networkId === LOCALHOST_RPC_URL || networkId === rpcUrl) {
      await Promise.all(addresses.map(this._updateAccount.bind(this)));
    } else {
      switch (chainId) {
        case CHAIN_IDS.MAINNET:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS,
          );
          break;

        case CHAIN_IDS.GOERLI:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_GOERLI,
          );
          break;

        case CHAIN_IDS.SEPOLIA:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_SEPOLIA,
          );
          break;

        case CHAIN_IDS.BSC:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_BSC,
          );
          break;

        case CHAIN_IDS.OPTIMISM:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_OPTIMISM,
          );
          break;

        case CHAIN_IDS.POLYGON:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_POLYGON,
          );
          break;

        case CHAIN_IDS.AVALANCHE:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_AVALANCHE,
          );
          break;

        case CHAIN_IDS.FANTOM:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_FANTOM,
          );
          break;

        case CHAIN_IDS.ARBITRUM:
          await this._updateAccountsViaBalanceChecker(
            addresses,
            SINGLE_CALL_BALANCES_ADDRESS_ARBITRUM,
          );
          break;

        default:
          await Promise.all(addresses.map(this._updateAccount.bind(this)));
      }
    }
  }

  /**
   * Updates the current balance of an account.
   *
   * @private
   * @param {string} address - A hex address of a the account to be updated
   * @returns {Promise} after the account balance is updated
   */
  async _updateAccount(address) {
    const { useMultiAccountBalanceChecker } =
      this.preferencesController.store.getState();

    let balance = '0x0';

    // query balance
    try {
      balance = await this._query.getBalance(address);
    } catch (error) {
      if (error.data?.request?.method !== 'eth_getBalance') {
        throw error;
      }
    }

    const result = { address, balance };
    // update accounts state
    const { accounts } = this.store.getState();
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

    this.store.updateState({ accounts: newAccounts });
  }

  /**
   * Updates current address balances from balanceChecker deployed contract instance
   *
   * @param {*} addresses
   * @param {*} deployedContractAddress
   */
  async _updateAccountsViaBalanceChecker(addresses, deployedContractAddress) {
    const { accounts } = this.store.getState();
    const newAccounts = {};
    Object.keys(accounts).forEach((address) => {
      if (!addresses.includes(address)) {
        newAccounts[address] = { address, balance: null };
      }
    });
    this.ethersProvider = new Web3Provider(this._provider);

    const ethContract = await new Contract(
      deployedContractAddress,
      SINGLE_CALL_BALANCES_ABI,
      this.ethersProvider,
    );
    const ethBalance = ['0x0000000000000000000000000000000000000000'];

    try {
      const balances = await ethContract.balances(addresses, ethBalance);

      addresses.forEach((address, index) => {
        const balance = balances[index] ? balances[index].toHexString() : '0x0';
        newAccounts[address] = { address, balance };
      });
      this.store.updateState({ accounts: newAccounts });
    } catch (error) {
      log.warn(
        `MetaMask - Account Tracker single call balance fetch failed`,
        error,
      );
      Promise.all(addresses.map(this._updateAccount.bind(this)));
    }
  }
}
