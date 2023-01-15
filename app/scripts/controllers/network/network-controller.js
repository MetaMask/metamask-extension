import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { ComposedStore, ObservableStore } from '@metamask/obs-store';
import { JsonRpcEngine } from 'json-rpc-engine';
import {
  providerFromEngine,
  providerFromMiddleware,
} from 'eth-json-rpc-middleware';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from 'swappable-obj-proxy';
import EthQuery from 'eth-query';
import createFilterMiddleware from 'eth-json-rpc-filters';
import createSubscriptionManager from 'eth-json-rpc-filters/subscriptionManager';
import {
  INFURA_PROVIDER_TYPES,
  BUILT_IN_NETWORKS,
  INFURA_BLOCKED_KEY,
  TEST_NETWORK_TICKER_MAP,
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../shared/modules/network.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import createInfuraClient from './createInfuraClient';
import createJsonRpcClient from './createJsonRpcClient';

const env = process.env.METAMASK_ENV;
const fetchWithTimeout = getFetchWithTimeout();

let defaultProviderConfigOpts;
if (process.env.IN_TEST) {
  defaultProviderConfigOpts = {
    type: NETWORK_TYPES.RPC,
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    nickname: 'Localhost 8545',
  };
} else if (process.env.METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigOpts = {
    type: NETWORK_TYPES.GOERLI,
    chainId: CHAIN_IDS.GOERLI,
    ticker: TEST_NETWORK_TICKER_MAP.GOERLI,
  };
} else {
  defaultProviderConfigOpts = {
    type: NETWORK_TYPES.MAINNET,
    chainId: CHAIN_IDS.MAINNET,
  };
}

const defaultProviderConfig = {
  ticker: 'ETH',
  ...defaultProviderConfigOpts,
};

const defaultNetworkDetailsState = {
  EIPS: { 1559: undefined },
};

export const NETWORK_EVENTS = {
  // Fired after the actively selected network is changed
  NETWORK_DID_CHANGE: 'networkDidChange',
  // Fired when the actively selected network *will* change
  NETWORK_WILL_CHANGE: 'networkWillChange',
  // Fired when Infura returns an error indicating no support
  INFURA_IS_BLOCKED: 'infuraIsBlocked',
  // Fired when not using an Infura network or when Infura returns no error, indicating support
  INFURA_IS_UNBLOCKED: 'infuraIsUnblocked',
};

export default class NetworkController extends EventEmitter {
  /**
   * Construct a NetworkController.
   *
   * @param {object} [options] - NetworkController options.
   * @param {object} [options.state] - Initial controller state.
   * @param {string} [options.infuraProjectId] - The Infura project ID.
   */
  constructor({ state = {}, infuraProjectId } = {}) {
    super();

    // create stores
    this.providerStore = new ObservableStore(
      state.provider || { ...defaultProviderConfig },
    );
    this.previousProviderStore = new ObservableStore(
      this.providerStore.getState(),
    );
    this.networkStore = new ObservableStore('loading');
    // We need to keep track of a few details about the current network
    // Ideally we'd merge this.networkStore with this new store, but doing so
    // will require a decent sized refactor of how we're accessing network
    // state. Currently this is only used for detecting EIP 1559 support but
    // can be extended to track other network details.
    this.networkDetails = new ObservableStore(
      state.networkDetails || {
        ...defaultNetworkDetailsState,
      },
    );
    this.store = new ComposedStore({
      provider: this.providerStore,
      previousProviderStore: this.previousProviderStore,
      network: this.networkStore,
      networkDetails: this.networkDetails,
    });

    // provider and block tracker
    this._provider = null;
    this._blockTracker = null;

    // provider and block tracker proxies - because the network changes
    this._providerProxy = null;
    this._blockTrackerProxy = null;

    if (!infuraProjectId || typeof infuraProjectId !== 'string') {
      throw new Error('Invalid Infura project ID');
    }
    this._infuraProjectId = infuraProjectId;

    this.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, this.lookupNetwork);
  }

  /**
   * Destroy the network controller, stopping any ongoing polling.
   *
   * In-progress requests will not be aborted.
   */
  async destroy() {
    await this._blockTracker?.destroy();
  }

  async initializeProvider() {
    const { type, rpcUrl, chainId } = this.getProviderConfig();
    this._configureProvider({ type, rpcUrl, chainId });
    await this.lookupNetwork();
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker() {
    const provider = this._providerProxy;
    const blockTracker = this._blockTrackerProxy;
    return { provider, blockTracker };
  }

  /**
   * Method to check if the block header contains fields that indicate EIP 1559
   * support (baseFeePerGas).
   *
   * @returns {Promise<boolean>} true if current network supports EIP 1559
   */
  async getEIP1559Compatibility() {
    const { EIPS } = this.networkDetails.getState();
    if (EIPS[1559] !== undefined) {
      return EIPS[1559];
    }
    const latestBlock = await this._getLatestBlock();
    const supportsEIP1559 =
      latestBlock && latestBlock.baseFeePerGas !== undefined;
    this._setNetworkEIPSupport(1559, supportsEIP1559);
    return supportsEIP1559;
  }

  getNetworkState() {
    return this.networkStore.getState();
  }

  isNetworkLoading() {
    return this.getNetworkState() === 'loading';
  }

  async lookupNetwork() {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      );
      return;
    }

    const chainId = this.getCurrentChainId();
    if (!chainId) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing chainId',
      );
      this._setNetworkState('loading');
      // keep network details in sync with network state
      this._clearNetworkDetails();
      return;
    }

    // Ping the RPC endpoint so we can confirm that it works
    const initialNetwork = this.getNetworkState();
    const { type } = this.getProviderConfig();
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);

    if (isInfura) {
      this._checkInfuraAvailability(type);
    } else {
      this.emit(NETWORK_EVENTS.INFURA_IS_UNBLOCKED);
    }

    let networkVersion;
    let networkVersionError;
    try {
      networkVersion = await this._getNetworkId();
    } catch (error) {
      networkVersionError = error;
    }
    if (initialNetwork !== this.getNetworkState()) {
      return;
    }

    if (networkVersionError) {
      this._setNetworkState('loading');
      // keep network details in sync with network state
      this._clearNetworkDetails();
    } else {
      this._setNetworkState(networkVersion);
      // look up EIP-1559 support
      await this.getEIP1559Compatibility();
    }
  }

  getCurrentChainId() {
    const { type, chainId: configChainId } = this.getProviderConfig();
    return BUILT_IN_NETWORKS[type]?.chainId || configChainId;
  }

  getCurrentRpcUrl() {
    const { rpcUrl } = this.getProviderConfig();
    return rpcUrl;
  }

  setRpcTarget(rpcUrl, chainId, ticker = 'ETH', nickname = '', rpcPrefs) {
    assert.ok(
      isPrefixedFormattedHexString(chainId),
      `Invalid chain ID "${chainId}": invalid hex string.`,
    );
    assert.ok(
      isSafeChainId(parseInt(chainId, 16)),
      `Invalid chain ID "${chainId}": numerical value greater than max safe value.`,
    );
    this._setProviderConfig({
      type: NETWORK_TYPES.RPC,
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    });
  }

  setProviderType(type) {
    assert.notStrictEqual(
      type,
      NETWORK_TYPES.RPC,
      `NetworkController - cannot call "setProviderType" with type "${NETWORK_TYPES.RPC}". Use "setRpcTarget"`,
    );
    assert.ok(
      INFURA_PROVIDER_TYPES.includes(type),
      `Unknown Infura provider type "${type}".`,
    );
    const { chainId, ticker } = BUILT_IN_NETWORKS[type];
    this._setProviderConfig({
      type,
      rpcUrl: '',
      chainId,
      ticker: ticker ?? 'ETH',
      nickname: '',
    });
  }

  resetConnection() {
    this._setProviderConfig(this.getProviderConfig());
  }

  rollbackToPreviousProvider() {
    const config = this.previousProviderStore.getState();
    this.providerStore.updateState(config);
    this._switchNetwork(config);
  }

  getProviderConfig() {
    return this.providerStore.getState();
  }

  getNetworkIdentifier() {
    const provider = this.providerStore.getState();
    return provider.type === NETWORK_TYPES.RPC
      ? provider.rpcUrl
      : provider.type;
  }

  //
  // Private
  //

  /**
   * Get the network ID for the current selected network
   *
   * @returns {string} The network ID for the current network.
   */
  async _getNetworkId() {
    const ethQuery = new EthQuery(this._provider);
    return await new Promise((resolve, reject) => {
      ethQuery.sendAsync({ method: 'net_version' }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Method to return the latest block for the current network
   *
   * @returns {object} Block header
   */
  _getLatestBlock() {
    return new Promise((resolve, reject) => {
      const { provider } = this.getProviderAndBlockTracker();
      const ethQuery = new EthQuery(provider);
      ethQuery.sendAsync(
        { method: 'eth_getBlockByNumber', params: ['latest', false] },
        (err, block) => {
          if (err) {
            return reject(err);
          }
          return resolve(block);
        },
      );
    });
  }

  _setNetworkState(network) {
    this.networkStore.putState(network);
  }

  /**
   * Set EIP support indication in the networkDetails store
   *
   * @param {number} EIPNumber - The number of the EIP to mark support for
   * @param {boolean} isSupported - True if the EIP is supported
   */
  _setNetworkEIPSupport(EIPNumber, isSupported) {
    this.networkDetails.updateState({
      EIPS: {
        [EIPNumber]: isSupported,
      },
    });
  }

  /**
   * Reset EIP support to default (no support)
   */
  _clearNetworkDetails() {
    this.networkDetails.putState({ ...defaultNetworkDetailsState });
  }

  /**
   * Sets the provider config and switches the network.
   *
   * @param config
   */
  _setProviderConfig(config) {
    this.previousProviderStore.updateState(this.getProviderConfig());
    this.providerStore.updateState(config);
    this._switchNetwork(config);
  }

  async _checkInfuraAvailability(network) {
    const rpcUrl = `https://${network}.infura.io/v3/${this._infuraProjectId}`;

    let networkChanged = false;
    this.once(NETWORK_EVENTS.NETWORK_DID_CHANGE, () => {
      networkChanged = true;
    });

    try {
      const response = await fetchWithTimeout(rpcUrl, {
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      if (networkChanged) {
        return;
      }

      if (response.ok) {
        this.emit(NETWORK_EVENTS.INFURA_IS_UNBLOCKED);
      } else {
        const responseMessage = await response.json();
        if (networkChanged) {
          return;
        }
        if (responseMessage.error === INFURA_BLOCKED_KEY) {
          this.emit(NETWORK_EVENTS.INFURA_IS_BLOCKED);
        }
      }
    } catch (err) {
      log.warn(`MetaMask - Infura availability check failed`, err);
    }
  }

  _switchNetwork(opts) {
    // Indicate to subscribers that network is about to change
    this.emit(NETWORK_EVENTS.NETWORK_WILL_CHANGE);
    // Set loading state
    this._setNetworkState('loading');
    // Reset network details
    this._clearNetworkDetails();
    // Configure the provider appropriately
    this._configureProvider(opts);
    // Notify subscribers that network has changed
    this.emit(NETWORK_EVENTS.NETWORK_DID_CHANGE, opts.type);
  }

  _configureProvider({ type, rpcUrl, chainId }) {
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);
    if (isInfura) {
      this._configureInfuraProvider(type, this._infuraProjectId);
      // url-based rpc endpoints
    } else if (type === NETWORK_TYPES.RPC) {
      this._configureStandardProvider(rpcUrl, chainId);
    } else {
      throw new Error(
        `NetworkController - _configureProvider - unknown type "${type}"`,
      );
    }
  }

  _configureInfuraProvider(type, projectId) {
    log.info('NetworkController - configureInfuraProvider', type);
    const networkClient = createInfuraClient({
      network: type,
      projectId,
    });
    this._setNetworkClient(networkClient);
  }

  _configureStandardProvider(rpcUrl, chainId) {
    log.info('NetworkController - configureStandardProvider', rpcUrl);
    const networkClient = createJsonRpcClient({ rpcUrl, chainId });
    this._setNetworkClient(networkClient);
  }

  _setNetworkClient({ networkMiddleware, blockTracker }) {
    const networkProvider = providerFromMiddleware(networkMiddleware);
    const filterMiddleware = createFilterMiddleware({
      provider: networkProvider,
      blockTracker,
    });
    const subscriptionManager = createSubscriptionManager({
      provider: networkProvider,
      blockTracker,
    });

    const engine = new JsonRpcEngine();
    subscriptionManager.events.on('notification', (message) =>
      engine.emit('notification', message),
    );
    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);
    engine.push(networkMiddleware);

    const provider = providerFromEngine(engine);

    this._setProviderAndBlockTracker({ provider, blockTracker });
  }

  _setProviderAndBlockTracker({ provider, blockTracker }) {
    // update or initialize proxies
    if (this._providerProxy) {
      this._providerProxy.setTarget(provider);
    } else {
      this._providerProxy = createSwappableProxy(provider);
    }
    if (this._blockTrackerProxy) {
      this._blockTrackerProxy.setTarget(blockTracker);
    } else {
      this._blockTrackerProxy = createEventEmitterProxy(blockTracker, {
        eventFilter: 'skipInternal',
      });
    }
    // set new provider and blockTracker
    this._provider = provider;
    this._blockTracker = blockTracker;
  }
}
