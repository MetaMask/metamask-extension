import React from 'react';
import { Box } from '@metamask/design-system-react';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { QuotesListItem } from './quotes-list-item';

type QuotesListProps = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
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
}: QuotesListProps) => {
  return (
    <Box className="flex-1">
      {Object.values(sendAssetsConfig).map(
        ({ asset, sendAmountPercent, enabled }) => (
          <QuotesListItem
            key={asset.assetId}
            enabled={enabled}
            asset={asset}
            quote={quotes?.[asset.assetId]}
            canDeleteAssets={canDeleteAssets}
            sendAmountPercent={sendAmountPercent}
            onSlippagePercentChangeClick={onSlippagePercentChangeClick}
            onSendAmountPercentChange={onSendAmountPercentChange}
            onAssetDeleteClick={onAssetDeleteClick}
          />
        ),
      )}
    </Box>
  );
};
