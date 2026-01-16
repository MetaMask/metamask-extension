import React, { useState, useRef } from 'react';
import {
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
  TextVariant,
  TextColor,
  IconColor,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { Popover, PopoverPosition } from '../../../component-library';
import {
  CandlePeriod,
  CANDLE_PERIODS,
  DEFAULT_CANDLE_PERIODS,
  MORE_CANDLE_PERIODS,
} from '../constants/chartConfig';

// Helper function to get the display label for a candle period
const getCandlePeriodLabel = (period: CandlePeriod | string): string => {
  const candlePeriod = CANDLE_PERIODS.find(
    (p) => p.value?.toLowerCase() === period?.toLowerCase(),
  );
  return candlePeriod?.label || period;
};

export type PerpsCandlePeriodSelectorProps = {
  selectedPeriod: CandlePeriod | string;
  onPeriodChange?: (period: CandlePeriod) => void;
};

const PerpsCandlePeriodSelector: React.FC<PerpsCandlePeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Check if the selected period is in the "More" category (not in default periods)
  const isMorePeriodSelected = !DEFAULT_CANDLE_PERIODS.some(
    (period) => period.value?.toLowerCase() === selectedPeriod?.toLowerCase(),
  );

  const handleMorePeriodSelect = (period: CandlePeriod) => {
    onPeriodChange?.(period);
    setIsMoreOpen(false);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      gap={1}
      paddingTop={3}
      paddingBottom={3}
      paddingLeft={4}
      paddingRight={4}
      data-testid="perps-candle-period-selector"
    >
      {/* Default Candle Period Buttons */}
      {DEFAULT_CANDLE_PERIODS.map((period) => {
        const isSelected =
          selectedPeriod?.toLowerCase() === period.value?.toLowerCase();

        return (
          <button
            key={period.value}
            type="button"
            className={`perps-candle-period-button ${isSelected ? 'perps-candle-period-button--selected' : ''}`}
            onClick={() => {
              onPeriodChange?.(period.value);
            }}
            data-testid={`perps-candle-period-${period.value}`}
          >
            <Text
              variant={TextVariant.BodySm}
              color={
                isSelected ? TextColor.TextDefault : TextColor.TextAlternative
              }
            >
              {period.label}
            </Text>
          </button>
        );
      })}

      {/* More Button with Popover */}
      <button
        ref={moreButtonRef}
        type="button"
        className={`perps-candle-period-button perps-candle-period-button--more ${isMorePeriodSelected ? 'perps-candle-period-button--selected' : ''}`}
        onClick={() => setIsMoreOpen(!isMoreOpen)}
        data-testid="perps-candle-period-more"
      >
        <Text
          variant={TextVariant.BodySm}
          color={
            isMorePeriodSelected
              ? TextColor.TextDefault
              : TextColor.TextAlternative
          }
        >
          {isMorePeriodSelected ? getCandlePeriodLabel(selectedPeriod) : 'More'}
        </Text>
        <Icon
          name={isMoreOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
        />
      </button>

      <Popover
        isOpen={isMoreOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={moreButtonRef.current}
        onClickOutside={() => setIsMoreOpen(false)}
        onPressEscKey={() => setIsMoreOpen(false)}
        padding={0}
        className="perps-candle-period-popover rounded-lg bg-default"
      >
        <Box flexDirection={BoxFlexDirection.Column} padding={2} gap={1}>
          {MORE_CANDLE_PERIODS.map((period) => {
            const isSelected =
              selectedPeriod?.toLowerCase() === period.value?.toLowerCase();

            return (
              <button
                key={period.value}
                type="button"
                className={`perps-candle-period-option ${isSelected ? 'perps-candle-period-option--selected' : ''}`}
                onClick={() => handleMorePeriodSelect(period.value)}
                data-testid={`perps-candle-period-more-${period.value}`}
              >
                <Text
                  variant={TextVariant.BodySm}
                  color={
                    isSelected
                      ? TextColor.TextDefault
                      : TextColor.TextAlternative
                  }
                >
                  {period.label}
                </Text>
              </button>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
};

export default PerpsCandlePeriodSelector;
