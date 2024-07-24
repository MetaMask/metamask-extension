import { ObservableStore } from '@metamask/obs-store';
import { Hex } from '@metamask/utils';
import {
  fetchBridgeFeatureFlags,
  fetchBridgeTokens,
} from '../../../ui/pages/bridge/bridge.util';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { fetchTopAssetsList } from '../../../ui/pages/swaps/swaps.util';

// Maps to BridgeController function names
export enum BridgeUserAction {
  SELECT_SRC_NETWORK = 'selectSrcNetwork',
  SELECT_DEST_NETWORK = 'selectDestNetwork',
}

export enum BridgeBackgroundAction {
  SET_FEATURE_FLAGS = 'setBridgeFeatureFlags',
}

export enum BridgeFeatureFlagsKey {
  EXTENSION_SUPPORT = 'extensionSupport',
  NETWORK_SRC_ALLOWLIST = 'srcNetworkAllowlist',
  NETWORK_DEST_ALLOWLIST = 'destNetworkAllowlist',
}

export type BridgeFeatureFlags = {
  [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: boolean;
  [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: Hex[];
  [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: Hex[];
};

export type BridgeControllerState = {
  bridgeFeatureFlags: BridgeFeatureFlags;
  srcTokens: Record<string, SwapsTokenObject>;
  srcTopAssets: { address: string }[];
  destTokens: Record<string, SwapsTokenObject>;
  destTopAssets: { address: string }[];
};

const initialState: BridgeControllerState = {
  bridgeFeatureFlags: {
    [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: false,
    [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: [],
    [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: [],
  },
  srcTokens: {},
  srcTopAssets: [],
  destTokens: {},
  destTopAssets: [],
};

export default class BridgeController {
  store = new ObservableStore<{ bridgeState: BridgeControllerState }>({
    bridgeState: initialState,
  });

  getState = () => {
    return this.store.getState();
  };

  resetState = () => {
    this.store.updateState({
      bridgeState: {
        ...initialState,
      },
    });
  };

  setBridgeFeatureFlags = async () => {
    const { bridgeState } = this.store.getState();
    const bridgeFeatureFlags = await fetchBridgeFeatureFlags();
    this.store.updateState({
      bridgeState: { ...bridgeState, bridgeFeatureFlags },
    });
  };

  selectSrcNetwork = async (chainId: Hex) => {
    await this.#setTopAssets(chainId, 'srcTopAssets');
    await this.#setTokens(chainId, 'srcTokens');
  };

  selectDestNetwork = async (chainId: Hex) => {
    await this.#setTopAssets(chainId, 'destTopAssets');
    await this.#setTokens(chainId, 'destTokens');
  };

  #setTopAssets = async (
    chainId: Hex,
    stateKey: 'srcTopAssets' | 'destTopAssets',
  ) => {
    const { bridgeState } = this.store.getState();
    const topAssets = await fetchTopAssetsList(chainId);
    this.store.updateState({
      bridgeState: { ...bridgeState, [stateKey]: topAssets },
    });
  };

  #setTokens = async (chainId: Hex, stateKey: 'srcTokens' | 'destTokens') => {
    const { bridgeState } = this.store.getState();
    const tokens = await fetchBridgeTokens(chainId);
    this.store.updateState({
      bridgeState: { ...bridgeState, [stateKey]: tokens },
    });
  };
}
