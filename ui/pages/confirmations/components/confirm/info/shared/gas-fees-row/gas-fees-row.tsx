import React from 'react';
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

export const GasFeesRow = ({
  label,
  tooltipText,
  fiatFee,
  nativeFee,
  'data-testid': dataTestId,
}: {
  label: string;
  tooltipText: string;
  fiatFee: string;
  nativeFee: string;
  'data-testid'?: string;
}) => {
  const { useNativeCurrencyAsPrimaryCurrency: isNativeCurrencyUsed } =
    useSelector(getPreferences);

  return (
    <ConfirmInfoRow
      data-testid={dataTestId}
      label={label}
      tooltip={tooltipText}
      variant={ConfirmInfoRowVariant.Default}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        marginLeft={8}
      >
        <Text marginRight={1} color={TextColor.textDefault}>
          {isNativeCurrencyUsed ? nativeFee : fiatFee}
        </Text>
        <Text color={TextColor.textAlternative}>
          {isNativeCurrencyUsed ? fiatFee : nativeFee}
        </Text>
      </Box>
    </ConfirmInfoRow>
  );
};
