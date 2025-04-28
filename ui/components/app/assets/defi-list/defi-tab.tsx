import React from 'react';
import { AssetListProps } from '../asset-list/asset-list';
import AssetListControlBar from '../asset-list/asset-list-control-bar';
import DefiList from './defi-list';

const DeFiTab = ({ onClickAsset }: AssetListProps) => {
  return (
    <>
      <AssetListControlBar showImportTokenButton={false} />
      <DefiList onClick={onClickAsset} />
    </>
  );
};

export default DeFiTab;
