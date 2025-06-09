import React from 'react';
import { Box, Text } from '../../../../component-library';
import {
  Display,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  formatValue,
  isValidAmount,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../../../app/scripts/lib/util';

export const PercentageChange = ({
  value,
  address,
}: {
  value: number | null | undefined;
  address: `0x${string}`;
}) => {
  let color = TextColor.textDefault;

  if (isValidAmount(value)) {
    if ((value as number) === 0) {
      color = TextColor.textDefault;
    } else if ((value as number) > 0) {
      color = TextColor.successDefault;
    } else {
      color = TextColor.errorDefault;
    }
  }

  const formattedValue = formatValue(value, false);

  return (
    <Box display={Display.Flex}>
      <Text
        variant={TextVariant.bodySmMedium}
        color={color}
        data-testid={`token-increase-decrease-percentage-${address}`}
        ellipsis
      >
        {formattedValue}
      </Text>
    </Box>
  );
};

export default PercentageChange;
