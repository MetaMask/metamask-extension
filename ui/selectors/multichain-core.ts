import {
  MultichainProviderConfig,
  MULTICHAIN_PROVIDER_CONFIGS,
} from '../../shared/constants/multichain/networks';
import { MultichainState, BalancesState } from './multichain.types';

export function getMultichainBalances(
  state: MultichainState,
): BalancesState['metamask']['balances'] {
  return state.metamask.balances;
}

export function getMultichainNetworkProviders(
  _state: MultichainState,
): MultichainProviderConfig[] {
  // TODO: need state from the ChainController?
  return Object.values(MULTICHAIN_PROVIDER_CONFIGS);
}
