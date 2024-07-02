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
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { getPreferences } from '../../../../../../../selectors';
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';

export const EditGasFeesRow = ({
  fiatFee,
  nativeFee,
  supportsEIP1559,
  setShowCustomizeGasPopover,
}: {
  fiatFee: string;
  nativeFee: string;
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  const t = useI18nContext();

  const { useNativeCurrencyAsPrimaryCurrency: isNativeCurrencyUsed } =
    useSelector(getPreferences);

  return (
    <ConfirmInfoRow
      label={t('estimatedFee')}
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
          {isNativeCurrencyUsed ? nativeFee : fiatFee}
        </Text>
        <Text marginRight={2} color={TextColor.textAlternative}>
          {isNativeCurrencyUsed ? fiatFee : nativeFee}
        </Text>
        <EditGasIconButton
          supportsEIP1559={supportsEIP1559}
          setShowCustomizeGasPopover={setShowCustomizeGasPopover}
        />
      </Box>
    </ConfirmInfoRow>
  );
};
