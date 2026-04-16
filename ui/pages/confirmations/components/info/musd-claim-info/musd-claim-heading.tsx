import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useMerklClaimAmount } from '../../../hooks/musd/useMerklClaimAmount';
import { getAssetImageUrl } from '../../../../../../shared/lib/asset-utils';
import { MUSD_TOKEN_ADDRESS } from '../../../../../components/app/musd/constants';
import SendHeadingLayout from '../../confirm/info/shared/send-heading-layout/send-heading-layout';

const MUSD_SYMBOL = 'mUSD';

const MusdClaimHeading = () => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { displayClaimAmount, fiatDisplayValue, pending } =
    useMerklClaimAmount(transactionMeta);

  const musdTokenImageUrl = getAssetImageUrl(
    MUSD_TOKEN_ADDRESS,
    transactionMeta?.chainId,
  );

  const TokenImage = (
    <Box
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      style={{ display: 'inline-flex' }}
    >
      <AvatarToken
        src={musdTokenImageUrl}
        name={MUSD_SYMBOL}
        size={AvatarTokenSize.Xl}
      />
    </Box>
  );

  const TokenValueSkeleton = (
    <Box
      alignItems={BoxAlignItems.Center}
      gap={2}
      style={{ display: 'inline-flex' }}
    >
      <Skeleton width={40} height={24} />
      {MUSD_SYMBOL}
    </Box>
  );

  const TokenValue = (
    <Text
      variant={TextVariant.HeadingLg}
      color={TextColor.Inherit}
      data-testid="musd-claim-heading-amount"
    >
      {pending
        ? TokenValueSkeleton
        : `${displayClaimAmount ?? '0'} ${MUSD_SYMBOL}`}
    </Text>
  );

  const TokenFiatValueSkeleton = (
    <Skeleton width={48} height={22} style={{ marginBottom: '2px' }} />
  );

  const TokenFiatValue = pending
    ? TokenFiatValueSkeleton
    : fiatDisplayValue && (
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="musd-claim-heading-fiat"
        >
          {fiatDisplayValue}
        </Text>
      );

  return (
    <SendHeadingLayout label={t('musdClaimTitle')} image={TokenImage}>
      {TokenValue}
      {TokenFiatValue}
    </SendHeadingLayout>
  );
};

export default MusdClaimHeading;
