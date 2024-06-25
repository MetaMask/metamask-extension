import { createSelector } from 'reselect';
import { getProviderConfig } from '../metamask/metamask';
import { getIsBridgeEnabled } from '../../selectors';

export const getFromChain = (state: any) => getProviderConfig(state);
export const getToChain = (state: any) => state.bridge.toChain;

export const getIsBridgeTx = createSelector(
  getFromChain,
  getToChain,
  (state) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled &&
    toChain !== null &&
    fromChain.chainId !== toChain.chainId,
);
