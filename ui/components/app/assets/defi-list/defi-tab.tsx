import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AssetListProps } from '../asset-list/asset-list';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { selectEnabledNetworksAsCaipChainIds } from '../../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import DefiList from './defi-list';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DeFiTab({ onClickAsset }: AssetListProps) {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const networkFilter = useSelector(selectEnabledNetworksAsCaipChainIds);

  const hasTrackedDeFiScreenViewedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedDeFiScreenViewedRef.current) {
      return;
    }
    hasTrackedDeFiScreenViewedRef.current = true;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.DeFiScreenViewed)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          network_filter: networkFilter,
        })
        .build(),
    );
  }, [trackEvent, createEventBuilder, networkFilter]);

  return (
    <>
      <AssetListControlBar showImportTokenButton={false} />
      <DefiList onClick={onClickAsset} />
    </>
  );
}
