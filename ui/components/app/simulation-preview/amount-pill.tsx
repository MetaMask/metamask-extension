import React from 'react';
import { Text } from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Numeric } from '../../../../shared/modules/Numeric';

/**
 * Displays a pill with an amount and a background color indicating whether the amount
 * is an increase or decrease.
 *
 * @param props
 * @param props.isDecrease
 * @param props.absChange - The absolute value of the change with the correct decimals
 * for the asset this amount will be displayed next to.
 */
export const AmountPill: React.FC<{
  isDecrease: boolean;
  absChange: Numeric;
}> = ({ isDecrease, absChange }) => {
  const backgroundColor = isDecrease
    ? BackgroundColor.errorMuted
    : BackgroundColor.successMuted;

  const color = isDecrease
    ? TextColor.errorAlternative
    : TextColor.successDefault;

  const sign = isDecrease ? '-' : '+';
  const formattedAmount = `${sign} ${absChange.round(6).toBase(10).toString()}`;

  return (
    <Text
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      backgroundColor={backgroundColor}
      color={color}
      borderRadius={BorderRadius.pill}
      style={{
        padding: '0px 8px',
      }}
      variant={TextVariant.bodyMd}
    >
      {formattedAmount}
    </Text>
  );
};
