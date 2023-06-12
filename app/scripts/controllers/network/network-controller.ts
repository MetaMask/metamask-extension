import { strict as assert } from 'assert';
import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import {
  createSwappableProxy,
  createEventEmitterProxy,
  SwappableProxy,
} from '@metamask/swappable-obj-proxy';
import EthQuery from 'eth-query';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { v4 as uuid } from 'uuid';
import { Hex, isPlainObject, isStrictHexString } from '@metamask/utils';
import { errorCodes } from 'eth-rpc-errors';
import { SafeEventEmitterProvider } from '@metamask/eth-json-rpc-provider';
import { PollingBlockTracker } from 'eth-block-tracker';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import {
  INFURA_PROVIDER_TYPES,
  INFURA_BLOCKED_KEY,
  TEST_NETWORK_TICKER_MAP,
  CHAIN_IDS,
  NETWORK_TYPES,
  BUILT_IN_INFURA_NETWORKS,
  BuiltInInfuraNetwork,
  NetworkStatus,
} from '../../../../shared/constants/network';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../shared/modules/network.utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import { isErrorWithMessage } from '../../../../shared/modules/error';
import {
  createNetworkClient,
  NetworkClientType,
} from './create-network-client';

/**
 * The name of NetworkController.
 */
const name = 'NetworkController';

/**
 * A block header object that `eth_getBlockByNumber` returns. Note that this
 * type does not specify all of the properties present within the block header;
 * within NetworkController, we are only interested in `baseFeePerGas`.
 */
type Block = {
  baseFeePerGas?: unknown;
};

/**
 * Encodes a few pieces of information:
 *
 * - Whether or not a provider is configured for an Infura network or a
 * non-Infura network.
 * - If an Infura network, then which network.
 * - If a non-Infura network, then whether the network exists locally or
 * remotely.
 *
 * Primarily used to build the network client and check the availability of a
 * network.
 */
export type ProviderType = BuiltInInfuraNetwork | typeof NETWORK_TYPES.RPC;

/**
 * The network ID of a network.
 */
type NetworkId = `${number}`;

/**
 * The ID of a network configuration.
 */
type NetworkConfigurationId = string;

/**
 * The chain ID of a network.
 */
type ChainId = Hex;

/**
 * `networkWillChange` is published when the current network is about to be
 * switched, but the new provider has not been created and no state changes have
 * occurred yet.
 */
export type NetworkControllerNetworkWillChangeEvent = {
  type: 'NetworkController:networkWillChange';
  payload: [];
};

/**
 * `networkDidChange` is published after a provider has been created for a newly
 * switched network (but before the network has been confirmed to be available).
 */
export type NetworkControllerNetworkDidChangeEvent = {
  type: 'NetworkController:networkDidChange';
  payload: [];
};

/**
 * `infuraIsBlocked` is published after the network is switched to an Infura
 * network, but when Infura returns an error blocking the user based on their
 * location.
 */
export type NetworkControllerInfuraIsBlockedEvent = {
  type: 'NetworkController:infuraIsBlocked';
  payload: [];
};

/**
 * `infuraIsBlocked` is published either after the network is switched to an
 * Infura network and Infura does not return an error blocking the user based on
 * their location, or the network is switched to a non-Infura network.
 */
export type NetworkControllerInfuraIsUnblockedEvent = {
  type: 'NetworkController:infuraIsUnblocked';
  payload: [];
};

/**
 * The set of events that the NetworkController messenger can publish.
 */
export type NetworkControllerEvent =
  | NetworkControllerNetworkDidChangeEvent
  | NetworkControllerNetworkWillChangeEvent
  | NetworkControllerInfuraIsBlockedEvent
  | NetworkControllerInfuraIsUnblockedEvent;

export type NetworkControllerGetProviderConfigAction = {
  type: `NetworkController:getProviderConfig`;
  handler: () => ProviderConfiguration;
};

export type NetworkControllerGetEthQueryAction = {
  type: `NetworkController:getEthQuery`;
  handler: () => EthQuery | undefined;
};

export type NetworkControllerAction =
  | NetworkControllerGetProviderConfigAction
  | NetworkControllerGetEthQueryAction;

