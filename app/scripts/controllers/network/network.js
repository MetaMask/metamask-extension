import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { ComposedStore, ObservableStore } from '@metamask/obs-store';
import { JsonRpcEngine } from 'json-rpc-engine';
import providerFromEngine from 'eth-json-rpc-middleware/providerFromEngine';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
} from 'swappable-obj-proxy';
import EthQuery from 'eth-query';
import {
  RINKEBY,
  MAINNET,
  INFURA_PROVIDER_TYPES,
  NETWORK_TYPE_RPC,
  NETWORK_TYPE_TO_ID_MAP,
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  INFURA_BLOCKED_KEY,
} from '../../../../shared/constants/network';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../shared/modules/network.utils';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import createMetamaskMiddleware from './createMetamaskMiddleware';
import createInfuraClient from './createInfuraClient';
import createJsonRpcClient from './createJsonRpcClient';
import Network from './network2';

const env = process.env.METAMASK_ENV;
const fetchWithTimeout = getFetchWithTimeout(30000);

let defaultProviderConfigOpts;
if (process.env.IN_TEST === 'true') {
  defaultProviderConfigOpts = {
    type: NETWORK_TYPE_RPC,
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    nickname: 'Localhost 8545',
  };
} else if (process.env.METAMASK_DEBUG || env === 'test') {
  defaultProviderConfigOpts = { type: RINKEBY, chainId: RINKEBY_CHAIN_ID };
} else {
  defaultProviderConfigOpts = { type: MAINNET, chainId: MAINNET_CHAIN_ID };
}

