import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getIsDefiControllerV2Enabled } from '../../../../selectors/defi-controller-v2/feature-flags';
import { AssetListProps } from '../asset-list/asset-list';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import { useScreenViewedEvent } from '../../../../hooks/useScreenViewedEvent';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import DefiList from './defi-list';
import DefiListV2 from './defi-list-v2';
import { useDeFiPositionsV2 } from './hooks/useDeFiPositionsV2';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DeFiTab({
  onClickAsset,
  entryPoint,
}: Readonly<AssetListProps>) {
  useScreenViewedEvent(MetaMetricsEventName.DeFiScreenViewed, entryPoint);
  const isDefiControllerV2Enabled = useSelector(getIsDefiControllerV2Enabled);
  // Shares the same TanStack query as DefiListV2 / details — used here for refresh.
  const { refresh } = useDeFiPositionsV2();

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {
      // Fire-and-forget: list error UI comes from the shared query status.
    });
  }, [refresh]);

  return (
    <>
      <AssetListControlBar
        showImportTokenButton={false}
        onRefresh={isDefiControllerV2Enabled ? handleRefresh : undefined}
      />
      {isDefiControllerV2Enabled ? (
        <DefiListV2 onClick={onClickAsset} />
      ) : (
        <DefiList onClick={onClickAsset} />
      )}
    </>
  );
}
