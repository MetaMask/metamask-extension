import React from 'react';
import {
  twMerge,
  Box,
  Text,
  TextVariant,
  FontWeight,
  BoxFlexDirection,
  ButtonBase,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import type { DirectionTabsProps, OrderDirection } from '../../order-entry.types';

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

  // Base styles for both tabs
  const tabBaseStyles = 'flex-1 py-3 rounded-lg transition-colors';

  // Long tab styles
  const longTabStyles = twMerge(
    tabBaseStyles,
    direction === 'long'
      ? 'bg-success-muted'
      : 'bg-transparent hover:bg-muted-hover active:bg-muted-pressed',
  );

  // Short tab styles
  const shortTabStyles = twMerge(
    tabBaseStyles,
    direction === 'short'
      ? 'bg-error-muted'
      : 'bg-transparent hover:bg-muted-hover active:bg-muted-pressed',
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      className="w-full bg-muted rounded-xl p-1 gap-1"
      data-testid="direction-tabs"
    >
      {/* Long Tab */}
      <ButtonBase
        className={longTabStyles}
        onClick={() => handleDirectionClick('long')}
        data-testid="direction-tab-long"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          className={twMerge(
            'text-center w-full',
            direction === 'long' ? 'text-success-default' : 'text-muted',
          )}
        >
          {t('perpsLong')}
        </Text>
      </ButtonBase>

      {/* Short Tab */}
      <ButtonBase
        className={shortTabStyles}
        onClick={() => handleDirectionClick('short')}
        data-testid="direction-tab-short"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          className={twMerge(
            'text-center w-full',
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
