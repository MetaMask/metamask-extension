import { InternalAccount } from '@metamask/keyring-internal-api';
import { getMultichainProviderConfig } from './multichain-provider-config';
import { MultichainState } from './multichain.types';

export function getMultichainCurrentNetwork(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainProviderConfig(state, account);
}
