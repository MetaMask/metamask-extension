import React from 'react';
import AssetListControlBar from '../asset-list/import-control';
import { AssetListProps } from '../asset-list/asset-list';
import DefiList from './defi-list';

const DeFiTab = ({ onClickAsset }: AssetListProps) => {
  console.log('DeFiTab', { onClickAsset });
  return (
    <>
      <AssetListControlBar showTokensLinks={true} />
      <DefiList onClick={onClickAsset} />
    </>
  );
};

export default DeFiTab;
