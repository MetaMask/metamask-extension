import React, { useCallback } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../component-library';
import {
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const QUICK_PERCENTAGES = [10, 25, 50] as const;

export type PerpsWithdrawPercentageButtonsProps = {
  onPercentageClick: (percentage: number) => void;
  disabled?: boolean;
};

/**
 * Quick amount presets aligned with mobile Perps withdraw (10%, 25%, 50%, Max).
 * Deposit confirmations use a different set (25/50/75/100) inside pay flow.
 * @param options0
 * @param options0.onPercentageClick
 * @param options0.disabled
 */
export const PerpsWithdrawPercentageButtons: React.FC<
  PerpsWithdrawPercentageButtonsProps
> = ({ onPercentageClick, disabled = false }) => {
  const t = useI18nContext();

  const handleClick = useCallback(
    (percentage: number) => {
      onPercentageClick(percentage);
    },
    [onPercentageClick],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      flexWrap={FlexWrap.Wrap}
      justifyContent={JustifyContent.center}
      gap={2}
      data-testid="perps-withdraw-percentage-buttons"
    >
      {QUICK_PERCENTAGES.map((percentage) => (
        <Button
          key={percentage}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          disabled={disabled}
          onClick={() => handleClick(percentage)}
          data-testid={`perps-withdraw-percentage-${percentage}`}
        >
          {`${percentage}%`}
        </Button>
      ))}
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Sm}
        disabled={disabled}
        onClick={() => handleClick(100)}
        data-testid="perps-withdraw-percentage-max"
      >
        {t('max')}
      </Button>
    </Box>
  );
};
