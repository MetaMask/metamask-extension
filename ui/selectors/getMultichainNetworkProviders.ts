import {
  MultichainProviderConfig,
  MULTICHAIN_PROVIDER_CONFIGS,
} from '../../shared/constants/multichain/networks';
import { MultichainState } from './multichain';

export function getMultichainNetworkProviders(
  _state: MultichainState,
): MultichainProviderConfig[] {
  // TODO: need state from the ChainController?
  return Object.values(MULTICHAIN_PROVIDER_CONFIGS);
}
