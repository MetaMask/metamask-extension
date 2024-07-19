import { ObservableStore } from '@metamask/obs-store';
import { Hex } from '@metamask/utils';
import {
  fetchBridgeFeatureFlags,
  fetchBridgeTokens,
} from '../../../../ui/pages/bridge/bridge.util';
import { fetchTopAssetsList } from '../../../../ui/pages/swaps/swaps.util';
import { BridgeControllerState } from './types';
import { DEFAULT_BRIDGE_CONTROLLER_STATE } from './constants';

export default class BridgeController {
  store = new ObservableStore<{ bridgeState: BridgeControllerState }>({
    bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE,
  });

  getState = () => {
    return this.store.getState();
  };

  resetState = () => {
    this.store.updateState({
      bridgeState: {
        ...DEFAULT_BRIDGE_CONTROLLER_STATE,
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
