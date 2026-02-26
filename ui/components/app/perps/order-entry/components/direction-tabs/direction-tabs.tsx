import React from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type {
  DirectionTabsProps,
  OrderDirection,
} from '../../order-entry.types';

/**
 * DirectionTabs - Segmented control for selecting Long or Short order direction
 *
 * @param props - Component props
 * @param props.direction - Currently selected direction
 * @param props.onDirectionChange - Callback when direction changes
 */
export const DirectionTabs: React.FC<DirectionTabsProps> = ({
  direction,
  onDirectionChange,
}) => {
  const t = useI18nContext();

  const handleDirectionClick = (newDirection: OrderDirection) => {
    if (newDirection !== direction) {
      onDirectionChange(newDirection);
    }
  };

  const tabBaseStyles = 'flex-1 py-0 rounded-lg transition-colors text-center';

  const longTabStyles = twMerge(
    tabBaseStyles,
    direction === 'long'
      ? 'bg-success-muted h-8'
      : 'bg-transparent hover:bg-muted-hover active:bg-muted-pressed h-8',
  );

  const shortTabStyles = twMerge(
    tabBaseStyles,
    direction === 'short'
      ? 'bg-error-muted h-8'
      : 'bg-transparent hover:bg-muted-hover active:bg-muted-pressed h-8',
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      className="flex-1 min-w-0 h-10 bg-transparent border border-border-muted rounded-lg py-0 px-1 gap-1"
      data-testid="direction-tabs"
    >
      <ButtonBase
        className={longTabStyles}
        onClick={() => handleDirectionClick('long')}
        data-testid="direction-tab-long"
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          className={twMerge(
            'w-full',
            direction === 'long' ? 'text-success-default' : 'text-muted',
          )}
        >
          {t('perpsLong')}
        </Text>
      </ButtonBase>

      <ButtonBase
        className={shortTabStyles}
        onClick={() => handleDirectionClick('short')}
        data-testid="direction-tab-short"
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          className={twMerge(
            'w-full',
            direction === 'short' ? 'text-error-default' : 'text-muted',
          )}
        >
          {t('perpsShort')}
        </Text>
      </ButtonBase>
    </Box>
  );
};

export default DirectionTabs;
