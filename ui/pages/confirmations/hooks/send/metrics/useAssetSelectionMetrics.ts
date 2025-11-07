/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback, useContext } from 'react';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  AssetFilterMethod,
  useSendMetricsContext,
} from '../../../context/send-metrics';
import { Asset } from '../../../types/send';
import { useSendAssets } from '../useSendAssets';

const ASSET_TYPE = {
  NFT: 'nft',
  NATIVE: 'native',
  TOKEN: 'token',
};

export const useAssetSelectionMetrics = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const { tokens, nfts } = useSendAssets();
  const {
    accountType,
    assetFilterMethod,
    assetListSize,
    setAssetFilterMethod,
    setAssetListSize,
  } = useSendMetricsContext();

  const addAssetFilterMethod = useCallback(
    (filterMethod: string) => {
      const methods = new Set([...assetFilterMethod, filterMethod]);
      const methodsArray = Array.from(methods).filter(
        (method) => method !== AssetFilterMethod.None,
      );
      setAssetFilterMethod(methodsArray);
    },
    [setAssetFilterMethod, assetFilterMethod],
  );

  const removeAssetFilterMethod = useCallback(
    (filterMethod: string) => {
      const methodsArray = assetFilterMethod.filter(
        (method) => method !== filterMethod,
      );

      if (methodsArray.length === 0) {
        methodsArray.push(AssetFilterMethod.None);
      }

      setAssetFilterMethod(methodsArray);
    },
    [setAssetFilterMethod, assetFilterMethod],
  );

  const captureAssetSelected = useCallback(
    (sendAsset: Asset) => {
      let assetType = ASSET_TYPE.TOKEN;
      if (sendAsset?.tokenId) {
        assetType = ASSET_TYPE.NFT;
      } else if ('isNative' in sendAsset && sendAsset?.isNative) {
        assetType = ASSET_TYPE.NATIVE;
      }

      const tokenAddress = sendAsset?.address || sendAsset?.assetId;
      const isEvmSend = isEvmAddress(tokenAddress as string);

      const allAssets = [...tokens, ...nfts];
      const position =
        allAssets.findIndex((asset) => {
          if (sendAsset.tokenId) {
            // NFT comparison: address + chainId + tokenId
            return (
              asset.address === sendAsset.address &&
              asset.chainId === sendAsset.chainId &&
              asset.tokenId === sendAsset.tokenId
            );
          } else if (sendAsset.isNative) {
            // Native token comparison: isNative + chainId
            return (
              asset.isNative === sendAsset.isNative &&
              asset.chainId === sendAsset.chainId
            );
          }
          // ERC20 token comparison: address + chainId
          return (
            asset.address === sendAsset.address &&
            asset.chainId === sendAsset.chainId
          );
        }) + 1;

      trackEvent(
        {
          event: MetaMetricsEventName.SendAssetSelected,
          category: MetaMetricsEventCategory.Send,
          properties: {
            account_type: accountType,
            asset_type: assetType,
            asset_list_position: position,
            asset_list_size: assetListSize,
            chain_id: sendAsset?.chainId,
            chain_id_caip: isEvmSend
              ? `eip155:${parseInt(sendAsset?.chainId as string, 16)}`
              : sendAsset?.chainId,
            filter_method: assetFilterMethod,
          },
        },
        {
          excludeMetaMetricsId: false,
        },
      );
    },
    [accountType, assetFilterMethod, assetListSize, trackEvent, tokens, nfts],
  );

  return {
    addAssetFilterMethod,
    captureAssetSelected,
    removeAssetFilterMethod,
    setAssetListSize,
  };
};
