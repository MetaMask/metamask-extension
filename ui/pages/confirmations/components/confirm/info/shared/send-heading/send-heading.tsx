import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
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
import { useConfirmContext } from '../../../../../context/confirm';
import { useSelectedToken } from '../../hooks/use-selected-token';
import { useTokenImage } from '../../hooks/use-token-image';
import { useTokenValues } from '../../hooks/use-token-values';

const SendHeading = () => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { selectedToken } = useSelectedToken(transactionMeta);
  const { tokenImage } = useTokenImage(transactionMeta, selectedToken);
  const { tokenBalance, fiatDisplayValue } = useTokenValues(
    transactionMeta,
    selectedToken,
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      paddingTop={4}
    >
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
      <Text
        variant={TextVariant.headingLg}
        color={TextColor.inherit}
        marginTop={3}
      >{`${tokenBalance} ${selectedToken?.symbol || t('unknown')}`}</Text>
      {fiatDisplayValue && (
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {fiatDisplayValue}
        </Text>
      )}
    </Box>
  );
};

export default SendHeading;
