import { CaipAssetType } from '@metamask/utils';
import React from 'react';
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
  onSlippageChange: (asset: BatchSellAsset, newSlippage: number) => void;
  onSendAmountChange: (asset: BatchSellAsset, newAmount: number) => void;
};

export const QuotesList = ({
  config,
  onSendAmountChange,
  onSlippageChange,
}: QuotesListProps) => {
  return (
    <>
      {Object.values(config).map(
        ({ asset, sendAmountPercent, slippagePercent }) => (
          <QuotesListItem
            key={asset.assetId}
            asset={asset}
            sendAmountPercent={sendAmountPercent}
            slippagePercent={slippagePercent}
            onSlippageChange={onSlippageChange}
            onSendAmountChange={onSendAmountChange}
          />
        ),
      )}
    </>
  );
};
