import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  FontFamily,
  Skeleton,
  Text as DsText,
  TextColor as DsTextColor,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import {
  AlignItems,
  BackgroundColor,
  Display,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
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

  const TokenImage = (
    <AvatarToken
      src={tokenImage}
      name={tokenSymbol !== t('unknown') && tokenSymbol}
      size={AvatarTokenSize.Xl}
      backgroundColor={
        tokenSymbol === t('unknown')
          ? BackgroundColor.overlayDefault
          : BackgroundColor.backgroundDefault
      }
      color={
        tokenSymbol === t('unknown')
          ? TextColor.textMuted
          : TextColor.textDefault
      }
    />
  );

  const TokenValueSkeleton = (
    <Box display={Display.InlineFlex} alignItems={AlignItems.center} gap={2}>
      <Skeleton width={40} height={56} />
      {tokenSymbol}
    </Box>
  );

  const TokenValueContent = pending
    ? TokenValueSkeleton
    : `${displayTransferValue} ${tokenSymbol}`;

  const TokenValue =
    pending || displayTransferValue === decodedTransferValue ? (
      <DsText
        variant={DsTextVariant.AmountDisplayLg}
        fontFamily={FontFamily.Hero}
        color={DsTextColor.Inherit}
        className="block pb-1"
      >
        {TokenValueContent}
      </DsText>
    ) : (
      <Tooltip title={decodedTransferValue} position="right">
        <DsText
          variant={DsTextVariant.AmountDisplayLg}
          fontFamily={FontFamily.Hero}
          color={DsTextColor.Inherit}
          className="block pb-1"
        >
          {TokenValueContent}
        </DsText>
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
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
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
