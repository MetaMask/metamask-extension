import React from 'react';
import { Box, Text } from '../../../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  FlexWrap,
} from '../../../../../../helpers/constants/design-system';

export type ConfirmInfoRowValueDoubleProps = {
  left: string;
  right: string;
};

export const ConfirmInfoRowValueDouble = ({
  left,
  right,
}: ConfirmInfoRowValueDoubleProps) => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Row}
    alignItems={AlignItems.center}
    flexWrap={FlexWrap.Wrap}
    style={{
      // TODO: Box should support this
      columnGap: '8px',
    }}
  >
    <Text color={TextColor.textMuted}>{left}</Text>
    <Text color={TextColor.inherit}>{right}</Text>
  </Box>
);
