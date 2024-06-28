import React, { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../../components/app/confirm/info/row';
import { Box, Text } from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../../../../../helpers/constants/design-system';
import { getPreferences } from '../../../../../../../selectors';
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';

export const EditGasFeesRow = ({
  currentCurrencyFees,
  nativeCurrencyFees,
  supportsEIP1559,
  setShowCustomizeGasPopover,
}: {
  currentCurrencyFees: string;
  nativeCurrencyFees: string | undefined;
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  const { useNativeCurrencyAsPrimaryCurrency: isNativeCurrencyUsed } =
    useSelector(getPreferences);

  return (
    <ConfirmInfoRow
      label="Estimated fee"
      variant={ConfirmInfoRowVariant.Default}
      tooltip="estimated fee tooltip"
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
          {isNativeCurrencyUsed ? nativeCurrencyFees : currentCurrencyFees}
        </Text>
        <Text marginRight={2} color={TextColor.textAlternative}>
          {isNativeCurrencyUsed ? currentCurrencyFees : nativeCurrencyFees}
        </Text>
        <EditGasIconButton
          supportsEIP1559={supportsEIP1559}
          setShowCustomizeGasPopover={setShowCustomizeGasPopover}
        />
      </Box>
    </ConfirmInfoRow>
  );
};
