import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
  ButtonBase,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type CategoryFilter = 'crypto' | 'stocks' | 'commodities' | 'forex';

export type CategoryBadgesProps = {
  /** Currently selected category filter (null means no category filter) */
  selectedCategory: CategoryFilter | null;
  /** Callback when a category is selected or cleared */
  onSelectCategory: (category: CategoryFilter | null) => void;
  /** Whether the watchlist filter is active */
  isWatchlistSelected: boolean;
  /** Callback to toggle the watchlist filter */
  onToggleWatchlist: () => void;
};

type CategoryOption = {
  id: CategoryFilter;
  labelKey: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'crypto', labelKey: 'perpsFilterCrypto' },
  { id: 'stocks', labelKey: 'perpsFilterStocks' },
  { id: 'commodities', labelKey: 'perpsFilterCommodities' },
  { id: 'forex', labelKey: 'perpsFilterForex' },
];

/**
 * Badge component for individual category or watchlist selection
 */
const Badge: React.FC<{
  label?: string;
  icon?: IconName;
  isSelected: boolean;
  onPress: () => void;
  onDismiss?: () => void;
  testId: string;
}> = ({ label, icon, isSelected, onPress, onDismiss, testId }) => {
  const handlePress = useCallback(() => {
    if (isSelected && onDismiss) {
      onDismiss();
    } else {
      onPress();
    }
  }, [isSelected, onPress, onDismiss]);

  const handleDismissClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDismiss?.();
    },
    [onDismiss],
  );

  return (
    <ButtonBase
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
        isSelected
          ? 'bg-primary-default'
          : 'bg-background-muted hover:bg-hover active:bg-pressed'
      }`}
      onClick={handlePress}
      data-testid={testId}
    >
      {icon && (
        <Icon
          name={icon}
          size={IconSize.Sm}
          color={isSelected ? IconColor.PrimaryInverse : IconColor.IconDefault}
        />
      )}
      {label && (
        <Text
          variant={TextVariant.BodySm}
          color={isSelected ? TextColor.PrimaryInverse : TextColor.TextDefault}
        >
          {label}
        </Text>
      )}
      {isSelected && onDismiss && (
        <Box
          as="span"
          className="ml-1 cursor-pointer"
          onClick={handleDismissClick}
          data-testid={`${testId}-dismiss`}
        >
          <Icon
            name={IconName.Close}
            size={IconSize.Xs}
            color={IconColor.PrimaryInverse}
          />
        </Box>
      )}
    </ButtonBase>
  );
};

/**
 * CategoryBadges displays a horizontal row of category filter badges
 * with a watchlist star badge at the start.
 *
 * When no filter is selected, all badges are shown.
 * When a filter is selected, only the selected badge is shown with a dismiss button.
 */
export const CategoryBadges: React.FC<CategoryBadgesProps> = ({
  selectedCategory,
  onSelectCategory,
  isWatchlistSelected,
  onToggleWatchlist,
}) => {
  const t = useI18nContext();

  // Determine if any filter is active
  const hasActiveFilter = isWatchlistSelected || selectedCategory !== null;

  // Get the label for the selected category
  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategory) return null;
    const option = CATEGORY_OPTIONS.find((opt) => opt.id === selectedCategory);
    return option ? t(option.labelKey) : null;
  }, [selectedCategory, t]);

  const handleCategorySelect = useCallback(
    (category: CategoryFilter) => {
      // If watchlist is selected, clear it first
      if (isWatchlistSelected) {
        onToggleWatchlist();
      }
      onSelectCategory(category);
    },
    [isWatchlistSelected, onToggleWatchlist, onSelectCategory],
  );

  const handleCategoryDismiss = useCallback(() => {
    onSelectCategory(null);
  }, [onSelectCategory]);

  const handleWatchlistSelect = useCallback(() => {
    // If a category is selected, clear it first
    if (selectedCategory !== null) {
      onSelectCategory(null);
    }
    onToggleWatchlist();
  }, [selectedCategory, onSelectCategory, onToggleWatchlist]);

  // Render selected state - only show the active filter badge
  if (hasActiveFilter) {
    if (isWatchlistSelected) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          data-testid="category-badges-selected"
        >
          <Badge
            icon={IconName.Star}
            isSelected
            onPress={handleWatchlistSelect}
            onDismiss={onToggleWatchlist}
            testId="category-badge-watchlist"
          />
        </Box>
      );
    }

    if (selectedCategory) {
      return (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          data-testid="category-badges-selected"
        >
          <Badge
            label={selectedCategoryLabel ?? ''}
            isSelected
            onPress={() => {}}
            onDismiss={handleCategoryDismiss}
            testId={`category-badge-${selectedCategory}`}
          />
        </Box>
      );
    }
  }

  // Render unselected state - show all badges
  return (
    <Box
      className="overflow-x-auto hide-scrollbar"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      data-testid="category-badges-unselected"
    >
      {/* Watchlist star badge */}
      <Badge
        icon={IconName.Star}
        isSelected={false}
        onPress={handleWatchlistSelect}
        testId="category-badge-watchlist"
      />

      {/* Category badges */}
      {CATEGORY_OPTIONS.map((option) => (
        <Badge
          key={option.id}
          label={t(option.labelKey)}
          isSelected={false}
          onPress={() => handleCategorySelect(option.id)}
          testId={`category-badge-${option.id}`}
        />
      ))}
    </Box>
  );
};

export default CategoryBadges;