/**
 * The messenger that the NetworkController uses to publish events.
 */
export type NetworkControllerMessenger = RestrictedControllerMessenger<
  typeof name,
  NetworkControllerAction,
  NetworkControllerEvent,
  string,
  string
>;

/**
 * Information used to set up the middleware stack for a particular kind of
 * network. Currently has overlap with `NetworkConfiguration`, although the
 * two will be merged down the road.
 */
export type ProviderConfiguration = {
  /**
   * Either a type of Infura network, "localhost" for a locally operated
   * network, or "rpc" for everything else.
   */
  type: ProviderType;
  /**
   * The chain ID as per EIP-155.
   */
  chainId: ChainId;
  /**
   * The URL of the RPC endpoint. Only used when `type` is "localhost" or "rpc".
   */
  rpcUrl?: string;
  /**
   * The shortname of the currency used by the network.
   */
  ticker?: string;
  /**
   * The user-customizable name of the network.
   */
  nickname?: string;
  /**
   * User-customizable details for the network.
   */
  rpcPrefs?: {
    blockExplorerUrl?: string;
  };
  /**
   * The ID of the network configuration used to build this provider config.
   */
  id?: NetworkConfigurationId;
};

/**
 * The contents of the `networkId` store.
 */
type NetworkIdState = NetworkId | null;

/**
 * Information about the network not held by any other part of state. Currently
 * only used to capture whether a network supports EIP-1559.
 */
type NetworkDetails = {
  /**
   * EIPs supported by the network.
   */
  EIPS: {
    [eipNumber: number]: boolean | undefined;
  };
  [otherProperty: string]: unknown;
};

/**
 * A "network configuration" represents connection data directly provided by
 * users via the wallet UI for a custom network (we already have this
 * information for networks that come pre-shipped with the wallet). Ultimately
 * used to set up the middleware stack so that the wallet can make requests to
 * the network. Currently has overlap with `ProviderConfiguration`, although the
 * two will be merged down the road.
 */
type NetworkConfiguration = {
  /**
   * The unique ID of the network configuration. Useful for switching to and
   * removing specific networks.
   */
  id: NetworkConfigurationId;
  /**
   * The URL of the RPC endpoint. Only used when `type` is "localhost" or "rpc".
   */
  rpcUrl: string;
  /**
   * The chain ID as per EIP-155.
   */
  chainId: ChainId;
  /**
   * The shortname of the currency used for this network.
   */
  ticker: string;
  /**
   * The user-customizable name of the network.
   */
  nickname?: string;
  /**
   * User-customizable details for the network.
   */
  rpcPrefs?: {
    blockExplorerUrl: string;
  };
};

/**
 * A set of network configurations, keyed by ID.
 */
type NetworkConfigurations = Record<
  NetworkConfigurationId,
  NetworkConfiguration
>;

/**
 * The state that NetworkController holds after combining its individual stores.
 */
export type NetworkControllerState = {
  providerConfig: ProviderConfiguration;
  networkId: NetworkIdState;
  networkStatus: NetworkStatus;
  networkDetails: NetworkDetails;
  networkConfigurations: NetworkConfigurations;
};

/**
 * The options that NetworkController takes.
 */
export type NetworkControllerOptions = {
  messenger: NetworkControllerMessenger;
  state?: {
    providerConfig?: ProviderConfiguration;
    networkDetails?: NetworkDetails;
    networkConfigurations?: NetworkConfigurations;
  };
  infuraProjectId: string;
  trackMetaMetricsEvent: (payload: MetaMetricsEventPayload) => void;
};

/**
 * Type guard for determining whether the given value is an error object with a
 * `code` property, such as an instance of Error.
 *
 * TODO: Move this to @metamask/utils
 *
 * @param error - The object to check.
 * @returns True if `error` has a `code`, false otherwise.
 */
function isErrorWithCode(error: unknown): error is { code: string | number } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/**
 * Convert the given value into a valid network ID. The ID is accepted
 * as either a number, a decimal string, or a 0x-prefixed hex string.
 *
 * @param value - The network ID to convert, in an unknown format.
 * @returns A valid network ID (as a decimal string)
 * @throws If the given value cannot be safely parsed.
 */
