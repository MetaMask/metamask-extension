import React from 'react';
import { Box } from '@metamask/design-system-react';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';

type QuotesListItemProps = {
  asset: BatchSellAsset;
  sendAmountPercent: number;
  slippagePercent: number;
  onSlippageChange: (asset: BatchSellAsset, newSlippage: number) => void;
  onSendAmountChange: (asset: BatchSellAsset, newAmount: number) => void;
};

export const QuotesListItem = ({
  asset,
  sendAmountPercent,
  slippagePercent,
  onSendAmountChange,
  onSlippageChange,
}: QuotesListItemProps) => {
  return <Box>{asset.assetId}</Box>;
};
