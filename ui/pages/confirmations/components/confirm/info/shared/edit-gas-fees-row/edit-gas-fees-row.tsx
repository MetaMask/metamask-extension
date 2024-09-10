import React, { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from '@ethersproject/bignumber';
import { Box, Text } from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  currentConfirmationSelector,
  getPreferences,
} from '../../../../../../../selectors';
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';

export const EditGasFeesRow = ({
  fiatFee,
  nativeFee,
  supportsEIP1559,
  setShowCustomizeGasPopover,
}: {
  fiatFee: string | BigNumber;
  nativeFee: string | BigNumber;
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  const t = useI18nContext();

  const { useNativeCurrencyAsPrimaryCurrency: isNativeCurrencyUsed } =
    useSelector(getPreferences);

  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const formatFee = (fee: string | BigNumber): string => {
    if (BigNumber.isBigNumber(fee)) {
      return fee.toString();
    }
    return fee;
  };

  const formattedFiatFee = formatFee(fiatFee);
  const formattedNativeFee = formatFee(nativeFee);

  return (
    <ConfirmInfoAlertRow
      alertKey={RowAlertKey.EstimatedFee}
      ownerId={transactionMeta.id}
      data-testid="edit-gas-fees-row"
      label={t('estimatedFee')}
      tooltip={t('estimatedFeeTooltip')}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
      >
        <Text
          marginRight={1}
          color={TextColor.textDefault}
          data-testid="first-gas-field"
        >
          {isNativeCurrencyUsed ? formattedNativeFee : formattedFiatFee}
        </Text>
        <Text
          marginRight={2}
          color={TextColor.textAlternative}
          data-testid="native-currency"
        >
          {isNativeCurrencyUsed ? formattedFiatFee : formattedNativeFee}
        </Text>
        <EditGasIconButton
          supportsEIP1559={supportsEIP1559}
          setShowCustomizeGasPopover={setShowCustomizeGasPopover}
        />
      </Box>
    </ConfirmInfoAlertRow>
  );
};
