import React from 'react';
import { Box } from '@metamask/design-system-react';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { QuotesListItem } from './quotes-list-item';

type QuotesListProps = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  isLoading: boolean;
  canDeleteAssets: boolean;
  onAssetDeleteClick: (asset: BatchSellAsset) => void;
  onSlippagePercentChangeClick: (asset: BatchSellAsset) => void;
  onSendAmountPercentChange: (
    asset: BatchSellAsset,
    newSendAmountPercent: number,
  ) => void;
};

export const QuotesList = ({
  sendAssetsConfig,
  onSlippagePercentChangeClick,
  onSendAmountPercentChange,
  onAssetDeleteClick,
  canDeleteAssets,
  quotes,
  isLoading,
}: QuotesListProps) => {
  return (
    <Box className="flex-1">
      {Object.values(sendAssetsConfig).map(({ asset, sendAmountPercent }) => (
        <QuotesListItem
          key={asset.assetId}
          asset={asset}
          quote={quotes?.[asset.assetId]}
          isLoading={isLoading}
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
