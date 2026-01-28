import React, { useCallback } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../components/component-library';
import { Skeleton } from '../../../../components/component-library/skeleton';
import {
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const PERCENTAGE_OPTIONS = [25, 50, 75, 100];

export type PercentageButtonsProps = {
  onPercentageClick: (percentage: number) => void;
};

export const PercentageButtons: React.FC<PercentageButtonsProps> = ({
  onPercentageClick,
}) => {
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
      data-testid="percentage-buttons"
    >
      {PERCENTAGE_OPTIONS.map((percentage) => (
        <Button
          key={percentage}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Sm}
          onClick={() => handleClick(percentage)}
          data-testid={`percentage-button-${percentage}`}
        >
          {percentage === 100 ? t('max') : `${percentage}%`}
        </Button>
      ))}
    </Box>
  );
};

export const PercentageButtonsSkeleton: React.FC = () => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      flexWrap={FlexWrap.Wrap}
      justifyContent={JustifyContent.center}
      gap={2}
      data-testid="percentage-buttons-skeleton"
    >
      {PERCENTAGE_OPTIONS.map((percentage) => (
        <Skeleton key={percentage} height={32} width={60} />
      ))}
    </Box>
  );
};
