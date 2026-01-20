import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { TEST_CHAINS } from '../../../../../../../../shared/constants/network';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import { Skeleton } from '../../../../../../../components/component-library/skeleton';
import Tooltip from '../../../../../../../components/ui/tooltip';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getPreferences } from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';
import { useTokenValues } from '../../hooks/use-token-values';
import { useSendingValueMetric } from '../../hooks/useSendingValueMetric';
import { useTokenDetails } from '../../hooks/useTokenDetails';

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
      <Skeleton width={40} height={24} />
      {tokenSymbol}
    </Box>
  );

  const TokenValueContent = pending
    ? TokenValueSkeleton
    : `${displayTransferValue} ${tokenSymbol}`;

  const TokenValue =
    pending || displayTransferValue === decodedTransferValue ? (
      <Text
        variant={TextVariant.headingLg}
        color={TextColor.inherit}
        marginTop={3}
      >
        {TokenValueContent}
      </Text>
    ) : (
      <Tooltip title={decodedTransferValue} position="right">
        <Text
          variant={TextVariant.headingLg}
          color={TextColor.inherit}
          marginTop={3}
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
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {fiatDisplayValue}
          </Text>
        ));

  useSendingValueMetric({ transactionMeta, fiatValue });

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={4}
      marginBottom={2}
    >
      {TokenImage}
      {TokenValue}
      {TokenFiatValue}
    </Box>
  );
};

export default SendHeading;
