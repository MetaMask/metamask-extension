import { useCallback, useContext } from 'react';

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
import { useSendType } from '../useSendType';

const ASSET_TYPE = {
  NFT: 'nft',
  NATIVE: 'native',
  TOKEN: 'token',
};

export const useAssetSelectionMetrics = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const {
    accountType,
    assetFilterMethod,
    assetListSize,
    setAssetFilterMethod,
    setAssetListSize,
  } = useSendMetricsContext();
  const { isEvmSendType } = useSendType();

  const setSearchAssetFilterMethod = useCallback(() => {
    setAssetFilterMethod(AssetFilterMethod.Search);
  }, [setAssetFilterMethod]);

  const setNoneAssetFilterMethod = useCallback(() => {
    setAssetFilterMethod(AssetFilterMethod.None);
  }, [setAssetFilterMethod]);

  const captureAssetSelected = useCallback(
    (sendAsset: Asset, position: string) => {
      let assetType = ASSET_TYPE.TOKEN;
      if (sendAsset?.tokenId) {
        assetType = ASSET_TYPE.NFT;
      } else if ('isNative' in sendAsset && sendAsset?.isNative) {
        assetType = ASSET_TYPE.NATIVE;
      }
      trackEvent({
        event: MetaMetricsEventName.SendAssetSelected,
        category: MetaMetricsEventCategory.Send,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_type: assetType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_list_position: position,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_list_size: assetListSize,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: isEvmSendType ? sendAsset?.chainId : undefined,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id_caip: isEvmSendType ? undefined : sendAsset?.chainId,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          filter_method: assetFilterMethod,
        },
      });
    },
    [accountType, assetFilterMethod, assetListSize, isEvmSendType, trackEvent],
  );

  return {
    captureAssetSelected,
    setAssetListSize,
    setNoneAssetFilterMethod,
    setSearchAssetFilterMethod,
  };
};
