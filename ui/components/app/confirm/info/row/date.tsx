import React from 'react';

import {
  AlignItems,
  Display,
  FlexWrap,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { formatUTCDateFromUnixTimestamp } from '../../../../../helpers/utils/util';
import { Box } from '../../../../component-library/box/box';
import { Text } from '../../../../component-library/text/text';

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
