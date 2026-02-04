import React, { useCallback, useMemo } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  ButtonBase,
} from '@metamask/design-system-react';
import { PerpsSlider } from '../../../perps-slider';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { LeverageSliderProps } from '../../order-entry.types';
import { LEVERAGE_PRESETS } from '../../order-entry.mocks';

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

  // Filter presets to only show values within the allowed range
  const availablePresets = useMemo(
    () =>
      LEVERAGE_PRESETS.filter(
        (preset) => preset >= minLeverage && preset <= maxLeverage,
      ),
    [minLeverage, maxLeverage],
  );

  // Handle slider change
  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const newValue = Array.isArray(value) ? value[0] : value;
      onLeverageChange(newValue);
    },
    [onLeverageChange],
  );

  // Handle preset button click
  const handlePresetClick = useCallback(
    (preset: number) => {
      onLeverageChange(preset);
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
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('perpsLeverage')}
        </Text>
        <Box className="bg-muted px-3 py-1 rounded-lg">
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {leverage}x
          </Text>
        </Box>
      </Box>

      {/* Material UI Slider */}
      <Box className="px-3" data-testid="leverage-slider">
        <PerpsSlider
          min={minLeverage}
          max={maxLeverage}
          step={1}
          value={leverage}
          onChange={handleSliderChange}
        />
      </Box>

      {/* Leverage Preset Buttons */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        className="w-full"
      >
        {availablePresets.map((preset) => (
          <ButtonBase
            key={preset}
            onClick={() => handlePresetClick(preset)}
            className={twMerge(
              'px-3 py-1 rounded-md text-sm',
              leverage === preset
                ? 'bg-muted text-primary-inverse'
                : 'bg-transparent text-muted hover:bg-hover',
            )}
            data-testid={`leverage-preset-${preset}`}
          >
            {preset}x
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
};

export default LeverageSlider;
