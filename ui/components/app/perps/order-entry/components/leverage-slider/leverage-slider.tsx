import React, { useCallback } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import Slider from '../../../../../ui/slider';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { LeverageSliderProps } from '../../order-entry.types';

/**
 * LeverageSlider - Slider for selecting leverage multiplier
 *
 * @param props - Component props
 * @param props.leverage - Current leverage value
 * @param props.onLeverageChange - Callback when leverage changes
 * @param props.maxLeverage - Maximum allowed leverage
 * @param props.minLeverage - Minimum allowed leverage (default: 1)
 */
export const LeverageSlider: React.FC<LeverageSliderProps> = ({
  leverage,
  onLeverageChange,
  maxLeverage,
  minLeverage = 1,
}) => {
  const t = useI18nContext();

  // Handle slider change
  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const newValue = Array.isArray(value) ? value[0] : value;
      onLeverageChange(newValue);
    },
    [onLeverageChange],
  );

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      {/* Label and Value Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
          {t('perpsLeverage')}
        </Text>
        <Box className="bg-muted px-3 py-1 rounded-lg">
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
          >
            {leverage}x
          </Text>
        </Box>
      </Box>

      {/* Material UI Slider */}
      <Box className="px-1" data-testid="leverage-slider">
        <Slider
          min={minLeverage}
          max={maxLeverage}
          step={1}
          value={leverage}
          onChange={handleSliderChange}
        />
      </Box>

      {/* Min/Max Labels */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
      >
        <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
          {minLeverage}x
        </Text>
        <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
          {maxLeverage}x
        </Text>
      </Box>
    </Box>
  );
};

export default LeverageSlider;
