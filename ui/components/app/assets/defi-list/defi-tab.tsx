import React from 'react';
import { AssetListProps } from '../asset-list/asset-list';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import DefiList from './defi-list';

export default function DeFiTab({ onClickAsset }: AssetListProps) {
  return (
    <>
      <AssetListControlBar showImportTokenButton={false} />
      <DefiList onClick={onClickAsset} />
    </>
  );
}
