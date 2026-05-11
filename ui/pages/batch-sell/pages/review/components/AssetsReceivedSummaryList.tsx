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
import { formatTokenAmount } from '../../../../bridge/utils/quote';
import { getIntlLocale } from '../../../../../ducks/locale/locale';

type AssetsReceivedSummaryList = {
  sendAssets: {
    id: string;
    symbol: string;
    slippagePercent: number;
    receivedAmount: number;
  }[];
  receivedAsset: {
    symbol: string;
  };
};

type AssetsReceivedListItemProps = AssetsReceivedSummaryList['sendAssets'][0] &
  Pick<AssetsReceivedSummaryList, 'receivedAsset'>;

const AssetsReceivedListItem = ({
  symbol,
  slippagePercent,
  receivedAmount,
  receivedAsset,
}: AssetsReceivedListItemProps) => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  const percentage = String(slippagePercent / 100);

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
          <span className="inline-block whitespace-nowrap">{symbol} •</span>{' '}
          <span className="inline-block whitespace-nowrap">
            {percentage}% <span className="lowercase">{t('slippage')}</span>
          </span>
        </Text>
      </Box>
      <Box>
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {formatTokenAmount(
            locale,
            receivedAmount.toString(),
            receivedAsset.symbol,
            BigNumber.ROUND_DOWN,
          )}
        </Text>
      </Box>
    </Box>
  );
};

export const AssetsReceivedSummaryList = ({
  receivedAsset,
  sendAssets,
}: AssetsReceivedSummaryList) => {
  return (
    <>
      {sendAssets.map((asset) => (
        <AssetsReceivedListItem
          key={asset.id}
          {...asset}
          receivedAsset={receivedAsset}
        />
      ))}
    </>
  );
};
