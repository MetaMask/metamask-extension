import { InternalAccount } from '@metamask/keyring-internal-api';
import { getMultichainProviderConfig } from './getMultichainProviderConfig';
import { MultichainState } from './multichain.types';

export function getMultichainCurrentNetwork(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainProviderConfig(state, account);
}
