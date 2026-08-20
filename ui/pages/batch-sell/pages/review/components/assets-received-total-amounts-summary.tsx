import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
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
// eslint-disable-next-line import-x/no-restricted-paths
import { Tooltip } from '../../../../bridge/layout';
import { PopoverPosition } from '../../../../../components/component-library';
import { Skeleton } from '../../../../../components/component-library/skeleton';

type AssetsReceivedTotalAmountsSummaryProps = {
  receivedAsset: {
    symbol: string;
  };
  totalReceivedAmount?: number;
  minimumReceivedAmount?: number;
  isLoading: boolean;
};

export const AssetsReceivedTotalAmountsSummary = ({
  receivedAsset,
  totalReceivedAmount,
  minimumReceivedAmount,
  isLoading,
}: AssetsReceivedTotalAmountsSummaryProps) => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  return (
    <Box>
      {totalReceivedAmount !== undefined && (
        <Box
          margin={2}
          borderWidth={1}
          borderColor={BoxBorderColor.BorderMuted}
        />
      )}
      <Box
        padding={2}
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <Box
          className="flex-1"
          alignItems={BoxAlignItems.Center}
          flexDirection={BoxFlexDirection.Row}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('totalReceived')}
          </Text>
        </Box>
        <Box>
          <Skeleton isLoading={isLoading} width={80}>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.SuccessDefault}
            >
              +
              {formatTokenAmount(
                locale,
                (totalReceivedAmount ?? 0).toString(),
                receivedAsset.symbol,
                BigNumber.ROUND_DOWN,
              )}
            </Text>
          </Skeleton>
        </Box>
      </Box>
      <Box
        padding={2}
        flexDirection={BoxFlexDirection.Row}
        gap={2}
        alignItems={BoxAlignItems.Center}
      >
        <Box
          className="flex-1"
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          alignItems={BoxAlignItems.Center}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('minimumReceivedLabel')}
          </Text>
          <Tooltip position={PopoverPosition.Bottom} style={{ zIndex: 1051 }}>
            {t('batchSellMinimumReceiveExplanation')}
          </Tooltip>
        </Box>
        <Box>
          <Skeleton isLoading={isLoading} width={80}>
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.SuccessDefault}
            >
              +
              {formatTokenAmount(
                locale,
                (minimumReceivedAmount ?? 0).toString(),
                receivedAsset.symbol,
                BigNumber.ROUND_DOWN,
              )}
            </Text>
          </Skeleton>
        </Box>
      </Box>
    </Box>
  );
};
