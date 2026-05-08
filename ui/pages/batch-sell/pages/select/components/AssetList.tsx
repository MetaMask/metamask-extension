import React from 'react';
import { Box } from '@metamask/design-system-react';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { AssetListItem } from './AssetListItem';

type AssetListProps = {
  selectedAssetsId: string[];
  assets: BatchSellAsset[];
  onSelect: (asset: BatchSellAsset) => void;
  onDeselect: (asset: BatchSellAsset) => void;
};

export const AssetList = ({
  selectedAssetsId,
  assets,
  onSelect,
  onDeselect,
}: AssetListProps) => {
  return (
    <Box className="flex-1" data-testid="batch-sell-select-asset-list">
      {assets.map((asset) => (
        <AssetListItem
          key={asset.assetId}
          asset={asset}
          selected={selectedAssetsId.includes(asset.assetId)}
          onSelect={onSelect}
          onDeselect={onDeselect}
        />
      ))}
    </Box>
  );
};
