import React from 'react';
import { CaipAssetType } from '@metamask/utils';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import {
  AlignItems,
  Display,
  IconColor,
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
  address: `0x${string}` | CaipAssetType;
}) => {
  let color = process.env.REMOVE_GNS
    ? TextColor.textAlternative
    : TextColor.textDefault;
  if (!process.env.REMOVE_GNS && isValidAmount(value)) {
    if ((value as number) === 0) {
      color = TextColor.textDefault;
    } else if ((value as number) > 0) {
      color = TextColor.successDefault;
    } else {
      color = TextColor.errorDefault;
    }
  }

  const formattedValue = formatValue(value, false);
  const balanceIsNegative = isValidAmount(value) && (value as number) < 0;
  return (
    <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
      {process.env.REMOVE_GNS ? (
        <Icon
          name={balanceIsNegative ? IconName.TriangleDown : IconName.TriangleUp}
          size={IconSize.Xs}
          color={
            balanceIsNegative
              ? IconColor.errorDefault
              : IconColor.successDefault
          }
        />
      ) : null}
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
