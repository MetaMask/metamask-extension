import { useEffect } from 'react';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { useLocation, useSearchParams } from 'react-router-dom-v5-compat';

import { getTokenStandardAndDetails } from '../../../../store/actions';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { SendPages } from '../../constants/send';
import { useSendContext } from '../../context/send';

export const useSendQueryParams = () => {
  const { updateCurrentPage, updateAsset } = useSendContext();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const chainId = searchParams.get('chainId');
  const address = searchParams.get('address');
  const tokenId = searchParams.get('tokenId');

  useEffect(() => {
    const subPath = pathname.split('/').filter(Boolean)[1];
    updateCurrentPage((subPath as SendPages) ?? SendPages.ASSET);
  }, [pathname, updateCurrentPage]);

  useAsyncResult(async () => {
    let asset;
    if (address) {
      asset = await getTokenStandardAndDetails(
        address,
        undefined,
        tokenId ?? undefined,
      );
    } else if (chainId) {
      asset = getNativeAssetForChainId(chainId);
    }
    if (asset) {
      updateAsset(asset);
    }
    return asset;
  }, [address, chainId, tokenId, updateAsset]);
};
