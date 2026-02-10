import React, { ReactNode } from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { MenuItem } from '../../ui/menu';
import { GlobalMenuListProps, isRouteItem } from './global-menu-list.types';

/**
 * Renders menu item content with badge and chevron
 *
 * @param label
 * @param badge
 * @param showChevron
 */
const renderMenuItemContent = (
  label: string | ReactNode,
  badge?: ReactNode,
  showChevron?: boolean,
): ReactNode => {
  const hasBadge = Boolean(badge);
  const needsWrapper = hasBadge || showChevron;

  if (!needsWrapper) {
    return label;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      className="w-full"
    >
      <Box className="flex-1 min-w-0">{label}</Box>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        className="flex-shrink-0"
      >
        {hasBadge && badge}
        {showChevron && (
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        )}
      </Box>
    </Box>
  );
};

export const GlobalMenuList = ({
  sections,
  className = '',
}: GlobalMenuListProps) => {
  return (
    <Box
      className={`global-menu-list ${className}`}
      flexDirection={BoxFlexDirection.Column}
    >
      {sections.map((section, sectionIndex) => (
        <Box key={section.id} flexDirection={BoxFlexDirection.Column}>
          {/* Section Separator - Show before section if it's not the first section */}
          {sectionIndex > 0 && <Box className="w-full border-t border-muted" />}

          {/* Section Header */}
          {section.title && (
            <Box
              className="mx-4"
              paddingTop={sectionIndex > 0 ? 4 : 2}
              paddingBottom={2}
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {section.title}
              </Text>
            </Box>
          )}

          {/* Section Items */}
          {section.items.map((item) => {
            // Show chevron for route items that have a valid route
            const showChevron = isRouteItem(item);
            return (
              <MenuItem
                key={item.id}
                iconName={item.iconName}
                iconSize={item.iconSize ?? IconSize.Lg}
                iconColor={item.iconColor}
                textColor={item.textColor}
                to={isRouteItem(item) ? item.to : undefined}
                onClick={item.onClick}
                disabled={item.disabled}
                showInfoDot={item.showInfoDot}
                subtitle={item.subtitle}
                data-testid={`global-menu-item-${item.id}`}
              >
                {renderMenuItemContent(item.label, item.badge, showChevron)}
              </MenuItem>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};
