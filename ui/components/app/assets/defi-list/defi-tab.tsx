import React from 'react';
import { useSelector } from 'react-redux';
import { getIsDefiControllerV2Enabled } from '../../../../selectors/defi-controller-v2/feature-flags';
import { AssetListProps } from '../asset-list/asset-list';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import DefiList from './defi-list';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function DeFiTab({ onClickAsset }: AssetListProps) {
  const isDefiControllerV2Enabled = useSelector(getIsDefiControllerV2Enabled);
  const DefiListComponent = isDefiControllerV2Enabled ? DefiList : DefiList;

  return (
    <>
      <AssetListControlBar showImportTokenButton={false} />
      <DefiListComponent onClick={onClickAsset} />
    </>
  );
}
