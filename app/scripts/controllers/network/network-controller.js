import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { ComposedStore, ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from '@metamask/swappable-obj-proxy';
import EthQuery from 'eth-query';
// ControllerMessenger is referred to in the JSDocs
// eslint-disable-next-line no-unused-vars
import { ControllerMessenger } from '@metamask/base-controller';
import { v4 as random } from 'uuid';
import { hasProperty, isPlainObject } from '@metamask/utils';
import { errorCodes } from 'eth-rpc-errors';
import {
  INFURA_PROVIDER_TYPES,
  BUILT_IN_NETWORKS,
  INFURA_BLOCKED_KEY,
  TEST_NETWORK_TICKER_MAP,
  CHAIN_IDS,
  NETWORK_TYPES,
  NetworkStatus,
} from '../../../../shared/constants/network';
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

function buildDefaultProviderConfigState() {
  if (process.env.IN_TEST) {
    return {
      type: NETWORK_TYPES.RPC,
      rpcUrl: 'http://localhost:8545',
      chainId: '0x539',
      nickname: 'Localhost 8545',
      ticker: 'ETH',
    };
  } else if (
    process.env.METAMASK_DEBUG ||
    process.env.METAMASK_ENV === 'test'
  ) {
    return {
      type: NETWORK_TYPES.GOERLI,
      chainId: CHAIN_IDS.GOERLI,
      ticker: TEST_NETWORK_TICKER_MAP.GOERLI,
    };
  }

  return {
    type: NETWORK_TYPES.MAINNET,
    chainId: CHAIN_IDS.MAINNET,
    ticker: 'ETH',
  };
}

function buildDefaultNetworkIdState() {
  return null;
}

function buildDefaultNetworkStatusState() {
  return NetworkStatus.Unknown;
}

function buildDefaultNetworkDetailsState() {
  return {
    EIPS: {
      1559: undefined,
    },
  };
}

function buildDefaultNetworkConfigurationsState() {
  return {};
}

/**
 * The name of the controller.
 */
const name = 'NetworkController';

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
      state.provider || buildDefaultProviderConfigState(),
    );
    this.previousProviderStore = new ObservableStore(
      this.providerStore.getState(),
    );
    this.networkIdStore = new ObservableStore(buildDefaultNetworkIdState());
    this.networkStatusStore = new ObservableStore(
      buildDefaultNetworkStatusState(),
    );
    // We need to keep track of a few details about the current network.
    // Ideally we'd merge this.networkStatusStore with this new store, but doing
    // so will require a decent sized refactor of how we're accessing network
    // state. Currently this is only used for detecting EIP-1559 support but can
    // be extended to track other network details.
    this.networkDetails = new ObservableStore(
      state.networkDetails || buildDefaultNetworkDetailsState(),
    );

    this.networkConfigurationsStore = new ObservableStore(
      state.networkConfigurations || buildDefaultNetworkConfigurationsState(),
    );

    this.store = new ComposedStore({
      provider: this.providerStore,
      previousProviderStore: this.previousProviderStore,
      networkId: this.networkIdStore,
      networkStatus: this.networkStatusStore,
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
   * Determines whether the network supports EIP-1559 by checking whether the
   * latest block has a `baseFeePerGas` property, then updates state
   * appropriately.
   *
   * @returns {Promise<boolean>} A promise that resolves to true if the network
   * supports EIP-1559 and false otherwise.
   */
  async getEIP1559Compatibility() {
    const { EIPS } = this.networkDetails.getState();
    // NOTE: This isn't necessary anymore because the block cache middleware
    // already prevents duplicate requests from taking place
    if (EIPS[1559] !== undefined) {
      return EIPS[1559];
    }
    const supportsEIP1559 = await this._determineEIP1559Compatibility();
    this.networkDetails.updateState({
      EIPS: {
        ...this.networkDetails.getState().EIPS,
        1559: supportsEIP1559,
      },
    });
    return supportsEIP1559;
  }

  /**
   * Captures information about the currently selected network — namely,
   * the network ID and whether the network supports EIP-1559 — and then uses
   * the results of these requests to determine the status of the network.
   */
  async lookupNetwork() {
    const { chainId, type } = this.providerStore.getState();
    let networkChanged = false;
    let networkId;
    let supportsEIP1559;
    let networkStatus;

    if (!this._provider) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      );
      return;
    }

    if (!chainId) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing chainId',
      );
      this._resetNetworkId();
      this._resetNetworkStatus();
      this._resetNetworkDetails();
      return;
    }

    const isInfura = INFURA_PROVIDER_TYPES.includes(type);

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
      const results = await Promise.all([
        this._getNetworkId(),
        this._determineEIP1559Compatibility(),
      ]);
      networkId = results[0];
      supportsEIP1559 = results[1];
      networkStatus = NetworkStatus.Available;
    } catch (error) {
      if (hasProperty(error, 'code')) {
        let responseBody;
        try {
          responseBody = JSON.parse(error.message);
        } catch {
          // error.message must not be JSON
        }

        if (
          isPlainObject(responseBody) &&
          responseBody.error === INFURA_BLOCKED_KEY
        ) {
          networkStatus = NetworkStatus.Blocked;
        } else if (error.code === errorCodes.rpc.internal) {
          networkStatus = NetworkStatus.Unknown;
        } else {
          networkStatus = NetworkStatus.Unavailable;
        }
      } else {
        log.warn(
          'NetworkController - could not determine network status',
          error,
        );
        networkStatus = NetworkStatus.Unknown;
      }
    }

    if (networkChanged) {
      // If the network has changed, then `lookupNetwork` either has been or is
      // in the process of being called, so we don't need to go further.
      return;
    }
    this.messenger.unsubscribe(
      NetworkControllerEventTypes.NetworkDidChange,
      listener,
    );

    this.networkStatusStore.putState(networkStatus);

    if (networkStatus === NetworkStatus.Available) {
      this.networkIdStore.putState(networkId);
      this.networkDetails.updateState({
        EIPS: {
          ...this.networkDetails.getState().EIPS,
          1559: supportsEIP1559,
        },
      });
    } else {
      this._resetNetworkId();
      this._resetNetworkDetails();
    }

    if (isInfura) {
      if (networkStatus === NetworkStatus.Available) {
        this.messenger.publish(NetworkControllerEventTypes.InfuraIsUnblocked);
      } else if (networkStatus === NetworkStatus.Blocked) {
        this.messenger.publish(NetworkControllerEventTypes.InfuraIsBlocked);
      }
    } else {
      // Always publish infuraIsUnblocked regardless of network status to
      // prevent consumers from being stuck in a blocked state if they were
      // previously connected to an Infura network that was blocked
      this.messenger.publish(NetworkControllerEventTypes.InfuraIsUnblocked);
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
   * Method to return the latest block for the current network
   *
   * @returns {object} Block header
   */
  _getLatestBlock() {
    const { provider } = this.getProviderAndBlockTracker();
    const ethQuery = new EthQuery(provider);

    return new Promise((resolve, reject) => {
      ethQuery.sendAsync(
        { method: 'eth_getBlockByNumber', params: ['latest', false] },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
    });
  }

  /**
   * Get the network ID for the current selected network
   *
   * @returns {string} The network ID for the current network.
   */
  async _getNetworkId() {
    const { provider } = this.getProviderAndBlockTracker();
    const ethQuery = new EthQuery(provider);

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
   * Clears the stored network ID.
   */
  _resetNetworkId() {
    this.networkIdStore.putState(buildDefaultNetworkIdState());
  }

  /**
   * Resets network status to the default ("unknown").
   */
  _resetNetworkStatus() {
    this.networkStatusStore.putState(buildDefaultNetworkStatusState());
  }

  /**
   * Clears details previously stored for the network.
   */
  _resetNetworkDetails() {
    this.networkDetails.putState(buildDefaultNetworkDetailsState());
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

  /**
   * Retrieves the latest block from the currently selected network; if the
   * block has a `baseFeePerGas` property, then we know that the network
   * supports EIP-1559; otherwise it doesn't.
   *
   * @returns {Promise<boolean>} A promise that resolves to true if the network
   * supports EIP-1559 and false otherwise.
   */
  async _determineEIP1559Compatibility() {
    const latestBlock = await this._getLatestBlock();
    return latestBlock && latestBlock.baseFeePerGas !== undefined;
  }

  _switchNetwork(opts) {
    this.messenger.publish(NetworkControllerEventTypes.NetworkWillChange);
    this._resetNetworkId();
    this._resetNetworkStatus();
    this._resetNetworkDetails();
    this._configureProvider(opts);
    this.messenger.publish(NetworkControllerEventTypes.NetworkDidChange);
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
