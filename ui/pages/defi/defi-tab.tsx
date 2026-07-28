import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getIsDefiControllerV2Enabled } from '../../selectors/defi-controller-v2/feature-flags';
import { RouteWithMessenger } from '../../layouts/route-with-messenger';
import { AssetListProps } from '../../components/app/assets/asset-list/asset-list';
import AssetListControlBar from '../../components/app/assets/asset-list/asset-list-control-bar';
import { useScreenViewedEvent } from '../../hooks/useScreenViewedEvent';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import DefiList from '../../components/app/assets/defi-list/defi-list';
import { useDeFiPositionsV2 } from './hooks/useDeFiPositionsV2';
import { DEFI_ROUTE_ALLOWED_CAPABILITIES } from './messenger';
import DefiListV2 from './components/defi-list-v2';

type DeFiTabContentProps = Readonly<AssetListProps> & {
  isDefiControllerV2Enabled: boolean;
};

/**
 * Inner content that must run under {@link RouteWithMessenger} so it can call
 * `DeFiPositionsControllerV2:fetchDeFiPositions` via the route messenger.
 *
 * @param props - Component props.
 * @param props.onClickAsset - Handler when an asset row is clicked.
 * @param props.isDefiControllerV2Enabled - Whether to render the V2 list.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function DeFiTabContent({
  onClickAsset,
  isDefiControllerV2Enabled,
}: DeFiTabContentProps) {
  const { positions, isLoading, isError, refresh } = useDeFiPositionsV2({
    enabled: isDefiControllerV2Enabled,
  });

  const handleRefresh = useCallback(() => {
    refresh().catch(() => {
      // Fire-and-forget: errors surface via isError / the list's error UI.
    });
  }, [refresh]);

  return (
    <>
      <AssetListControlBar
        showImportTokenButton={false}
        onRefresh={handleRefresh}
      />
      {isDefiControllerV2Enabled ? (
        <DefiListV2
          onClick={onClickAsset}
          positions={positions}
          isLoading={isLoading}
          isError={isError}
        />
      ) : (
        <DefiList onClick={onClickAsset} />
      )}
    </>
  );
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
 
export default function DeFiTab({
  onClickAsset,
  entryPoint,
}: Readonly<AssetListProps>) {
  useScreenViewedEvent(MetaMetricsEventName.DeFiScreenViewed, entryPoint);
  const isDefiControllerV2Enabled = useSelector(getIsDefiControllerV2Enabled);

  return (
    <RouteWithMessenger
      path="defi-tab"
      capabilities={DEFI_ROUTE_ALLOWED_CAPABILITIES}
    >
      <DeFiTabContent
        onClickAsset={onClickAsset}
        isDefiControllerV2Enabled={isDefiControllerV2Enabled}
      />
    </RouteWithMessenger>
  );
}
