import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { Hex } from '@metamask/utils';

import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../../../../shared/constants/network';
import { getAssetsBySelectedAccountGroup } from '../../../../selectors/assets';
import { AssetStandard, type Asset } from '../../types/send';
import { useChainNetworkNameAndImageMap } from '../useChainNetworkNameAndImage';

export const useSendTokens = (): Asset[] => {
  const chainNetworkNAmeAndImageMap = useChainNetworkNameAndImageMap();
  const assets = useSelector(getAssetsBySelectedAccountGroup);

  const flatAssets = useMemo(() => Object.values(assets).flat(), [assets]);

  const assetsWithBalance = useMemo(() => {
    return flatAssets.filter((asset) => {
      const haveBalance = asset.rawBalance !== '0x0';
      return haveBalance;
    });
  }, [flatAssets]);

  const processedAssets = useMemo(() => {
    return assetsWithBalance.map((asset) => {
      const chainNetworkNameAndImage = chainNetworkNAmeAndImageMap.get(
        asset.chainId as Hex,
      );

      let imageSource: string | undefined;
      if (asset.isNative) {
        // Try chain-specific token image first, then fall back to network image
        imageSource =
          CHAIN_ID_TOKEN_IMAGE_MAP[
            asset.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
          ] ?? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[asset.chainId as Hex];
      } else {
        imageSource = asset.image;
      }

      return {
        ...asset,
        image: imageSource,
        networkImage: chainNetworkNameAndImage?.networkImage,
        networkName: chainNetworkNameAndImage?.networkName,
        shortenedBalance: asset.balance,
        standard: asset.isNative ? AssetStandard.Native : AssetStandard.ERC20,
      };
    });
  }, [assetsWithBalance, chainNetworkNAmeAndImageMap]);

  return useMemo(() => {
    return processedAssets.sort(
      (a, b) => (b.fiat?.balance ?? 0) - (a.fiat?.balance ?? 0),
    );
  }, [processedAssets]);
};
