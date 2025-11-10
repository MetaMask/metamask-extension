import { CaipChainId, isCaipChainId, Hex } from '@metamask/utils';
import { TrxScope } from '@metamask/keyring-api';
import { ChainId } from '@metamask/bridge-controller';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../shared/constants/multichain/networks';

export function getImageForChainId(chainId: string): string | undefined {
  return {
    ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
    ...MULTICHAIN_TOKEN_IMAGE_MAP,
  }[chainId];
}

// TODO: Import isTronChainId from @metamask/bridge-controller once it's exported from the main entry point
export const isTronChainId = (chainId: Hex | number | CaipChainId | string) => {
  if (isCaipChainId(chainId)) {
    return chainId === TrxScope.Mainnet.toString();
  }
  return chainId.toString() === ChainId.TRON.toString();
};
