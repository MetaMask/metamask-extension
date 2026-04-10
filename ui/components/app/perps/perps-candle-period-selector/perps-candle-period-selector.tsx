import React, { useState, useRef, useCallback } from 'react';
import {
  twMerge,
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
  ButtonBase,
} from '@metamask/design-system-react';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { Popover, PopoverPosition } from '../../../component-library';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
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
  const t = useI18nContext();
  const { track } = usePerpsEventTracking();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Check if the selected period is in the "More" category (not in default periods)
  const isMorePeriodSelected = !DEFAULT_CANDLE_PERIODS.some(
    (period) => period.value?.toLowerCase() === selectedPeriod?.toLowerCase(),
  );

  const emitPeriodChange = useCallback(
    (period: CandlePeriod) => {
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.CANDLE_PERIOD_CHANGED,
        [PERPS_EVENT_PROPERTY.CANDLE_PERIOD]: period,
      });
      onPeriodChange?.(period);
    },
    [onPeriodChange, track],
  );

  const handleMorePeriodSelect = (period: CandlePeriod) => {
    emitPeriodChange(period);
    setIsMoreOpen(false);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      gap={1}
      paddingTop={2}
      paddingBottom={2}
      paddingLeft={4}
      paddingRight={4}
      data-testid="perps-candle-period-selector"
    >
      {/* Default Candle Period Buttons */}
      {DEFAULT_CANDLE_PERIODS.map((period) => {
        const isSelected =
          selectedPeriod?.toLowerCase() === period.value?.toLowerCase();

        return (
          <ButtonBase
            key={period.value}
            className={twMerge(
              '!py-1.5 h-auto !min-w-12 rounded-lg bg-transparent hover:bg-hover active:bg-pressed',
              isSelected && 'bg-muted',
            )}
            onClick={() => {
              emitPeriodChange(period.value);
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
          </ButtonBase>
        );
      })}

      {/* More Button with Popover */}
      <ButtonBase
        ref={moreButtonRef}
        className={twMerge(
          '!py-1.5 h-auto !min-w-12 rounded-lg flex items-center gap-1 bg-transparent hover:bg-hover active:bg-pressed',
          isMorePeriodSelected && 'bg-muted',
        )}
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
          {isMorePeriodSelected
            ? getCandlePeriodLabel(selectedPeriod)
            : t('perpsMore')}
        </Text>
        <Icon
          name={IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
          className="shrink-0"
        />
      </ButtonBase>

      <Popover
        isOpen={isMoreOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={moreButtonRef.current}
        onClickOutside={() => setIsMoreOpen(false)}
        onPressEscKey={() => setIsMoreOpen(false)}
        padding={0}
        className="rounded-lg bg-default"
      >
        <Box flexDirection={BoxFlexDirection.Column} padding={2} gap={1}>
          {MORE_CANDLE_PERIODS.map((period) => {
            const isSelected =
              selectedPeriod?.toLowerCase() === period.value?.toLowerCase();

            return (
              <ButtonBase
                key={period.value}
                className={twMerge(
                  '!px-2 !py-1.5 h-auto !min-w-16 rounded-lg text-left bg-transparent hover:bg-hover active:bg-pressed',
                  isSelected && 'bg-muted',
                )}
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
              </ButtonBase>
            );
          })}
        </Box>
      </Popover>
    </Box>
  );
};

export default PerpsCandlePeriodSelector;
