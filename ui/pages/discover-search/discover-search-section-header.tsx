import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

export type DiscoverSearchSectionHeaderProps = {
  title: string;
  onViewAll?: () => void;
  /** When null/undefined and showViewAll is false, the action is hidden. */
  viewAllLabel?: string | null;
  showViewAll?: boolean;
  'data-testid'?: string;
};

/**
 * Section header with optional "View all" / "View X more" action (All tab preview).
 * @param options0
 * @param options0.title
 * @param options0.onViewAll
 * @param options0.viewAllLabel
 * @param options0.showViewAll
 * @param options0.'data-testid'
 */
export const DiscoverSearchSectionHeader = ({
  title,
  onViewAll,
  viewAllLabel,
  showViewAll = true,
  'data-testid': dataTestId,
}: DiscoverSearchSectionHeaderProps) => {
  const shouldShowViewAll =
    showViewAll && Boolean(onViewAll) && Boolean(viewAllLabel);

  return (
    <Box
      className="px-4 pb-3 pt-3"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      data-testid={dataTestId}
    >
      <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
        {title}
      </Text>
      {shouldShowViewAll ? (
        <ButtonBase
          className="h-auto gap-1 rounded-none bg-transparent px-0 py-0 hover:bg-transparent active:bg-transparent"
          onClick={onViewAll}
          data-testid={`${dataTestId ?? 'discover-section'}-view-all`}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {viewAllLabel}
          </Text>
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Md}
            color={IconColor.IconAlternative}
          />
        </ButtonBase>
      ) : null}
    </Box>
  );
};
