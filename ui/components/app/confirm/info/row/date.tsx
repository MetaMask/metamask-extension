import React from 'react';

import {
  AlignItems,
  Display,
  FlexWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { formatUTCDateFromUnixTimestamp } from '../../../../../helpers/utils/util';
import { Box, Text } from '../../../../component-library';

export type ConfirmInfoRowDateProps = {
  /** timestamp as seconds since unix epoch e.g. Solidity block.timestamp (type uint256) value */
  unixTimestamp: number;
};

export const ConfirmInfoRowDate = ({
  unixTimestamp,
}: ConfirmInfoRowDateProps) => (
  <Box
    display={Display.Flex}
    alignItems={AlignItems.center}
    flexWrap={FlexWrap.Wrap}
    gap={2}
  >
    <Text color={TextColor.inherit} style={{ whiteSpace: 'pre-wrap' }}>
      {formatUTCDateFromUnixTimestamp(unixTimestamp)}
    </Text>
  </Box>
);
