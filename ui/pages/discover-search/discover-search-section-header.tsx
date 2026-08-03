import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

import { useI18nContext } from '../../hooks/useI18nContext';

export type DiscoverSearchSectionHeaderProps = {
  title: string;
  onViewAll?: () => void;
  showViewAll?: boolean;
  'data-testid'?: string;
};

/**
 * Section header with optional "View all" action (All tab preview).
 * @param options0
 * @param options0.title
 * @param options0.onViewAll
 * @param options0.showViewAll
 * @param options0.'data-testid'
 */
export const DiscoverSearchSectionHeader = ({
  title,
  onViewAll,
  showViewAll = true,
  'data-testid': dataTestId,
}: DiscoverSearchSectionHeaderProps) => {
  const t = useI18nContext();

  return (
    <Box
      className="px-4 py-2"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      data-testid={dataTestId}
    >
      <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
        {title}
      </Text>
      {showViewAll && onViewAll ? (
        <ButtonBase
          className="h-auto rounded-none bg-transparent px-0 py-0 hover:bg-transparent active:bg-transparent"
          onClick={onViewAll}
          data-testid={`${dataTestId ?? 'discover-section'}-view-all`}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.PrimaryDefault}>
            {t('viewAll')}
          </Text>
        </ButtonBase>
      ) : null}
    </Box>
  );
};
