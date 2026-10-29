import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  FontFamily,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getPreferences } from '../../../../../../../../shared/lib/selectors/preferences';
import { useConfirmContext } from '../../../../../context/confirm';
import { useTokenValues } from '../../hooks/use-token-values';
import { useSendingValueMetric } from '../../hooks/useSendingValueMetric';
import { useTokenDetails } from '../../hooks/useTokenDetails';
import SendHeadingLayout from '../send-heading-layout/send-heading-layout';

const SendHeading = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { tokenImage, tokenSymbol } = useTokenDetails(transactionMeta);
  const {
    decodedTransferValue,
    displayTransferValue,
    fiatDisplayValue,
    fiatValue,
    pending,
  } = useTokenValues(transactionMeta);

  type TestNetChainId = (typeof TEST_CHAINS)[number];
  const isTestnet = TEST_CHAINS.includes(
    transactionMeta.chainId as TestNetChainId,
  );
  const { showFiatInTestnets } = useSelector(getPreferences);

  const isUnknownToken = tokenSymbol === t('unknown');

  const TokenImage = (
    <AvatarToken
      src={tokenImage}
      name={isUnknownToken ? undefined : tokenSymbol}
      size={AvatarTokenSize.Xl}
      className={isUnknownToken ? 'bg-overlay-default' : 'bg-default'}
      fallbackTextProps={{
        color: isUnknownToken ? TextColor.TextMuted : TextColor.TextDefault,
      }}
    />
  );

  const TokenValueSkeleton = (
    <Box className="inline-flex" alignItems={BoxAlignItems.Center} gap={2}>
      <Skeleton width={40} height={56} />
      {tokenSymbol}
    </Box>
  );

  const TokenValueContent = pending
    ? TokenValueSkeleton
    : `${displayTransferValue} ${tokenSymbol}`;

  const TokenValue =
    pending || displayTransferValue === decodedTransferValue ? (
      <Text
        variant={TextVariant.AmountDisplayLg}
        fontFamily={FontFamily.Hero}
        color={TextColor.Inherit}
        className="block pb-1"
      >
        {TokenValueContent}
      </Text>
    ) : (
      <Tooltip title={decodedTransferValue} position="right">
        <Text
          variant={TextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          color={TextColor.Inherit}
          className="block pb-1"
        >
          {TokenValueContent}
        </Text>
      </Tooltip>
    );

  const showFiatValue = !isTestnet || showFiatInTestnets;

  const TokenFiatValueSkeleton = (
    <Skeleton width={48} height={22} style={{ marginBottom: '2px' }} />
  );

  const TokenFiatValue =
    showFiatValue &&
    (pending
      ? TokenFiatValueSkeleton
      : Boolean(fiatDisplayValue) && (
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {fiatDisplayValue}
          </Text>
        ));

  useSendingValueMetric({ transactionMeta, fiatValue });

  return (
    <SendHeadingLayout image={TokenImage}>
      {TokenValue}
      {TokenFiatValue}
    </SendHeadingLayout>
  );
};

export default SendHeading;
