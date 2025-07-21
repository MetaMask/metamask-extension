import React, { ReactNode } from 'react';
import { Box, Text } from '../../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  FlexWrap,
  Color,
} from '../../../../../helpers/constants/design-system';
import { useRowContext } from './hook';
import { ConfirmInfoRowVariant } from './row';

export type ConfirmInfoRowValueDoubleProps = {
  left: ReactNode;
  right: ReactNode;
};

const LEFT_TEXT_COLORS = {
  [ConfirmInfoRowVariant.Default]: TextColor.textMuted,
  [ConfirmInfoRowVariant.Critical]: Color.errorAlternative,
  [ConfirmInfoRowVariant.Warning]: Color.warningDefault,
};

export const ConfirmInfoRowValueDouble = ({
  left,
  right,
}: ConfirmInfoRowValueDoubleProps) => {
  const { variant } = useRowContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      gap={1}
    >
      {typeof left === 'string' ? (
        <Text color={LEFT_TEXT_COLORS[variant] as TextColor}>{left}</Text>
      ) : (
        left
      )}
      {typeof right === 'string' ? (
        <Text color={TextColor.inherit}>{right}</Text>
      ) : (
        right
      )}
    </Box>
  );
};
