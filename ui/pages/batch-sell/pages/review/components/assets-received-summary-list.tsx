import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { formatTokenAmount } from '../../../../bridge/utils/quote';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';

type AssetsReceivedSummaryListProps = {
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'];
  quotes?: BatchSellQuotesResults['quotes'];
  receivedAsset: {
    symbol: string;
  };
};

type SendAssetConfig =
  BatchSellQuotesConfig['sendAssetsConfig'][keyof BatchSellQuotesConfig['sendAssetsConfig']];

type Quote =
  BatchSellQuotesResults['quotes'][keyof BatchSellQuotesResults['quotes']];

type AssetsReceivedListItemProps = {
  asset: SendAssetConfig['asset'];
  slippagePercent: SendAssetConfig['slippagePercent'];
  receivedAsset: AssetsReceivedSummaryListProps['receivedAsset'];
  quote: Quote | undefined;
};

const AssetsReceivedListItem = ({
  asset,
  slippagePercent,
  receivedAsset,
  quote,
}: AssetsReceivedListItemProps) => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  if (quote && !quote.isLoadingQuote && !quote.hasQuote) {
    return null;
  }

  return (
    <Box
      padding={2}
      flexDirection={BoxFlexDirection.Row}
      gap={2}
      alignItems={BoxAlignItems.Center}
    >
      <Box className="flex-1">
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          <span className="inline-block whitespace-nowrap">
            {asset.symbol} •
          </span>{' '}
          <span className="inline-block whitespace-nowrap">
            {slippagePercent}%{' '}
            <span className="lowercase">{t('slippage')}</span>
          </span>
        </Text>
      </Box>
      <Box>
        <Skeleton isLoading={!quote || quote?.isLoadingQuote} width={80}>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {formatTokenAmount(
              locale,
              (quote?.receivedAmount ?? 0).toString(),
              receivedAsset.symbol,
              BigNumber.ROUND_DOWN,
            )}
          </Text>
        </Skeleton>
      </Box>
    </Box>
  );
};

export const AssetsReceivedSummaryList = ({
  receivedAsset,
  sendAssetsConfig,
  quotes,
}: AssetsReceivedSummaryListProps) => {
  return (
    <>
      {Object.values(sendAssetsConfig)
        .filter(({ enabled }) => enabled)
        .map(({ asset, slippagePercent }) => (
          <AssetsReceivedListItem
            key={asset.assetId}
            asset={asset}
            quote={quotes?.[asset.assetId]}
            slippagePercent={slippagePercent}
            receivedAsset={receivedAsset}
          />
        ))}
    </>
  );
};
