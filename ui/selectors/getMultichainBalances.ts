import { MultichainState, BalancesState } from './multichain';

export function getMultichainBalances(
  state: MultichainState,
): BalancesState['metamask']['balances'] {
  return state.metamask.balances;
}
