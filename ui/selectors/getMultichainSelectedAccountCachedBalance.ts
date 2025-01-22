import { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import { getSelectedInternalAccount } from './accounts';
import { getSelectedAccountCachedBalance } from './selectors';
import { getMultichainBalances } from './getMultichainBalances';
import type { MultichainState } from './multichain.types';
import { getMultichainCurrentNetwork } from './getMultichainCurrentNetwork';
import { getMultichainIsEvm } from './getMultichainIsEvm';

function getNonEvmCachedBalance(
  state: MultichainState,
  account?: InternalAccount,
) {
  const balances = getMultichainBalances(state);
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const network = getMultichainCurrentNetwork(state);

  // We assume that there's at least one asset type in and that is the native
  // token for that network.
  const asset =
    MULTICHAIN_NETWORK_TO_ASSET_TYPES[
      network.chainId as MultichainNetworks
    ]?.[0];

  if (!asset) {
    console.warn('Could not find asset type for network:', network);
  }

  const balancesForAccount = balances?.[selectedAccount.id];
  if (!balancesForAccount) {
    console.warn('Could not find balances for account:', selectedAccount);
  }

  const balanceOfAsset = balancesForAccount?.[asset];
  if (!balanceOfAsset) {
    console.warn('Could not find balance for asset:', asset);
  }

  return balanceOfAsset?.amount ?? 0;
}
// This selector is not compatible with `useMultichainSelector` since it uses the selected
// account implicitly!

export function getMultichainSelectedAccountCachedBalance(
  state: MultichainState,
) {
  return getMultichainIsEvm(state)
    ? getSelectedAccountCachedBalance(state)
    : getNonEvmCachedBalance(state);
}