function convertNetworkId(value: unknown): NetworkId {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return `${value}`;
  } else if (isStrictHexString(value)) {
    return hexToDecimal(value) as NetworkId;
  } else if (typeof value === 'string' && /^\d+$/u.test(value)) {
    return value as NetworkId;
  }
  throw new Error(`Cannot parse as a valid network ID: '${value}'`);
}

/**
 * Builds the default provider config used to initialize the network controller.
 */
function buildDefaultProviderConfigState(): ProviderConfiguration {
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
    process.env.METAMASK_ENVIRONMENT === 'test'
  ) {
    return {
      type: NETWORK_TYPES.GOERLI,
      chainId: CHAIN_IDS.GOERLI,
      ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.GOERLI],
    };
  }

  return {
    type: NETWORK_TYPES.MAINNET,
    chainId: CHAIN_IDS.MAINNET,
    ticker: 'ETH',
  };
}

/**
 * Builds the default network ID state used to initialize the network
 * controller.
 */
function buildDefaultNetworkIdState(): NetworkIdState {
  return null;
}

/**
 * Builds the default network status state used to initialize the network
 * controller.
 */
function buildDefaultNetworkStatusState(): NetworkStatus {
  return NetworkStatus.Unknown;
}

/**
 * Builds the default network details state used to initialize the
 * network controller.
 */
function buildDefaultNetworkDetailsState(): NetworkDetails {
  return {
    EIPS: {},
  };
}

/**
 * Builds the default network configurations state used to initialize the
 * network controller.
 */
function buildDefaultNetworkConfigurationsState(): NetworkConfigurations {
  return {};
}

/**
 * Builds the default state for the network controller.
 *
 * @returns The default network controller state.
 */
function buildDefaultState() {
  return {
    providerConfig: buildDefaultProviderConfigState(),
    networkId: buildDefaultNetworkIdState(),
    networkStatus: buildDefaultNetworkStatusState(),
    networkDetails: buildDefaultNetworkDetailsState(),
    networkConfigurations: buildDefaultNetworkConfigurationsState(),
  };
}

/**
 * Returns whether the given argument is a type that our Infura middleware
 * recognizes. We can't calculate this inline because the usual type of `type`,
 * which we get from the provider config, is not a subset of the type of
 * `INFURA_PROVIDER_TYPES`, but rather a superset, and therefore we cannot make
 * a proper comparison without TypeScript complaining. However, if we downcast
 * both variables, then we are able to achieve this. As a bonus, this function
 * also types the given argument as a `BuiltInInfuraNetwork` assuming that the
 * check succeeds.
 *
 * @param type - A type to compare.
 * @returns True or false, depending on whether the given type is one that our
 * Infura middleware recognizes.
 */
function isInfuraProviderType(type: string): type is BuiltInInfuraNetwork {
  const infuraProviderTypes: readonly string[] = INFURA_PROVIDER_TYPES;
  return infuraProviderTypes.includes(type);
}

/**
 * The network controller creates and manages the "provider" object which allows
 * our code and external dapps to make requests to a network. The requests are
 * filtered through a set of middleware (provided by
 * [`eth-json-rpc-middleware`][1]) which not only performs the HTTP request to
 * the appropriate RPC endpoint but also uses caching to limit duplicate
 * requests to Infura and smoothens interactions with the blockchain in general.
 *
 * [1]: https://github.com/MetaMask/eth-json-rpc-middleware
 */
export class NetworkController extends EventEmitter {
  /**
   * The messenger that NetworkController uses to publish events.
   */
  #messenger: NetworkControllerMessenger;

  /**
   * Observable store containing the provider configuration for the previously
   * configured network.
   */
  #previousProviderConfig: ProviderConfiguration;

  /**
   * Observable store containing a combination of data from all of the
   * individual stores.
   */
  store: ObservableStore<NetworkControllerState>;

  #provider: SafeEventEmitterProvider | null;

  #blockTracker: PollingBlockTracker | null;

  #providerProxy: SwappableProxy<SafeEventEmitterProvider> | null;