const defaultProviderConfig = {
  ticker: 'ETH',
  ...defaultProviderConfigOpts,
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
  constructor(opts = {}) {
    super();

    // create stores
    this.providerStore = new ObservableStore(
      opts.provider || { ...defaultProviderConfig },
    );
    this.previousProviderStore = new ObservableStore(
      this.providerStore.getState(),
    );
    this.networkStore = new ObservableStore('loading');
    this.store = new ComposedStore({
      provider: this.providerStore,
      previousProviderStore: this.previousProviderStore,
      network: this.networkStore,
    });

    // provider and block tracker
    this._provider = null;
    this._blockTracker = null;

    // provider and block tracker proxies - because the network changes
    this._providerProxy = null;
    this._blockTrackerProxy = null;

    this.on(NETWORK_EVENTS.NETWORK_DID_CHANGE, this.lookupNetwork);

    /*
     * type NetworkOps = { "type": string, "rpcUrl": string, "chainId": string };
     * type networkKey = `JSON.parse([type, rpcUrl, chainId])`
     * type Network = { "provider": Provider, "blockTracker": BlockTracker };
     * type networks = Map<NetworkKey, Network>;
     */
    this.networks = new Map();
    this.selectedNetwork = this._networkKeyForOpts(defaultProviderConfig);
  }

  /**
   * Sets the Infura project ID
   *
   * @param {string} projectId - The Infura project ID
   * @throws {Error} if the project ID is not a valid string
   * @return {void}
   */
  setInfuraProjectId(projectId) {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Invalid Infura project ID');
    }

    this._infuraProjectId = projectId;
  }

  initializeProvider(providerParams) {
    this._baseProviderParams = providerParams;
    const { type, rpcUrl, chainId } = this.getProviderConfig();
    const networkOps = { type, rpcUrl, chainId };

    const networkKey = this._networkKeyForOpts(networkOpts);
    let network = this.networks.get(networkKey);
    if (!network) {
      const network = new Network({...networkOps, infuraProjectId: this.infuraProjectId});
      this.networks.set(networkKey, network);
    }

    this._configureProvider(networkOps, network);
    this.lookupNetwork();
  }

  // return the proxies so the references will always be good
  getProviderAndBlockTracker() {
    const provider = this._providerProxy;
    const blockTracker = this._blockTrackerProxy;
    return { provider, blockTracker };
  }

  verifyNetwork() {
    // Check network when restoring connectivity:
    if (this.isNetworkLoading()) {
      this.lookupNetwork();
    }
  }

  getNetworkState() {
    return this.networkStore.getState();
  }

  setNetworkState(network) {
    this.networkStore.putState(network);
  }

  isNetworkLoading() {
    return this.getNetworkState() === 'loading';
  }

  lookupNetwork() {
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
      this.setNetworkState('loading');
      return;
    }

    // Ping the RPC endpoint so we can confirm that it works
    const ethQuery = new EthQuery(this._provider);
    const initialNetwork = this.getNetworkState();
    const { type } = this.getProviderConfig();
    const isInfura = INFURA_PROVIDER_TYPES.includes(type);

    if (isInfura) {
      this._checkInfuraAvailability(type);
    } else {
      this.emit(NETWORK_EVENTS.INFURA_IS_UNBLOCKED);
    }

    ethQuery.sendAsync({ method: 'net_version' }, (err, networkVersion) => {
      const currentNetwork = this.getNetworkState();
      if (initialNetwork === currentNetwork) {
        if (err) {
          this.setNetworkState('loading');
          return;
        }

        this.setNetworkState(networkVersion);
      }
    });
  }

  getCurrentChainId() {
    const { type, chainId: configChainId } = this.getProviderConfig();
    return NETWORK_TYPE_TO_ID_MAP[type]?.chainId || configChainId;
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
    this.setProviderConfig({
      type: NETWORK_TYPE_RPC,
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    });
  }

  async setProviderType(type, rpcUrl = '', ticker = 'ETH', nickname = '') {
    assert.notStrictEqual(
      type,
      NETWORK_TYPE_RPC,
      `NetworkController - cannot call "setProviderType" with type "${NETWORK_TYPE_RPC}". Use "setRpcTarget"`,
    );
    assert.ok(
      INFURA_PROVIDER_TYPES.includes(type),
      `Unknown Infura provider type "${type}".`,
    );
    const { chainId } = NETWORK_TYPE_TO_ID_MAP[type];
    this.setProviderConfig({ type, rpcUrl, chainId, ticker, nickname });
  }

  resetConnection() {
    this.setProviderConfig(this.getProviderConfig());
  }

  /**
   * Sets the provider config and switches the network.
   */
  setProviderConfig(config) {
    this.previousProviderStore.updateState(this.getProviderConfig());
    this.providerStore.updateState(config);
    this._switchNetwork(config);
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
    return provider.type === NETWORK_TYPE_RPC ? provider.rpcUrl : provider.type;
  }

  //
  // Private
  //

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
    this.emit(NETWORK_EVENTS.NETWORK_WILL_CHANGE);
    this.setNetworkState('loading');
    this._configureProvider(opts);
    this.emit(NETWORK_EVENTS.NETWORK_DID_CHANGE, opts.type);
  }

  _configureProvider(networkOpts, network) {
    const { type, rpcUrl, chainId } = networkOpts;

    if (!network) {
      network = new Network(networkOpts);
    }

    return this._configureNetwork(network);
  }

  _configureLegacyProxiesFromNetwork (network) {
    const { provider, blockTracker } = network;
    // update or intialize proxies
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

  _createChainConditionalProviderAndBlockTracker() {
    const metamaskMiddleware = createMetamaskMiddleware(
      this._baseProviderParams,
    );
    const engine = new JsonRpcEngine();
    engine.push(this._chainConditionalRequestMiddleware);
    engine.push(metamaskMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this._setProviderAndBlockTracker({ provider, blockTracker });
  }

  _chainConditionalRequestMiddleware (req, res, next, end) {
    // If no chainId is present, then behave as usual, using "current network" logic:
    if (!req?.params?.chainId) {
      return next();
    }

    const networkOptsArr = this.networks.keys.map(this._networkOptsForKey)
    .filter(key => key.chainId === req.params.chainId);

    const networkOpts = networkOptsArr[networkOptsArr.length - 1];

    if (networkOptsArr) {
      // We should retain dapp connection, maybe add the permitted chainId's provider
      // from the permissions controller, where the user would have granted a network access to a recipient.
      log.info(`Multiple providers for chainId ${req.params.chainId}, defaulting to newest, ${networkOpts.rpcUrl}`);
    }

    const networkKey = this._networkKeyForOpts(networkOptsArr);
    const { provider } = this.networks.get(networkKey);
    provider.send(req, (err, result) => {
      if (err) {
        res.error = err;
        return end();
      }

      res.result = result;
      end();
    });
  }

  _networkKeyForOpts({ type, rpcUrl, chainId }) {
    return JSON.stringify([ type, rpcUrl, chainId ]);
  }

  _networkOptsForKey(networkKey) {
    const [ type, rpcUrl, chainId ] = JSON.parse(networkKey);
    return { type, rpcUrl, chainId };
  }

  _setProviderAndBlockTracker({ provider, blockTracker }) {
    // update or intialize proxies
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
