import React from 'react';

import {
  AlignItems,
  Display,
  FlexWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { formatUTCDate } from '../../../../../helpers/utils/util';
import { Box, Text } from '../../../../component-library';

export type ConfirmInfoRowDateProps = {
  date: number;
};

export const ConfirmInfoRowDate = ({ date }: ConfirmInfoRowDateProps) => (
  <Box
    display={Display.Flex}
    alignItems={AlignItems.center}
    flexWrap={FlexWrap.Wrap}
    gap={2}
  >
    <Text color={TextColor.inherit} style={{ whiteSpace: 'pre-wrap' }}>
      {formatUTCDate(date)}
    </Text>
  </Box>
);
