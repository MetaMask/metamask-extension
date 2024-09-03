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
          {nativeFee}
        </Text>
        <Text color={TextColor.textAlternative}>{fiatFee}</Text>
      </Box>
    </ConfirmInfoRow>
  );
};
