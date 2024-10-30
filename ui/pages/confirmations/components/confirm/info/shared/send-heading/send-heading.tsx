import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { getIntlLocale } from '../../../../../../../ducks/locale/locale';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { MIN_AMOUNT } from '../../../../../../../hooks/useCurrencyDisplay';
import { getWatchedToken } from '../../../../../../../selectors';
import { MultichainState } from '../../../../../../../selectors/multichain';
import { useConfirmContext } from '../../../../../context/confirm';
import { formatAmountMaxPrecision } from '../../../../simulation-details/formatAmount';
import { useTokenValues } from '../../hooks/use-token-values';
import { useTokenDetails } from '../../hooks/useTokenDetails';
import { ConfirmLoader } from '../confirm-loader/confirm-loader';

const SendHeading = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const locale = useSelector(getIntlLocale);
  const selectedToken = useSelector((state: MultichainState) =>
    getWatchedToken(transactionMeta)(state),
  );
  const { tokenImage, tokenSymbol } = useTokenDetails(
    transactionMeta,
    selectedToken,
  );
  const {
    decodedTransferValue,
    displayTransferValue,
    fiatDisplayValue,
    pending,
  } = useTokenValues(transactionMeta);

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

  const TokenValue =
    displayTransferValue ===
    `<${formatAmountMaxPrecision(locale, MIN_AMOUNT)}` ? (
      <Tooltip title={decodedTransferValue.toString()} position="right">
        <Text
          variant={TextVariant.headingLg}
          color={TextColor.inherit}
          marginTop={3}
        >{`${displayTransferValue} ${tokenSymbol}`}</Text>
      </Tooltip>
    ) : (
      <Text
        variant={TextVariant.headingLg}
        color={TextColor.inherit}
        marginTop={3}
      >{`${displayTransferValue} ${tokenSymbol}`}</Text>
    );

  const TokenFiatValue = fiatDisplayValue && (
    <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
      {fiatDisplayValue}
    </Text>
  );

  if (pending) {
    return <ConfirmLoader />;
  }

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
      {TokenFiatValue}
    </Box>
  );
};

export default SendHeading;
