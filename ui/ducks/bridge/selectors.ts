import { createSelector } from 'reselect';
import { getProviderConfig } from '../metamask/metamask';
import { getIsBridgeEnabled, getSwapsDefaultToken } from '../../selectors';
import * as swapsSlice from '../swaps/swaps';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';

export const getFromChain = (state: any) => getProviderConfig(state);
export const getToChain = (state: any) => {
  return state.bridge.toChain;
};
// TODO read from feature flags and return ProviderConfig/RPCDefinition
export const getFromChains = (state: any) => ALLOWED_BRIDGE_CHAIN_IDS;
// TODO read from feature flags and return ProviderConfig/RPCDefinition
export const getToChains = (state: any) => ALLOWED_BRIDGE_CHAIN_IDS;

export const getFromToken = (state: any) => {
  const swapsFromToken = swapsSlice.getFromToken(state);
  if (!swapsFromToken?.symbol) {
    return getSwapsDefaultToken(state);
  }
  return swapsFromToken;
};
export const getToToken = (state: any) => {
  return swapsSlice.getToToken(state);
};

export const getFromAmount = (state: any) =>
  swapsSlice.getFromTokenInputValue(state);
export const getToAmount = (state: any) => {
  // TODO get toAmount from best or selected bridge controller quote
  return '0';
};

export const getIsBridgeTx = createSelector(
  getFromChain,
  getToChain,
  (state) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled &&
    toChain !== null &&
    fromChain.chainId !== toChain.chainId,
);
