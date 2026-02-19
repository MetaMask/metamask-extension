import React, { useCallback } from 'react';
import {
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { PerpsSlider } from '../../../perps-slider';
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

  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const newValue = Array.isArray(value) ? value[0] : value;
      onLeverageChange(newValue);
    },
    [onLeverageChange],
  );

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('perpsLeverage')}
        </Text>
        <Box className="bg-muted px-3 py-1 rounded-lg">
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {leverage}x
          </Text>
        </Box>
      </Box>

      <Box className="px-3" data-testid="leverage-slider">
        <PerpsSlider
          min={minLeverage}
          max={maxLeverage}
          step={1}
          value={leverage}
          onChange={handleSliderChange}
        />
      </Box>
    </Box>
  );
};

export default LeverageSlider;
