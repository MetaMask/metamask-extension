import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { ComposedStore, ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from 'swappable-obj-proxy';
import EthQuery from 'eth-query';
// ControllerMessenger is referred to in the JSDocs
// eslint-disable-next-line no-unused-vars
import { ControllerMessenger } from '@metamask/base-controller';
import { v4 as random } from 'uuid';
import {
  INFURA_PROVIDER_TYPES,
  BUILT_IN_NETWORKS,
  INFURA_BLOCKED_KEY,
  TEST_NETWORK_TICKER_MAP,
  CHAIN_IDS,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../shared/modules/network.utils';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { createNetworkClient } from './create-network-client';

/**
 * @typedef {object} NetworkConfiguration
 * @property {string} rpcUrl - RPC target URL.
 * @property {string} chainId - Network ID as per EIP-155
 * @property {string} ticker - Currency ticker.
 * @property {object} [rpcPrefs] - Personalized preferences.
 * @property {string} [nickname] - Personalized network name.
 */

const env = process.env.METAMASK_ENV;
const fetchWithTimeout = getFetchWithTimeout();

const name = 'NetworkController';

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

/**
 * The set of event types that this controller can publish via its messenger.
 */
export const NetworkControllerEventTypes = {
  /**
   * Fired after the current network is changed.
   */
  NetworkDidChange: `${name}:networkDidChange`,
  /**
   * Fired when there is a request to change the current network, but no state
   * changes have occurred yet.
   */
  NetworkWillChange: `${name}:networkWillChange`,
  /**
   * Fired after the network is changed to an Infura network, but when Infura
   * returns an error denying support for the user's location.
   */
  InfuraIsBlocked: `${name}:infuraIsBlocked`,
  /**
   * Fired after the network is changed to an Infura network and Infura does not
   * return an error denying support for the user's location, or after the
   * network is changed to a custom network.
   */
  InfuraIsUnblocked: `${name}:infuraIsUnblocked`,
};

export default class NetworkController extends EventEmitter {
  static defaultProviderConfig = defaultProviderConfig;

  /**
   * Construct a NetworkController.
   *
   * @param {object} options - Options for this controller.
   * @param {ControllerMessenger} options.messenger - The controller messenger.
   * @param {object} [options.state] - Initial controller state.
   * @param {string} [options.infuraProjectId] - The Infura project ID.
   * @param {string} [options.trackMetaMetricsEvent] - A method to forward events to the MetaMetricsController
   */
  constructor({
    messenger,
    state = {},
    infuraProjectId,
    trackMetaMetricsEvent,
  } = {}) {
    super();

    this.messenger = messenger;

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

    this.networkConfigurationsStore = new ObservableStore(
      state.networkConfigurations || {},
    );

    this.store = new ComposedStore({
      provider: this.providerStore,
      previousProviderStore: this.previousProviderStore,
      network: this.networkStore,
      networkDetails: this.networkDetails,
      networkConfigurations: this.networkConfigurationsStore,
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

    this._trackMetaMetricsEvent = trackMetaMetricsEvent;
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
    const { type, rpcUrl, chainId } = this.providerStore.getState();
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
    // NOTE: This isn't necessary anymore because the block cache middleware
    // already prevents duplicate requests from taking place
    if (EIPS[1559] !== undefined) {
      return EIPS[1559];
    }
    const latestBlock = await this._getLatestBlock();
    const supportsEIP1559 =
      latestBlock && latestBlock.baseFeePerGas !== undefined;
    this._setNetworkEIPSupport(1559, supportsEIP1559);
    return supportsEIP1559;
  }

  async lookupNetwork() {
    // Prevent firing when provider is not defined.
    if (!this._provider) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      );
      return;
    }

    const { chainId } = this.providerStore.getState();
    if (!chainId) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing chainId',
      );
      this._setNetworkState('loading');
      this._clearNetworkDetails();
      return;
    }

    // Ping the RPC endpoint so we can confirm that it works
    const initialNetwork = this.networkStore.getState();
    const { type } = this.providerStore.getState();
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);

    if (isInfura) {
      this._checkInfuraAvailability(type);
    } else {
      this.messenger.publish(NetworkControllerEventTypes.InfuraIsUnblocked);
    }

    let networkVersion;
    let networkVersionError;
    try {
      networkVersion = await this._getNetworkId();
    } catch (error) {
      networkVersionError = error;
    }
    if (initialNetwork !== this.networkStore.getState()) {
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

  /**
   * A method for setting the currently selected network provider by networkConfigurationId.
   *
   * @param {string} networkConfigurationId - the universal unique identifier that corresponds to the network configuration to set as active.
   * @returns {string} The rpcUrl of the network that was just set as active
   */
  setActiveNetwork(networkConfigurationId) {
    const targetNetwork =
      this.networkConfigurationsStore.getState()[networkConfigurationId];

    if (!targetNetwork) {
      throw new Error(
        `networkConfigurationId ${networkConfigurationId} does not match a configured networkConfiguration`,
      );
    }

    this._setProviderConfig({
      type: NETWORK_TYPES.RPC,
      ...targetNetwork,
    });

    return targetNetwork.rpcUrl;
  }

  setProviderType(type) {
    assert.notStrictEqual(
      type,
      NETWORK_TYPES.RPC,
      `NetworkController - cannot call "setProviderType" with type "${NETWORK_TYPES.RPC}". Use "setActiveNetwork"`,
    );
    assert.ok(
      INFURA_PROVIDER_TYPES.includes(type),
      `Unknown Infura provider type "${type}".`,
    );
    const { chainId, ticker, blockExplorerUrl } = BUILT_IN_NETWORKS[type];
    this._setProviderConfig({
      type,
      rpcUrl: '',
      chainId,
      ticker: ticker ?? 'ETH',
      nickname: '',
      rpcPrefs: { blockExplorerUrl },
    });
  }

  resetConnection() {
    this._setProviderConfig(this.providerStore.getState());
  }

  rollbackToPreviousProvider() {
    const config = this.previousProviderStore.getState();
    this.providerStore.putState(config);
    this._switchNetwork(config);
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
    this.networkDetails.putState({
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
    this.previousProviderStore.putState(this.providerStore.getState());
    this.providerStore.putState(config);
    this._switchNetwork(config);
  }

  async _checkInfuraAvailability(network) {
    const rpcUrl = `https://${network}.infura.io/v3/${this._infuraProjectId}`;

    let networkChanged = false;
    const listener = () => {
      networkChanged = true;
      this.messenger.unsubscribe(
        NetworkControllerEventTypes.NetworkDidChange,
        listener,
      );
    };
    this.messenger.subscribe(
      NetworkControllerEventTypes.NetworkDidChange,
      listener,
    );

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
        this.messenger.publish(NetworkControllerEventTypes.InfuraIsUnblocked);
      } else {
        const responseMessage = await response.json();
        if (networkChanged) {
          return;
        }
        if (responseMessage.error === INFURA_BLOCKED_KEY) {
          this.messenger.publish(NetworkControllerEventTypes.InfuraIsBlocked);
        }
      }
    } catch (err) {
      log.warn(`MetaMask - Infura availability check failed`, err);
    }
  }

  _switchNetwork(opts) {
    // Indicate to subscribers that network is about to change
    this.messenger.publish(NetworkControllerEventTypes.NetworkWillChange);
    // Set loading state
    this._setNetworkState('loading');
    // Reset network details
    this._clearNetworkDetails();
    // Configure the provider appropriately
    this._configureProvider(opts);
    // Notify subscribers that network has changed
    this.messenger.publish(
      NetworkControllerEventTypes.NetworkDidChange,
      opts.type,
    );
    this.lookupNetwork();
  }

  _configureProvider({ type, rpcUrl, chainId }) {
    // infura type-based endpoints
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);
    if (isInfura) {
      this._configureInfuraProvider({
        type,
        infuraProjectId: this._infuraProjectId,
      });
      // url-based rpc endpoints
    } else if (type === NETWORK_TYPES.RPC) {
      this._configureStandardProvider(rpcUrl, chainId);
    } else {
      throw new Error(
        `NetworkController - _configureProvider - unknown type "${type}"`,
      );
    }
  }

  _configureInfuraProvider({ type, infuraProjectId }) {
    log.info('NetworkController - configureInfuraProvider', type);
    const { provider, blockTracker } = createNetworkClient({
      network: type,
      infuraProjectId,
      type: 'infura',
    });
    this._setProviderAndBlockTracker({ provider, blockTracker });
  }

  _configureStandardProvider(rpcUrl, chainId) {
    log.info('NetworkController - configureStandardProvider', rpcUrl);
    const { provider, blockTracker } = createNetworkClient({
      chainId,
      rpcUrl,
      type: 'custom',
    });
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

  /**
   * Network Configuration management functions
   */

  /**
   * Adds a network configuration if the rpcUrl is not already present on an
   * existing network configuration. Otherwise updates the entry with the matching rpcUrl.
   *
   * @param {NetworkConfiguration} networkConfiguration - The network configuration to add or, if rpcUrl matches an existing entry, to modify.
   * @param {object} options
   * @param {boolean} options.setActive - An option to set the newly added networkConfiguration as the active provider.
   * @param {string} options.referrer - The site from which the call originated, or 'metamask' for internal calls - used for event metrics.
   * @param {string} options.source - Where the upsertNetwork event originated (i.e. from a dapp or from the network form)- used for event metrics.
   * @returns {string} id for the added or updated network configuration
   */
  upsertNetworkConfiguration(
    { rpcUrl, chainId, ticker, nickname, rpcPrefs },
    { setActive = false, referrer, source },
  ) {
    assert.ok(
      isPrefixedFormattedHexString(chainId),
      `Invalid chain ID "${chainId}": invalid hex string.`,
    );
    assert.ok(
      isSafeChainId(parseInt(chainId, 16)),
      `Invalid chain ID "${chainId}": numerical value greater than max safe value.`,
    );

    if (!rpcUrl) {
      throw new Error(
        'An rpcUrl is required to add or update network configuration',
      );
    }

    if (!referrer || !source) {
      throw new Error(
        'referrer and source are required arguments for adding or updating a network configuration',
      );
    }

    try {
      // eslint-disable-next-line no-new
      new URL(rpcUrl);
    } catch (e) {
      if (e.message.includes('Invalid URL')) {
        throw new Error('rpcUrl must be a valid URL');
      }
    }

    if (!ticker) {
      throw new Error(
        'A ticker is required to add or update networkConfiguration',
      );
    }

    const networkConfigurations = this.networkConfigurationsStore.getState();
    const newNetworkConfiguration = {
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    };

    const oldNetworkConfigurationId = Object.values(networkConfigurations).find(
      (networkConfiguration) =>
        networkConfiguration.rpcUrl?.toLowerCase() === rpcUrl?.toLowerCase(),
    )?.id;

    const newNetworkConfigurationId = oldNetworkConfigurationId || random();
    this.networkConfigurationsStore.putState({
      ...networkConfigurations,
      [newNetworkConfigurationId]: {
        ...newNetworkConfiguration,
        id: newNetworkConfigurationId,
      },
    });

    if (!oldNetworkConfigurationId) {
      this._trackMetaMetricsEvent({
        event: 'Custom Network Added',
        category: MetaMetricsEventCategory.Network,
        referrer: {
          url: referrer,
        },
        properties: {
          chain_id: chainId,
          symbol: ticker,
          source,
        },
      });
    }

    if (setActive) {
      this.setActiveNetwork(newNetworkConfigurationId);
    }

    return newNetworkConfigurationId;
  }

  /**
   * Removes network configuration from state.
   *
   * @param {string} networkConfigurationId - the unique id for the network configuration to remove.
   */
  removeNetworkConfiguration(networkConfigurationId) {
    const networkConfigurations = {
      ...this.networkConfigurationsStore.getState(),
    };
    delete networkConfigurations[networkConfigurationId];
    this.networkConfigurationsStore.putState(networkConfigurations);
  }
}
