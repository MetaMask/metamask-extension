import { BaseController, StateMetadata } from '@metamask/base-controller';
import { Hex } from '@metamask/utils';
import {
  fetchBridgeFeatureFlags,
  fetchBridgeTokens,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/pages/bridge/bridge.util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { fetchTopAssetsList } from '../../../../ui/pages/swaps/swaps.util';
import {
  BRIDGE_CONTROLLER_NAME,
  DEFAULT_BRIDGE_CONTROLLER_STATE,
} from './constants';
import { BridgeControllerState, BridgeControllerMessenger } from './types';

const metadata: StateMetadata<{ bridgeState: BridgeControllerState }> = {
  bridgeState: {
    persist: false,
    anonymous: false,
  },
};

export default class BridgeController extends BaseController<
  typeof BRIDGE_CONTROLLER_NAME,
  { bridgeState: BridgeControllerState },
  BridgeControllerMessenger
> {
  constructor({ messenger }: { messenger: BridgeControllerMessenger }) {
    super({
      name: BRIDGE_CONTROLLER_NAME,
      metadata,
      messenger,
      state: { bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE },
    });

    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:setBridgeFeatureFlags`,
      this.setBridgeFeatureFlags.bind(this),
    );
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:selectDestNetwork`,
      this.selectDestNetwork.bind(this),
    );
  }

  resetState = () => {
    this.update((_state) => {
      _state.bridgeState = {
        ...DEFAULT_BRIDGE_CONTROLLER_STATE,
      };
    });
  };

  setBridgeFeatureFlags = async () => {
    const { bridgeState } = this.state;
    try {
      const bridgeFeatureFlags = await fetchBridgeFeatureFlags();
      this.update((_state) => {
        _state.bridgeState = { ...bridgeState, bridgeFeatureFlags };
      });
    } catch (error) {
      console.error(
        'Failed to fetch Bridge feature flags, using defaults.',
        error,
      );
      this.update((_state) => {
        _state.bridgeState = {
          ...bridgeState,
          bridgeFeatureFlags:
            DEFAULT_BRIDGE_CONTROLLER_STATE.bridgeFeatureFlags,
        };
      });
    }
  };

  selectDestNetwork = async (chainId: Hex) => {
    await this.#setTopAssets(chainId, 'destTopAssets');
    await this.#setTokens(chainId, 'destTokens');
  };

  #setTopAssets = async (
    chainId: Hex,
    stateKey: 'srcTopAssets' | 'destTopAssets',
  ) => {
    const { bridgeState } = this.state;
    const topAssets = await fetchTopAssetsList(chainId);
    this.update((_state) => {
      _state.bridgeState = { ...bridgeState, [stateKey]: topAssets };
    });
  };

  #setTokens = async (chainId: Hex, stateKey: 'srcTokens' | 'destTokens') => {
    const { bridgeState } = this.state;
    const tokens = await fetchBridgeTokens(chainId);
    this.update((_state) => {
      _state.bridgeState = { ...bridgeState, [stateKey]: tokens };
    });
  };
}
