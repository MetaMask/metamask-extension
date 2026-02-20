import { CaipChainId, isCaipChainId, Hex } from '@metamask/utils';
import { TrxScope } from '@metamask/keyring-api';

export { getImageForChainId } from '../../../helpers/utils/get-image-for-chain-id';

export const isTronChainId = (chainId: Hex | number | CaipChainId | string) => {
  return (
    isCaipChainId(chainId) &&
    [`${TrxScope.Mainnet}`, `${TrxScope.Nile}`, `${TrxScope.Shasta}`].includes(
      chainId,
    )
  );
};
