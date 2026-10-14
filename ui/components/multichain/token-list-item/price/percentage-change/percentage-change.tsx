import React from 'react';
import { CaipAssetType } from '@metamask/utils';
import { Box, Text } from '../../../../component-library';
import {
  AlignItems,
  Display,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { isValidAmount } from '../../../../../../shared/lib/format-value';
import { useFormatters } from '../../../../../hooks/useFormatters';

export const PercentageChange = ({
  value,
  address,
}: {
  value: number | null | undefined;
  address: `0x${string}` | CaipAssetType;
}) => {
  const { formatNumber } = useFormatters();

  let color = TextColor.textAlternative;
  if (isValidAmount(value)) {
    if ((value as number) === 0) {
      color = TextColor.textDefault;
    } else if ((value as number) > 0) {
      color = TextColor.successDefault;
    } else {
      color = TextColor.errorDefault;
    }
  }

  const formattedValue =
    typeof value === 'number' && !Number.isNaN(value)
      ? formatNumber(value / 100, {
          style: 'percent',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          signDisplay: 'always',
        })
      : '';

  return (
    <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
      <Text
        variant={TextVariant.bodySmMedium}
        color={color}
        data-testid={`token-increase-decrease-percentage-${address}`}
        ellipsis
      >
        {formattedValue || '-'}
      </Text>
    </Box>
  );
};

export default PercentageChange;
