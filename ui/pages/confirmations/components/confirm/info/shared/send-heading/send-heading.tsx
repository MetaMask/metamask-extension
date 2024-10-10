import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
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
import { getWatchedToken } from '../../../../../../../selectors';
import { MultichainState } from '../../../../../../../selectors/multichain';
import { useConfirmContext } from '../../../../../context/confirm';
import { useTokenImage } from '../../hooks/use-token-image';
import { useTokenValues } from '../../hooks/use-token-values';

const SendHeading = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const selectedToken = useSelector((state: MultichainState) =>
    getWatchedToken(transactionMeta)(state),
  );
  const { tokenImage } = useTokenImage(transactionMeta, selectedToken);
  const { tokenBalance, fiatDisplayValue } = useTokenValues(
    transactionMeta,
    selectedToken,
  );

  const TokenImage = (
    <AvatarToken
      src={tokenImage}
      name={selectedToken?.symbol}
      size={AvatarTokenSize.Xl}
      backgroundColor={
        selectedToken?.symbol
          ? BackgroundColor.backgroundDefault
          : BackgroundColor.overlayDefault
      }
      color={
        selectedToken?.symbol ? TextColor.textDefault : TextColor.textMuted
      }
    />
  );

  const TokenValue = (
    <>
      <Text
        variant={TextVariant.headingLg}
        color={TextColor.inherit}
        marginTop={3}
      >{`${tokenBalance || ''} ${selectedToken?.symbol || t('unknown')}`}</Text>
      {fiatDisplayValue && (
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {fiatDisplayValue}
        </Text>
      )}
    </>
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={4}
    >
      {TokenImage}
      {TokenValue}
    </Box>
  );
};

export default SendHeading;
