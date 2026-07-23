import React from 'react';
import { AssetListProps } from '../asset-list/asset-list';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import { useScreenViewedEvent } from '../../../../hooks/useScreenViewedEvent';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import DefiList from './defi-list';

export default function DeFiTab({
  onClickAsset,
  entryPoint,
}: Readonly<AssetListProps>) {
  useScreenViewedEvent(MetaMetricsEventName.DeFiScreenViewed, entryPoint);

  return (
    <>
      <AssetListControlBar showImportTokenButton={false} />
      <DefiList onClick={onClickAsset} />
    </>
  );
}