  #blockTrackerProxy: SwappableProxy<PollingBlockTracker> | null;

  #ethQuery: EthQuery | undefined;

  #infuraProjectId: NetworkControllerOptions['infuraProjectId'];

  #trackMetaMetricsEvent: NetworkControllerOptions['trackMetaMetricsEvent'];

  /**
   * Constructs a network controller.
   *
   * @param options - Options for this constructor.
   * @param options.messenger - The NetworkController messenger.
   * @param options.state - Initial controller state.
   * @param options.infuraProjectId - The Infura project ID.
   * @param options.trackMetaMetricsEvent - A method to forward events to the
   * {@link MetaMetricsController}.
   */
  constructor({
    messenger,
    state = {},
    infuraProjectId,
    trackMetaMetricsEvent,
  }: NetworkControllerOptions) {
    super();

    this.#messenger = messenger;

    this.store = new ObservableStore({
      ...buildDefaultState(),
      ...state,
    });
    this.#previousProviderConfig = this.store.getState().providerConfig;

    // provider and block tracker
    this.#provider = null;
    this.#blockTracker = null;

    // provider and block tracker proxies - because the network changes
    this.#providerProxy = null;
    this.#blockTrackerProxy = null;

    if (!infuraProjectId || typeof infuraProjectId !== 'string') {
      throw new Error('Invalid Infura project ID');
    }
    this.#infuraProjectId = infuraProjectId;
    this.#trackMetaMetricsEvent = trackMetaMetricsEvent;

    this.#messenger.registerActionHandler(`${name}:getProviderConfig`, () => {
      return this.store.getState().providerConfig;
    });
    this.#messenger.registerActionHandler(`${name}:getEthQuery`, () => {
      return this.#ethQuery;
    });
  }

  /**
   * Deactivates the controller, stopping any ongoing polling.
   *
   * In-progress requests will not be aborted.
   */
  async destroy(): Promise<void> {
    await this.#blockTracker?.destroy();
  }

  /**
   * Creates the provider and block tracker for the configured network,
   * using the provider to gather details about the network.
   */
  async initializeProvider(): Promise<void> {
    const { type, rpcUrl, chainId } = this.store.getState().providerConfig;
    this.#configureProvider({ type, rpcUrl, chainId });
    await this.lookupNetwork();
  }

  /**
   * Returns the proxies wrapping the currently set provider and block tracker.
   */
  getProviderAndBlockTracker(): {
    provider: SwappableProxy<SafeEventEmitterProvider> | null;
    blockTracker: SwappableProxy<PollingBlockTracker> | null;
  } {
    const provider = this.#providerProxy;
    const blockTracker = this.#blockTrackerProxy;
    return { provider, blockTracker };
  }

  /**
   * Determines whether the network supports EIP-1559 by checking whether the
   * latest block has a `baseFeePerGas` property, then updates state
   * appropriately.
   *
   * @returns A promise that resolves to true if the network supports EIP-1559
   * and false otherwise.
   */
  async getEIP1559Compatibility(): Promise<boolean> {
    const { EIPS } = this.store.getState().networkDetails;
    // NOTE: This isn't necessary anymore because the block cache middleware
    // already prevents duplicate requests from taking place
    if (EIPS[1559] !== undefined) {
      return EIPS[1559];
    }

    const { provider } = this.getProviderAndBlockTracker();
    if (!provider) {
      // Really we should throw an error if a provider hasn't been initialized
      // yet, but that might have undesirable repercussions, so return false for
      // now
      return false;
    }

    const supportsEIP1559 = await this.#determineEIP1559Compatibility(provider);
    const { networkDetails } = this.store.getState();
    this.store.updateState({
      networkDetails: {
        ...networkDetails,
        EIPS: {
          ...networkDetails.EIPS,
          1559: supportsEIP1559,
        },
      },
    });
    return supportsEIP1559;
  }

  /**
   * Performs side effects after switching to a network. If the network is
   * available, updates the network state with the network ID of the network and
   * stores whether the network supports EIP-1559; otherwise clears said
   * information about the network that may have been previously stored.
   *
   * @fires infuraIsBlocked if the network is Infura-supported and is blocking
   * requests.
   * @fires infuraIsUnblocked if the network is Infura-supported and is not
   * blocking requests, or if the network is not Infura-supported.
   */
  async lookupNetwork(): Promise<void> {
    const { type } = this.store.getState().providerConfig;
    const { provider } = this.getProviderAndBlockTracker();
    let networkChanged = false;
    let networkId: NetworkIdState = null;
    let supportsEIP1559 = false;
    let networkStatus: NetworkStatus;

    if (provider === null) {
      log.warn(
        'NetworkController - lookupNetwork aborted due to missing provider',
      );
      return;
    }

    const isInfura = isInfuraProviderType(type);

    const listener = () => {
      networkChanged = true;
      this.#messenger.unsubscribe(
        'NetworkController:networkDidChange',
        listener,
      );
    };
    this.#messenger.subscribe('NetworkController:networkDidChange', listener);

    try {
      const results = await Promise.all([
        this.#getNetworkId(provider),
        this.#determineEIP1559Compatibility(provider),
      ]);
      const possibleNetworkId = results[0];
      networkId = convertNetworkId(possibleNetworkId);
      supportsEIP1559 = results[1];
      networkStatus = NetworkStatus.Available;
    } catch (error) {
      if (isErrorWithCode(error)) {
        let responseBody;
        if (isInfura && isErrorWithMessage(error)) {
          try {
            responseBody = JSON.parse(error.message);
          } catch {
            // error.message must not be JSON
          }
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
    this.#messenger.unsubscribe('NetworkController:networkDidChange', listener);

    this.store.updateState({
      networkStatus,
    });

    if (networkStatus === NetworkStatus.Available) {
      const { networkDetails } = this.store.getState();
      this.store.updateState({
        networkId,
        networkDetails: {
          ...networkDetails,
          EIPS: {
            ...networkDetails.EIPS,
            1559: supportsEIP1559,
          },
        },
      });
    } else {
      this.#resetNetworkId();
      this.#resetNetworkDetails();
    }

    if (isInfura) {
      if (networkStatus === NetworkStatus.Available) {
        this.#messenger.publish('NetworkController:infuraIsUnblocked');
      } else if (networkStatus === NetworkStatus.Blocked) {
        this.#messenger.publish('NetworkController:infuraIsBlocked');
      }
    } else {
      // Always publish infuraIsUnblocked regardless of network status to
      // prevent consumers from being stuck in a blocked state if they were
      // previously connected to an Infura network that was blocked
      this.#messenger.publish('NetworkController:infuraIsUnblocked');
    }
  }

  /**
   * Switches to the network specified by a network configuration.
   *
   * @param networkConfigurationId - The unique identifier that refers to a
   * previously added network configuration.
   * @returns The URL of the RPC endpoint representing the newly switched
   * network.
   */
  async setActiveNetwork(networkConfigurationId: NetworkConfigurationId) {
    const targetNetwork =
      this.store.getState().networkConfigurations[networkConfigurationId];

    if (!targetNetwork) {
      throw new Error(
        `networkConfigurationId ${networkConfigurationId} does not match a configured networkConfiguration`,
      );
    }

    await this.#setProviderConfig({
      type: NETWORK_TYPES.RPC,
      ...targetNetwork,
    });

    return targetNetwork.rpcUrl;
  }

  /**
   * Switches to an Infura-supported network.
   *
   * @param type - The shortname of the network.
   * @throws if the `type` is "rpc" or if it is not a known Infura-supported
   * network.
   */
  async setProviderType(type: string) {
    assert.notStrictEqual(
      type,
      NETWORK_TYPES.RPC,
      `NetworkController - cannot call "setProviderType" with type "${NETWORK_TYPES.RPC}". Use "setActiveNetwork"`,
    );
    assert.ok(
      isInfuraProviderType(type),
      `Unknown Infura provider type "${type}".`,
    );
    const network = BUILT_IN_INFURA_NETWORKS[type];
    await this.#setProviderConfig({
      type,
      rpcUrl: undefined,
      chainId: network.chainId,
      ticker: 'ticker' in network ? network.ticker : 'ETH',
      nickname: undefined,
      rpcPrefs: { blockExplorerUrl: network.blockExplorerUrl },
      id: undefined,
    });
  }

  /**
   * Re-initializes the provider and block tracker for the current network.
   */
  async resetConnection() {
    await this.#setProviderConfig(this.store.getState().providerConfig);
  }

  /**
   * Switches to the previous network, assuming that the current network is
   * different than the initial network (if it is, then this is equivalent to
   * calling `resetConnection`).
   */
  async rollbackToPreviousProvider() {
    const config = this.#previousProviderConfig;
    this.store.updateState({
      providerConfig: config,
    });
    await this.#switchNetwork(config);
  }

  /**
   * Fetches the latest block for the network.
   *
   * @param provider - A provider, which is guaranteed to be available.
   * @returns A promise that either resolves to the block header or null if
   * there is no latest block, or rejects with an error.
   */
  #getLatestBlock(provider: SafeEventEmitterProvider): Promise<Block | null> {
    return new Promise((resolve, reject) => {
      const ethQuery = new EthQuery(provider);
      ethQuery.sendAsync<['latest', false], Block | null>(
        { method: 'eth_getBlockByNumber', params: ['latest', false] },
        (...args) => {
          if (args[0] === null) {
            resolve(args[1]);
          } else {
            reject(args[0]);
          }
        },
      );
    });
  }

  /**
   * Fetches the network ID for the network.
   *
   * @param provider - A provider, which is guaranteed to be available.
   * @returns A promise that either resolves to the network ID, or rejects with
   * an error.
   */
  async #getNetworkId(provider: SafeEventEmitterProvider): Promise<string> {
    const ethQuery = new EthQuery(provider);
    return await new Promise((resolve, reject) => {
      ethQuery.sendAsync<never[], string>(
        { method: 'net_version' },
        (...args) => {
          if (args[0] === null) {
            resolve(args[1]);
          } else {
            reject(args[0]);
          }
        },
      );
    });
  }

  /**
   * Clears the stored network ID.
   */
  #resetNetworkId(): void {
    this.store.updateState({
      networkId: buildDefaultNetworkIdState(),
    });
  }

  /**
   * Resets network status to the default ("unknown").
   */
  #resetNetworkStatus(): void {
    this.store.updateState({
      networkStatus: buildDefaultNetworkStatusState(),
    });
  }

  /**
   * Clears details previously stored for the network.
   */
  #resetNetworkDetails(): void {
    this.store.updateState({
      networkDetails: buildDefaultNetworkDetailsState(),
    });
  }

  /**
   * Stores the given provider configuration representing a network in state,
   * then uses it to create a new provider for that network.
   *
   * @param providerConfig - The provider configuration.
   */
  async #setProviderConfig(providerConfig: ProviderConfiguration) {
    this.#previousProviderConfig = this.store.getState().providerConfig;
    this.store.updateState({ providerConfig });
    await this.#switchNetwork(providerConfig);
  }

  /**
   * Retrieves the latest block from the currently selected network; if the
   * block has a `baseFeePerGas` property, then we know that the network
   * supports EIP-1559; otherwise it doesn't.
   *
   * @param provider - A provider, which is guaranteed to be available.
   * @returns A promise that resolves to true if the network supports EIP-1559
   * and false otherwise.
   */
  async #determineEIP1559Compatibility(
    provider: SafeEventEmitterProvider,
  ): Promise<boolean> {
    const latestBlock = await this.#getLatestBlock(provider);
    return latestBlock?.baseFeePerGas !== undefined;
  }

  /**
   * Executes a series of steps to change the current network:
   *
   * 1. Notifies subscribers that the network is about to change.
   * 2. Clears state associated with the current network.
   * 3. Creates a new network client along with a provider for the desired
   * network.
   * 4. Notifies subscribes that the network has changed.
   *
   * @param providerConfig - The provider configuration object that specifies
   * the new network.
   */
  async #switchNetwork(providerConfig: ProviderConfiguration) {
    const { type, rpcUrl, chainId } = providerConfig;
    this.#messenger.publish('NetworkController:networkWillChange');
    this.#resetNetworkId();
    this.#resetNetworkStatus();
    this.#resetNetworkDetails();
    this.#configureProvider({ type, rpcUrl, chainId });
    this.#messenger.publish('NetworkController:networkDidChange');
    await this.lookupNetwork();
  }

  /**
   * Creates a network client (a stack of middleware along with a provider and
   * block tracker) to talk to a network.
   *
   * @param args - The arguments.
   * @param args.type - The provider type.
   * @param args.rpcUrl - The URL of the RPC endpoint that represents the
   * network. Only used for non-Infura networks.
   * @param args.chainId - The chain ID of the network (as per EIP-155). Only
   * used for non-Infura-supported networks (as we already know the chain ID of
   * any Infura-supported network).
   * @throws if the `type` if not a known Infura-supported network.
   */
  #configureProvider({
    type,
    rpcUrl,
    chainId,
  }: {
    type: ProviderType;
    rpcUrl: string | undefined;
    chainId: Hex | undefined;
  }): void {
    const isInfura = isInfuraProviderType(type);
    if (isInfura) {
      this.#configureInfuraProvider({
        type,
        infuraProjectId: this.#infuraProjectId,
      });
    } else if (type === NETWORK_TYPES.RPC) {
      if (chainId === undefined) {
        throw new Error('chainId must be provided for custom RPC endpoints');
      }
      if (rpcUrl === undefined) {
        throw new Error('rpcUrl must be provided for custom RPC endpoints');
      }
      this.#configureStandardProvider(rpcUrl, chainId);
    } else {
      throw new Error(`Unrecognized network type: '${type}'`);
    }
  }

  /**
   * Creates a new instance of EthQuery that wraps the current provider and
   * saves it for future usage.
   */
  #registerProvider() {
    const { provider } = this.getProviderAndBlockTracker();

    if (provider) {
      this.#ethQuery = new EthQuery(provider);
    }
  }

  /**
   * Creates a network client (a stack of middleware along with a provider and
   * block tracker) to talk to an Infura-supported network.
   *
   * @param args - The arguments.
   * @param args.type - The shortname of the Infura network (see
   * {@link NETWORK_TYPES}).
   * @param args.infuraProjectId - An Infura API key. ("Project ID" is a
   * now-obsolete term we've retained for backward compatibility.)
   */
  #configureInfuraProvider({
    type,
    infuraProjectId,
  }: {
    type: BuiltInInfuraNetwork;
    infuraProjectId: NetworkControllerOptions['infuraProjectId'];
  }): void {
    log.info('NetworkController - #configureInfuraProvider', type);
    const { provider, blockTracker } = createNetworkClient({
      network: type,
      infuraProjectId,
      type: NetworkClientType.Infura,
    });
    this.#updateProvider(provider, blockTracker);
  }

  /**
   * Creates a network client (a stack of middleware along with a provider and
   * block tracker) to talk to a non-Infura-supported network.
   *
   * @param rpcUrl - The URL of the RPC endpoint that represents the network.
   * @param chainId - The chain ID of the network (as per EIP-155).
   */
  #configureStandardProvider(rpcUrl: string, chainId: ChainId): void {
    log.info('NetworkController - #configureStandardProvider', rpcUrl);
    const { provider, blockTracker } = createNetworkClient({
      chainId,
      rpcUrl,
      type: NetworkClientType.Custom,
    });
    this.#updateProvider(provider, blockTracker);
  }

  /**
   * Given a provider and a block tracker, updates any proxies pointing to
   * these objects that have been previously set, or initializes any proxies
   * that have not been previously set, then creates an instance of EthQuery
   * that wraps the provider.
   *
   * @param provider - The provider.
   * @param blockTracker - The block tracker.
   */
  #updateProvider(
    provider: SafeEventEmitterProvider,
    blockTracker: PollingBlockTracker,
  ) {
    this.#setProviderAndBlockTracker({
      provider,
      blockTracker,
    });
    this.#registerProvider();
  }

  /**
   * Given a provider and a block tracker, updates any proxies pointing to
   * these objects that have been previously set, or initializes any proxies
   * that have not been previously set.
   *
   * @param args - The arguments.
   * @param args.provider - The provider.
   * @param args.blockTracker - The block tracker.
   */
  #setProviderAndBlockTracker({
    provider,
    blockTracker,
  }: {
    provider: SafeEventEmitterProvider;
    blockTracker: PollingBlockTracker;
  }): void {
    // update or initialize proxies
    if (this.#providerProxy) {
      this.#providerProxy.setTarget(provider);
    } else {
      this.#providerProxy = createSwappableProxy(provider);
    }
    if (this.#blockTrackerProxy) {
      this.#blockTrackerProxy.setTarget(blockTracker);
    } else {
      this.#blockTrackerProxy = createEventEmitterProxy(blockTracker, {
        eventFilter: 'skipInternal',
      });
    }
    // set new provider and blockTracker
    this.#provider = provider;
    this.#blockTracker = blockTracker;
  }

  /**
   * Network Configuration management functions
   */

  /**
   * Updates an existing network configuration matching the same RPC URL as the
   * given network configuration; otherwise adds the network configuration.
   * Following the upsert, the `trackMetaMetricsEvent` callback specified
   * via the NetworkController constructor will be called to (presumably) create
   * a MetaMetrics event.
   *
   * @param networkConfiguration - The network configuration to upsert.
   * @param networkConfiguration.chainId - The chain ID of the network as per
   * EIP-155.
   * @param networkConfiguration.ticker - The shortname of the currency used by
   * the network.
   * @param networkConfiguration.nickname - The user-customizable name of the
   * network.
   * @param networkConfiguration.rpcPrefs - User-customizable details for the
   * network.
   * @param networkConfiguration.rpcUrl - The URL of the RPC endpoint.
   * @param additionalArgs - Additional arguments.
   * @param additionalArgs.setActive - Switches to the network specified by
   * the given network configuration following the upsert.
   * @param additionalArgs.referrer - The site from which the call originated,
   * or 'metamask' for internal calls; used for event metrics.
   * @param additionalArgs.source - Where the metric event originated (i.e. from
   * a dapp or from the network form); used for event metrics.
   * @throws if the `chainID` does not match EIP-155 or is too large.
   * @throws if `rpcUrl` is not a valid URL.
   * @returns The ID for the added or updated network configuration.
   */
  async upsertNetworkConfiguration(
    {
      rpcUrl,
      chainId,
      ticker,
      nickname,
      rpcPrefs,
    }: Omit<NetworkConfiguration, 'id'>,
    {
      setActive = false,
      referrer,
      source,
    }: {
      setActive?: boolean;
      referrer: string;
      source: string;
    },
  ): Promise<NetworkConfigurationId> {
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
      if (isErrorWithMessage(e) && e.message.includes('Invalid URL')) {
        throw new Error('rpcUrl must be a valid URL');
      }
    }

    if (!ticker) {
      throw new Error(
        'A ticker is required to add or update networkConfiguration',
      );
    }

    const { networkConfigurations } = this.store.getState();
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

    const newNetworkConfigurationId = oldNetworkConfigurationId || uuid();
    this.store.updateState({
      networkConfigurations: {
        ...networkConfigurations,
        [newNetworkConfigurationId]: {
          ...newNetworkConfiguration,
          id: newNetworkConfigurationId,
        },
      },
    });

    if (!oldNetworkConfigurationId) {
      this.#trackMetaMetricsEvent({
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
      await this.setActiveNetwork(newNetworkConfigurationId);
    }

    return newNetworkConfigurationId;
  }

  /**
   * Removes a network configuration from state.
   *
   * @param networkConfigurationId - The unique id for the network configuration
   * to remove.
   */
  removeNetworkConfiguration(networkConfigurationId: NetworkConfigurationId) {
    if (!this.store.getState().networkConfigurations[networkConfigurationId]) {
      throw new Error(
        `networkConfigurationId ${networkConfigurationId} does not match a configured networkConfiguration`,
      );
    }
    const networkConfigurations = {
      ...this.store.getState().networkConfigurations,
    };
    delete networkConfigurations[networkConfigurationId];
    this.store.updateState({
      networkConfigurations,
    });
  }
}
