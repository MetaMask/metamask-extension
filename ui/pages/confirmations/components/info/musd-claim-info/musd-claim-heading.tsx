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
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
} from '../../../../../components/component-library';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { useConfirmContext } from '../../../context/confirm';
import useConfirmationNetworkInfo from '../../../hooks/useConfirmationNetworkInfo';
import { useMerklClaimAmount } from '../../../hooks/musd/useMerklClaimAmount';
import { getAssetImageUrl } from '../../../../../../shared/lib/asset-utils';
import { MUSD_TOKEN_ADDRESS } from '../../../../../components/app/musd/constants';

const MUSD_SYMBOL = 'MUSD';

const MusdClaimHeading = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { displayClaimAmount, fiatDisplayValue, pending } =
    useMerklClaimAmount(transactionMeta);

  const { networkImageUrl, networkDisplayName } = useConfirmationNetworkInfo();

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
      <BadgeWrapper
        badge={
          <AvatarNetwork
            size={AvatarNetworkSize.Sm}
            name={networkDisplayName}
            src={networkImageUrl}
            backgroundColor={BackgroundColor.backgroundDefault}
            borderWidth={2}
          />
        }
      >
        <AvatarToken
          src={musdTokenImageUrl}
          name={MUSD_SYMBOL}
          size={AvatarTokenSize.Xl}
        />
      </BadgeWrapper>
    </Box>
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
      style={{ width: '100%', textAlign: 'center' }}
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
          style={{ width: '100%', textAlign: 'center' }}
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
      paddingTop={2}
      paddingBottom={2}
      gap={2}
      data-testid="musd-claim-heading"
    >
      {TokenImage}
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
      >
        {TokenValue}
        {TokenFiatValue}
      </Box>
    </Box>
  );
};

export default MusdClaimHeading;
