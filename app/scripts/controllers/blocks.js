import { ethers } from 'ethers';
import { sortBy, uniqBy } from 'lodash';
import { BigNumber } from 'bignumber.js';
import { ObservableStore } from '@metamask/obs-store';
import {
  MAINNET_CHAIN_ID,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';

/**
 * @param {Object} opts - Options for initializing the controller
 * @param {Object} opts.provider - An EIP-1193 provider instance that uses the current global network
 * @param {Object} opts.blockTracker - A block tracker, which emits events for each new block
 * @param {Function} opts.getCurrentChainId - A function that returns the `chainId` for the current global network
 * @property {Object} initState The initial controller state
 */

/**
 * Background controller responsible for pulling
 * new blocks from the network
 */
export default class BlockController {
  /**
   * Creates a new controller instance
   *
   * @param {BlockController} [opts] - Controller configuration parameters
   */
  constructor(opts = {}) {
    const {
      blockTracker,
      provider,
      getCurrentChainId,
      onNetworkDidChange,
    } = opts;

    // Injecting a function to read the current chainId
    this.getCurrentChainId = getCurrentChainId;

    // Setting up the state
    const initState = {
      blocks: [],
      displayNumbersAsHex: true,
      sortProperty: 'number',
      currentChainId: this.getCurrentChainId(),
    };
    this.store = new ObservableStore(initState);

    // Adding a network blocks listener
    blockTracker.addListener('latest', async (blockNumber) => {
      const { blocks, sortProperty } = this.store.getState();

      // Pulling a new block
      const { result } = await provider.sendAsync({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, true],
        id: 1,
      });
      const currentChainId = this.getCurrentChainId();

      // Generating block data
      blocks.push({
        ...result,
        chainId: currentChainId,
        txCount: result.transactions.length,
        maxTxValue: this._getMaxTxValueInEther(result.transactions),
        etherscanLink: this._getEtherscanLink(result.number, currentChainId),
      });

      // Organizing blocks in needed order
      const sortedBlocks = sortBy(blocks, sortProperty);

      // Updating the state
      this.store.updateState({
        currentChainId,
        blocks: uniqBy(sortedBlocks, 'hash'),
      });
    });

    // Handling the network change with a corresponding state update
    onNetworkDidChange(() => {
      this.store.updateState({
        currentChainId: this.getCurrentChainId(),
      });
    });
  }

  /**
   * Removes all block from the list and updates the state.
   * @returns {void}
   */
  resetBlockList = () => {
    this.store.updateState({
      blocks: [],
    });
  };

  /**
   * Toggles the hex/decimal number display mode and updates the state.
   * @returns {void}
   */
  convertNumbers = () => {
    const { displayNumbersAsHex } = this.store.getState();

    this.store.updateState({
      displayNumbersAsHex: !displayNumbersAsHex,
    });
  };

  /**
   * Removes block from the list by specified hash and updates the state.
   * @param {string} hash - Hash of the block to remove.
   * @returns {void}
   */
  removeBlockFromList = (hash) => {
    const { blocks } = this.store.getState();
    const filteredBlocks = blocks.filter((block) => block.hash !== hash);

    this.store.updateState({
      blocks: filteredBlocks,
    });
  };

  /**
   * Sorts blocks in descending order by specified property and updates the state.
   * @param {string} sortProperty - Property to sort by
   * @returns {void}
   */
  sortBlocks = (sortProperty) => {
    const { blocks } = this.store.getState();

    const sortedBlocks = sortBy(blocks, sortProperty);

    this.store.updateState({
      sortProperty,
      blocks: sortedBlocks,
    });
  };

  /**
   * Returns the max transaction value from the block.
   * @private
   * @param {Array} transactions - List of block transactions
   * @returns {number} - Max transaction value in Ether
   */
  _getMaxTxValueInEther = (transactions) => {
    return Math.max.apply(
      Math,
      transactions.map(function (t) {
        return ethers.utils.formatEther(t.value) || 0;
      }),
    );
  };

  /**
   * Generates an Etherscan link to provided block in a corresponding network.
   * @private
   * @param {Object} blockNumber - Block number in hex
   * @param {string} chainId - Chain ID of network to inspect in hex
   * @returns {string} - Link to block at Etherscan
   */
  _getEtherscanLink = (blockNumber, chainId) => {
    const blockToInspect = new BigNumber(blockNumber).toNumber();
    const network =
      chainId === MAINNET_CHAIN_ID ? '' : NETWORK_TO_NAME_MAP[chainId] + '.';

    return `https://${network}etherscan.io/block/${blockToInspect}`;
  };
}
