import React, { useCallback, useState } from 'react';
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
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { CandlePeriod, DEFAULT_CANDLE_PERIODS } from '../constants/chartConfig';
import { PerpsCandlePeriodModal } from './perps-candle-period-modal';
import {
  getCandlePeriodLabel,
  isMatchingPeriod,
} from './perps-candle-period-utils';

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
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  const isMorePeriodSelected = !DEFAULT_CANDLE_PERIODS.some((period) =>
    isMatchingPeriod(selectedPeriod, period.value),
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

  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Start}
        gap={1}
        paddingTop={2}
        paddingBottom={2}
        paddingLeft={4}
        paddingRight={4}
        data-testid="perps-candle-period-selector"
      >
        {DEFAULT_CANDLE_PERIODS.map((period) => {
          const isSelected = isMatchingPeriod(selectedPeriod, period.value);

          return (
            <ButtonBase
              key={period.value}
              className={twMerge(
                'py-1.5 h-auto min-w-12 rounded-lg bg-transparent hover:bg-hover active:bg-pressed',
                isSelected && 'bg-muted',
              )}
              onClick={() => emitPeriodChange(period.value)}
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

        <ButtonBase
          className={twMerge(
            'py-1.5 h-auto min-w-12 rounded-lg flex items-center gap-1 bg-transparent hover:bg-hover active:bg-pressed',
            isMorePeriodSelected && 'bg-muted',
          )}
          onClick={() => setIsMoreModalOpen(true)}
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
      </Box>

      <PerpsCandlePeriodModal
        isOpen={isMoreModalOpen}
        selectedPeriod={selectedPeriod}
        onClose={() => setIsMoreModalOpen(false)}
        onPeriodChange={emitPeriodChange}
      />
    </>
  );
};

export default PerpsCandlePeriodSelector;
