import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getIsDefiControllerV2Enabled } from '../../../selectors/defi-controller-v2/feature-flags';
import { RouteMessengerProvider } from '../../../contexts/route-messenger';
import { AssetListProps } from '../../../components/app/assets/asset-list/asset-list';
import AssetListControlBar from '../../../components/app/assets/asset-list/asset-list-control-bar';
import { useScreenViewedEvent } from '../../../hooks/useScreenViewedEvent';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import DefiList from '../../../components/app/assets/defi-list/defi-list';
import { useDeFiPositionsV2 } from '../hooks/useDeFiPositionsV2';
import { DEFI_ROUTE_ALLOWED_CAPABILITIES } from '../messenger';
import DefiListV2 from './defi-list-v2';

/**
 * V2 DeFi tab content. Mounts only when the V2 controller flag is enabled so
 * `useDeFiPositionsV2` always runs (no legacy `enabled` gate in the hook).
 *
 * Must run under {@link RouteMessengerProvider} so it can call
 * `DeFiPositionsControllerV2:fetchDeFiPositions` via the route messenger.
 *
 * @param props - Component props.
 * @param props.onClickAsset - Handler when an asset row is clicked.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function DeFiTabContentV2({ onClickAsset }: Readonly<AssetListProps>) {
  const { positions, isLoading, isError, refresh } = useDeFiPositionsV2();

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
      <DefiListV2
        onClick={onClickAsset}
        positions={positions}
        isLoading={isLoading}
        isError={isError}
      />
    </>
  );
}

/**
 * Legacy (V1) DeFi tab content. No refresh control — V1 positions are polled
 * by the background controller, not user-initiated.
 *
 * @param props - Component props.
 * @param props.onClickAsset - Handler when an asset row is clicked.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function DeFiTabContentV1({ onClickAsset }: Readonly<AssetListProps>) {
  return (
    <>
      <AssetListControlBar showImportTokenButton={false} />
      <DefiList onClick={onClickAsset} />
    </>
  );
}

export default function DeFiTab({
  onClickAsset,
  entryPoint,
}: Readonly<AssetListProps>) {
  useScreenViewedEvent(MetaMetricsEventName.DeFiScreenViewed, entryPoint);
  const isDefiControllerV2Enabled = useSelector(getIsDefiControllerV2Enabled);

  // V2 needs a route messenger for `fetchDeFiPositions`. Legacy V1 does not —
  // wrap only the V2 branch so integration tests (and other trees without a
  // UI messenger) keep working when the V2 flag is off.
  if (isDefiControllerV2Enabled) {
    return (
      <RouteMessengerProvider
        path="defi-tab"
        capabilities={DEFI_ROUTE_ALLOWED_CAPABILITIES}
      >
        <DeFiTabContentV2 onClickAsset={onClickAsset} />
      </RouteMessengerProvider>
    );
  }

  return <DeFiTabContentV1 onClickAsset={onClickAsset} />;
}
