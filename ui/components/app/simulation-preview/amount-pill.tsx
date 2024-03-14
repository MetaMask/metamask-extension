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
