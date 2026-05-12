import { CaipAssetType } from '@metamask/utils';
import React from 'react';
import { Box } from '@metamask/design-system-react';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { QuotesListItem } from './QuotesListItem';

type QuotesListProps = {
  config: {
    [assetId: CaipAssetType]: {
      asset: BatchSellAsset;
      sendAmountPercent: number;
      slippagePercent: number;
    };
  };
  canDeleteAssets: boolean;
  onAssetDeleteClick: (asset: BatchSellAsset) => void;
  onSlippagePercentChangeClick: (asset: BatchSellAsset) => void;
  onSendAmountPercentChange: (
    asset: BatchSellAsset,
    newSendAmountPercent: number,
  ) => void;
};

export const QuotesList = ({
  config,
  onSlippagePercentChangeClick,
  onSendAmountPercentChange,
  onAssetDeleteClick,
  canDeleteAssets,
}: QuotesListProps) => {
  return (
    <Box className="flex-1">
      {Object.values(config).map(({ asset, sendAmountPercent }) => (
        <QuotesListItem
          key={asset.assetId}
          asset={asset}
          canDeleteAssets={canDeleteAssets}
          sendAmountPercent={sendAmountPercent}
          onSlippagePercentChangeClick={onSlippagePercentChangeClick}
          onSendAmountPercentChange={onSendAmountPercentChange}
          onAssetDeleteClick={onAssetDeleteClick}
        />
      ))}
    </Box>
  );
};
