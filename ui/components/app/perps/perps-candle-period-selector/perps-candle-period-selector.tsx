import React, { useState, useRef } from 'react';
import {
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '../../../component-library';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  TextColor,
  IconColor,
  BackgroundColor,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
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

interface PerpsCandlePeriodSelectorProps {
  selectedPeriod: CandlePeriod | string;
  onPeriodChange?: (period: CandlePeriod) => void;
}

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
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
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
              variant={TextVariant.bodySm}
              color={
                isSelected ? TextColor.textDefault : TextColor.textAlternative
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
          variant={TextVariant.bodySm}
          color={
            isMorePeriodSelected
              ? TextColor.textDefault
              : TextColor.textAlternative
          }
        >
          {isMorePeriodSelected ? getCandlePeriodLabel(selectedPeriod) : 'More'}
        </Text>
        <Icon
          name={isMoreOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.iconAlternative}
        />
      </button>

      <Popover
        isOpen={isMoreOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={moreButtonRef.current}
        onClickOutside={() => setIsMoreOpen(false)}
        onPressEscKey={() => setIsMoreOpen(false)}
        padding={0}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.LG}
        className="perps-candle-period-popover"
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          padding={2}
          gap={1}
        >
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
                  variant={TextVariant.bodySm}
                  color={
                    isSelected
                      ? TextColor.textDefault
                      : TextColor.textAlternative
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
