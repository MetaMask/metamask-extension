import React from 'react';
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

export const LayerFeesRow = ({
  label,
  tooltipText,
  currentCurrencyFee,
  nativeCurrencyFee,
}: {
  label: string;
  tooltipText: string;
  currentCurrencyFee: string;
  nativeCurrencyFee: string | undefined;
}) => {
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
        style={{ flexGrow: '1' }}
        marginLeft={8}
      >
        <Text color={TextColor.textAlternative}>{currentCurrencyFee}</Text>
        <Text color={TextColor.textAlternative}>{nativeCurrencyFee}</Text>
      </Box>
    </ConfirmInfoRow>
  );
};
