import { CaipChainId, isCaipChainId, Hex } from '@metamask/utils';
import { TrxScope } from '@metamask/keyring-api';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../shared/constants/multichain/networks';

export function getImageForChainId(chainId: string): string | undefined {
  return {
    ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
    ...MULTICHAIN_TOKEN_IMAGE_MAP,
  }[chainId];
}

export const isTronChainId = (chainId: Hex | number | CaipChainId | string) => {
  return (
    isCaipChainId(chainId) &&
    [`${TrxScope.Mainnet}`, `${TrxScope.Nile}`, `${TrxScope.Shasta}`].includes(
      chainId,
    )
  );
};
