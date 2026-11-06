import React from 'react';
import { useSelector } from 'react-redux';
import { IconName } from '@metamask/design-system-react';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { getIsDefiControllerV2Enabled } from '../../../selectors/defi-controller-v2/feature-flags';
import { RouteMessengerProvider } from '../../../contexts/route-messenger';
import { AssetListProps } from '../../../components/app/assets/asset-list/asset-list';
import AssetListControlBar from '../../../components/app/assets/asset-list/asset-list-control-bar';
import { useScreenViewedEvent } from '../../../hooks/useScreenViewedEvent';
import DefiList from '../../../components/app/assets/defi-list/defi-list';
import { useDefiPositionsList } from '../../../components/app/assets/defi-list/useDefiPositionsList';
import { OverflowMenu } from '#ui/components/ui/overflow-menu/overflow-menu';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useDeFiListItemsV2 } from '../hooks/useDeFiListItemsV2';
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
  const t = useI18nContext();
  const { positions, isLoading, isError, refresh } = useDeFiPositionsV2();
  const listItems = useDeFiListItemsV2({ positions, isLoading, isError });
  const isEmpty = listItems?.length === 0;

  return (
    <>
      <AssetListControlBar
        showSortControl={!isEmpty}
        actionMenu={
          <OverflowMenu
            ariaLabel={t('assetOptions')}
            items={[
              {
                key: 'refresh-list',
                label: t('refreshList'),
                iconName: IconName.Refresh,
                onClick: refresh,
              },
            ]}
            testId="asset-list-control-bar-action-button"
          />
        }
        data-testid="parent-selector-defi-tab"
      />
      <DefiListV2 items={listItems} onClick={onClickAsset} />
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
  const positions = useDefiPositionsList();
  const isEmpty = positions?.length === 0;

  return (
    <>
      <AssetListControlBar
        showSortControl={!isEmpty}
        data-testid="parent-selector-defi-tab"
      />
      <DefiList items={positions} onClick={onClickAsset} />
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
