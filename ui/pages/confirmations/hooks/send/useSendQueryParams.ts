import { useEffect } from 'react';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { useLocation, useSearchParams } from 'react-router-dom-v5-compat';

import useMultiChainAssets from '../../../../components/app/assets/hooks/useMultichainAssets';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { SendPages } from '../../constants/send';
import { memoizedGetTokenStandardAndDetails } from '../../utils/token';
import { useSendContext } from '../../context/send';

export const useSendQueryParams = () => {
  const { updateCurrentPage, updateAsset } = useSendContext();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const multiChainAssets = useMultiChainAssets();

  const address = searchParams.get('address');
  const chainId = searchParams.get('chainId');
  const tokenId = searchParams.get('tokenId');

  useEffect(() => {
    const subPath = pathname.split('/').filter(Boolean)[1];
    updateCurrentPage((subPath as SendPages) ?? SendPages.ASSET);
  }, [pathname, updateCurrentPage]);

  useAsyncResult(async () => {
    let asset;
    if (address) {
      asset = multiChainAssets.find(
        ({ address: assetAddress }) => assetAddress === address,
      );
      if (!asset) {
        asset = await memoizedGetTokenStandardAndDetails(
          address,
          undefined,
          tokenId ?? undefined,
        );
      }
    } else if (chainId) {
      asset = getNativeAssetForChainId(chainId);
    }
    if (asset) {
      updateAsset(asset);
    }
    return asset;
    // using only multiChainAssets as dependency causes infinite loading
  }, [address, chainId, multiChainAssets?.length, tokenId, updateAsset]);
};
