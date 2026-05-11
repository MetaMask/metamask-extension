import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { formatTokenAmount } from '../../../../bridge/utils/quote';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { useBatchSellInfoModal } from '../../../hooks/useBatchSellInfoModal';

type AssetsReceivedTotalAmountsSummaryProps = {
  receivedAsset: {
    symbol: string;
  };
  totalReceivedAmount: number;
  minimumReceivedAmount: number;
};

export const AssetsReceivedTotalAmountsSummary = ({
  receivedAsset,
  totalReceivedAmount,
  minimumReceivedAmount,
}: AssetsReceivedTotalAmountsSummaryProps) => {
  const { openModal } = useBatchSellInfoModal();
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  const onMinimumReceivedIconClick = () =>
    openModal({
      titleProps: {
        children: t('minimumReceivedLabel'),
      },
      descriptionProps: {
        children: t('batchSellMinimumReceiveExplanation'),
      },
    });

  return (
    <Box>
      <Box
        marginHorizontal={2}
        borderWidth={1}
        borderColor={BoxBorderColor.BorderMuted}
        marginBottom={3}
      />
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
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.SuccessDefault}
          >
            +
            {formatTokenAmount(
              locale,
              totalReceivedAmount.toString(),
              receivedAsset.symbol,
              BigNumber.ROUND_DOWN,
            )}
          </Text>
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
          <ButtonIcon
            size={ButtonIconSize.Sm}
            iconName={IconName.Info}
            iconProps={{
              className: 'text-text-alternative',
            }}
            onClick={onMinimumReceivedIconClick}
            ariaLabel={t('minimumReceivedLabel')}
          />
        </Box>
        <Box>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.SuccessDefault}
          >
            +
            {formatTokenAmount(
              locale,
              minimumReceivedAmount.toString(),
              receivedAsset.symbol,
              BigNumber.ROUND_DOWN,
            )}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
