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

export const FeesRow = ({
  label,
  tooltipText,
  currentCurrencyFees,
  nativeCurrencyFees,
}: {
  label: string;
  tooltipText: string;
  currentCurrencyFees: string;
  nativeCurrencyFees: string | undefined;
}) => {
  const { useNativeCurrencyAsPrimaryCurrency: isNativeCurrencyUsed } =
    useSelector(getPreferences);

  return (
    <ConfirmInfoRow
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
          {isNativeCurrencyUsed ? nativeCurrencyFees : currentCurrencyFees}
        </Text>
        <Text color={TextColor.textAlternative}>
          {isNativeCurrencyUsed ? currentCurrencyFees : nativeCurrencyFees}
        </Text>
      </Box>
    </ConfirmInfoRow>
  );
};
