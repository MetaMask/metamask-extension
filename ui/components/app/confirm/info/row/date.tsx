import React from 'react';

import { TextColor } from '../../../../../helpers/constants/design-system';
import { formatUTCDateFromUnixTimestamp } from '../../../../../helpers/utils/util';
import { Box, BoxAlignItems, BoxFlexWrap } from '@metamask/design-system-react';
import { Text } from '../../../../component-library';

export type ConfirmInfoRowDateProps = {
  /** timestamp as seconds since unix epoch e.g. Solidity block.timestamp (type uint256) value */
  unixTimestamp: number;
};

export const ConfirmInfoRowDate = ({
  unixTimestamp,
}: ConfirmInfoRowDateProps) => (
  <Box
    className="flex"
    alignItems={BoxAlignItems.Center}
    flexWrap={BoxFlexWrap.Wrap}
    gap={2}
  >
    <Text color={TextColor.inherit} style={{ whiteSpace: 'pre-wrap' }}>
      {formatUTCDateFromUnixTimestamp(unixTimestamp)}
    </Text>
  </Box>
);
