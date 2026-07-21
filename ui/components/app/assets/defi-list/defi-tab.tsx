import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getIsDefiControllerV2Enabled } from '../../../../selectors/defi-controller-v2/feature-flags';
import { fetchDeFiPositions } from '../../../../hooks/defi/defiActions';
import { AssetListProps } from '../asset-list/asset-list';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import DefiList from './defi-list';
import DefiListV2 from './defi-list-v2';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DeFiTab({ onClickAsset }: AssetListProps) {
  const isDefiControllerV2Enabled = useSelector(getIsDefiControllerV2Enabled);

  const handleRefresh = useCallback(() => {
    fetchDeFiPositions({ forceRefresh: true }).catch(() => {
      // Fire-and-forget: the UI reads positions from state. Errors surface via
      // controller state / the list's existing error UI on the next fetch cycle.
    });
  }, []);

  return (
    <>
      <AssetListControlBar
        showImportTokenButton={false}
        onRefresh={handleRefresh}
      />
      {isDefiControllerV2Enabled ? (
        <DefiListV2 onClick={onClickAsset} />
      ) : (
        <DefiList onClick={onClickAsset} />
      )}
    </>
  );
}
