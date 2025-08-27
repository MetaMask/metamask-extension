import { Hex } from '@metamask/utils';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import useMultiChainAssets from '../../../../components/app/assets/hooks/useMultichainAssets';
import { getAllTokens } from '../../../../selectors';
import { Asset } from '../../types/send';
import { SendPages } from '../../constants/send';
import { useSendContext } from '../../context/send';

export const getAssetFromList = (
  evmTokens: Record<Hex, Record<Hex, Asset[]>>,
  address: Hex,
) => {
  let asset;
  Object.entries(evmTokens).forEach(
    ([chainId, assetsObj]: [string, Record<Hex, Asset[]>]) => {
      return Object.values(assetsObj).forEach((assets) => {
        const filteredAsset = assets.find((ast) => ast.address === address);
        if (filteredAsset) {
          asset = { ...filteredAsset, chainId };
        }
      });
    },
  );
  return asset;
};

export const useSendQueryParams = () => {
  const {
    asset: existingAsset,
    updateCurrentPage,
    updateAsset,
  } = useSendContext();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const multiChainAssets = useMultiChainAssets();
  const evmTokens: Record<Hex, Record<Hex, Asset[]>> = useSelector(
    getAllTokens,
  );

  const address = searchParams.get('address');
  const chainId = searchParams.get('chainId');
  const tokenId = searchParams.get('tokenId');

  useEffect(() => {
    const subPath = pathname.split('/').filter(Boolean)[1];
    updateCurrentPage((subPath as SendPages) ?? SendPages.ASSET);
  }, [pathname, updateCurrentPage]);

  useEffect(() => {
    if (existingAsset) {
      return;
    }
    let asset;
    if (address) {
      if (isEvmAddress(address)) {
        asset = getAssetFromList(evmTokens, address as Hex);
      } else {
        asset = multiChainAssets.find(
          ({ address: assetAddress }) => assetAddress === address,
        );
      }
    } else if (chainId) {
      asset = { ...getNativeAssetForChainId(chainId), chainId };
    }
    if (asset) {
      updateAsset(asset);
    }
  }, [
    address,
    chainId,
    // using only multiChainAssets as dependency causes infinite loading
    multiChainAssets?.length,
    evmTokens,
    tokenId,
    updateAsset,
  ]);
};
