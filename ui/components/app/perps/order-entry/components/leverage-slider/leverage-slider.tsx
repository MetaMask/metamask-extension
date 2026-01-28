import React, { useCallback, useMemo } from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';
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

  // Generate tick marks for the slider
  const tickMarks = useMemo(() => {
    const marks: number[] = [minLeverage];
    // Add intermediate marks
    const step = Math.floor((maxLeverage - minLeverage) / 4);
    for (let i = 1; i < 4; i++) {
      marks.push(minLeverage + step * i);
    }
    marks.push(maxLeverage);
    return marks;
  }, [minLeverage, maxLeverage]);

  // Handle slider change
  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      onLeverageChange(value);
    },
    [onLeverageChange],
  );

  // Calculate slider fill percentage
  const fillPercentage = useMemo(() => {
    return ((leverage - minLeverage) / (maxLeverage - minLeverage)) * 100;
  }, [leverage, minLeverage, maxLeverage]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      {/* Label */}
      <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
        {t('perpsLeverage')}
      </Text>

      {/* Slider Row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
        className="w-full"
      >
        {/* Slider Container */}
        <Box className="relative flex-1">
          <input
            type="range"
            min={minLeverage}
            max={maxLeverage}
            step={1}
            value={leverage}
            onChange={handleSliderChange}
            className={twMerge(
              'w-full h-1 bg-muted rounded-full appearance-none cursor-pointer',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-4',
              '[&::-webkit-slider-thumb]:h-4',
              '[&::-webkit-slider-thumb]:bg-default',
              '[&::-webkit-slider-thumb]:border-2',
              '[&::-webkit-slider-thumb]:border-primary-default',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:relative',
              '[&::-webkit-slider-thumb]:z-10',
            )}
            style={{
              background: `linear-gradient(to right, var(--color-primary-default) 0%, var(--color-primary-default) ${fillPercentage}%, var(--color-background-muted) ${fillPercentage}%, var(--color-background-muted) 100%)`,
            }}
            data-testid="leverage-slider"
          />

          {/* Tick marks */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            className="absolute top-0 left-0 right-0 pointer-events-none"
          >
            {tickMarks.map((tick) => {
              const position =
                ((tick - minLeverage) / (maxLeverage - minLeverage)) * 100;
              return (
                <Box
                  key={tick}
                  className={twMerge(
                    'w-1.5 h-1.5 rounded-full -mt-0.5',
                    leverage >= tick ? 'bg-primary-default' : 'bg-muted',
                  )}
                  style={{
                    position: 'absolute',
                    left: `${position}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Leverage Badge */}
        <Box className="bg-muted px-3 py-2 rounded-lg min-w-[60px]">
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            className="text-center"
          >
            {leverage}{' '}
            <Text
              as="span"
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              x
            </Text>
          </Text>
        </Box>
      </Box>

      {/* Min/Max Labels */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        className="px-0"
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
