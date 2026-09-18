import React, { useCallback, useMemo } from 'react';
import { Skeleton } from '@metamask/design-system-react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const PERCENTAGE_OPTIONS = [10, 25, 50, 90];
const MAX_PERCENTAGE = 100;

export type PercentageButtonsProps = {
  /**
   * When true, the last shortcut is Max (100%) instead of 90%. Matches mobile
   * `DepositKeyboard` `hasMax`.
   */
  hasMax?: boolean;
  disabled?: boolean;
  onPercentageClick: (percentage: number) => void;
};

export const PercentageButtons = ({
  hasMax = false,
  disabled = false,
  onPercentageClick,
}: PercentageButtonsProps) => {
  const t = useI18nContext();

  const percentages = useMemo(
    () =>
      hasMax
        ? [...PERCENTAGE_OPTIONS.slice(0, -1), MAX_PERCENTAGE]
        : PERCENTAGE_OPTIONS,
    [hasMax],
  );

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
      flexWrap={FlexWrap.NoWrap}
      justifyContent={JustifyContent.center}
      gap={3}
      width={BlockSize.Full}
      paddingTop={3}
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={4}
      data-testid="percentage-buttons"
    >
      {percentages.map((percentage) => (
        <Button
          key={percentage}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          disabled={disabled}
          onClick={() => handleClick(percentage)}
          data-testid={`percentage-button-${percentage}`}
          style={{ flex: 1 }}
        >
          {percentage === MAX_PERCENTAGE ? t('max') : `${percentage}%`}
        </Button>
      ))}
    </Box>
  );
};

export const PercentageButtonsSkeleton = () => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      flexWrap={FlexWrap.NoWrap}
      justifyContent={JustifyContent.center}
      gap={3}
      width={BlockSize.Full}
      paddingTop={3}
      paddingBottom={4}
      paddingLeft={4}
      paddingRight={4}
      data-testid="percentage-buttons-skeleton"
    >
      {PERCENTAGE_OPTIONS.map((percentage) => (
        <Skeleton key={percentage} height={32} width={60} />
      ))}
    </Box>
  );
};
