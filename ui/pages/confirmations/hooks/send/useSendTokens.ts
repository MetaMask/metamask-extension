import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { Hex } from '@metamask/utils';

import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../../shared/constants/network';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';
import { getAssetsBySelectedAccountGroup } from '../../../../selectors/assets';
import { AssetStandard, type Asset } from '../../types/send';
import { useChainNetworkNameAndImageMap } from '../useChainNetworkNameAndImage';

export const useSendTokens = (): Asset[] => {
  const chainNetworkNAmeAndImageMap = useChainNetworkNameAndImageMap();
  const assets = useSelector(getAssetsBySelectedAccountGroup);
  const formatter = useFiatFormatter();

  const flatAssets = useMemo(() => Object.values(assets).flat(), [assets]);

  const assetsWithBalance = useMemo(() => {
    return flatAssets.filter((asset) => {
      const haveBalance = asset.fiat?.balance && asset.fiat?.balance > 0;
      const isTestNetAsset =
        isTestNet(asset.chainId) && asset.rawBalance !== '0x0';
      return haveBalance || isTestNetAsset;
    });
  }, [flatAssets]);

  const processedAssets = useMemo(() => {
    return assetsWithBalance.map((asset) => {
      const fiatBalance = asset.fiat?.balance || 0;
      const fiatCurrency = asset.fiat?.currency;
      const chainNetworkNameAndImage = chainNetworkNAmeAndImageMap.get(
        asset.chainId as Hex,
      );
      const imageSource = asset.isNative
        ? (CHAIN_ID_TOKEN_IMAGE_MAP[
            asset.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
            // This fallback is for Solana
          ] ?? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[asset.chainId as Hex])
        : asset.image;

      let balanceInSelectedCurrency: string;
      try {
        balanceInSelectedCurrency = formatter(fiatBalance, {
          shorten: true,
        });
      } catch (error) {
        balanceInSelectedCurrency = `${fiatBalance.toFixed()} ${fiatCurrency}`;
      }
      return {
        ...asset,
        balanceInSelectedCurrency,
        image: imageSource,
        networkImage: chainNetworkNameAndImage?.networkImage,
        networkName: chainNetworkNameAndImage?.networkName,
        shortenedBalance: asset.balance,
        standard: asset.isNative ? AssetStandard.Native : AssetStandard.ERC20,
      };
    });
  }, [assetsWithBalance, chainNetworkNAmeAndImageMap, formatter]);

  return useMemo(() => {
    return processedAssets.sort(
      (a, b) => (b.fiat?.balance ?? 0) - (a.fiat?.balance ?? 0),
    );
  }, [processedAssets]);
};

function isTestNet(chainId: string) {
  return TEST_CHAINS.includes(chainId as Hex);
}
