import { MultichainState, BalancesState } from './multichain.types';

export function getMultichainBalances(
  state: MultichainState,
): BalancesState['metamask']['balances'] {
  return state.metamask.balances;
}
