import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import { TextField, TextFieldSize } from '../../../../../component-library';
import {
  BorderRadius,
  BackgroundColor,
} from '../../../../../../helpers/constants/design-system';
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
  const [inputValue, setInputValue] = useState<string>(String(leverage));

  useEffect(() => {
    setInputValue(String(leverage));
  }, [leverage]);

  const handleSliderChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      const newValue = Array.isArray(value) ? value[0] : value;
      onLeverageChange(newValue);
      setInputValue(String(newValue));
    },
    [onLeverageChange],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      if (value === '' || /^\d*$/u.test(value)) {
        setInputValue(value);
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= minLeverage && num <= maxLeverage) {
          onLeverageChange(num);
        }
      }
    },
    [onLeverageChange, minLeverage, maxLeverage],
  );

  const handleInputBlur = useCallback(() => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < minLeverage) {
      onLeverageChange(minLeverage);
      setInputValue(String(minLeverage));
    } else if (num > maxLeverage) {
      onLeverageChange(maxLeverage);
      setInputValue(String(maxLeverage));
    } else {
      onLeverageChange(num);
      setInputValue(String(num));
    }
  }, [inputValue, onLeverageChange, minLeverage, maxLeverage]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={2}>
      <Text variant={TextVariant.BodySm}>{t('perpsLeverage')}</Text>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
      >
        <Box className="flex-1 px-3" data-testid="leverage-slider">
          <PerpsSlider
            min={minLeverage}
            max={maxLeverage}
            step={1}
            value={leverage}
            onChange={handleSliderChange}
          />
        </Box>
        <Box className="shrink-0 w-20">
          <TextField
            size={TextFieldSize.Sm}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            borderRadius={BorderRadius.MD}
            borderWidth={0}
            backgroundColor={BackgroundColor.backgroundMuted}
            className="w-full"
            data-testid="leverage-input"
            inputProps={{
              inputMode: 'numeric',
              style: { textAlign: 'center' },
            }}
            endAccessory={
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                x
              </Text>
            }
          />
        </Box>
      </Box>
    </Box>
  );
};

export default LeverageSlider;
