import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { useConfirmContext } from '../../../context/confirm';
import { useMerklClaimAmount } from '../../../hooks/musd/useMerklClaimAmount';

const MUSD_ICON_SRC = './images/musd-icon-no-background-2x.png';
const MUSD_SYMBOL = 'MUSD';

const MusdClaimHeading = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { displayClaimAmount, fiatDisplayValue, pending } =
    useMerklClaimAmount(transactionMeta);

  const TokenImage = (
    <AvatarToken
      src={MUSD_ICON_SRC}
      name={MUSD_SYMBOL}
      size={AvatarTokenSize.Xl}
    />
  );

  const TokenValueSkeleton = (
    <Box
      flexDirection={BoxFlexDirection.Row}
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
      style={{ marginTop: '12px' }}
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
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      padding={4}
      marginBottom={2}
      data-testid="musd-claim-heading"
    >
      {TokenImage}
      {TokenValue}
      {TokenFiatValue}
    </Box>
  );
};

export default MusdClaimHeading;
