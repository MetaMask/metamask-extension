import React, { ReactNode } from 'react';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
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
        marginLeft={2}
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
          {sectionIndex > 0 && !section.hideDividerAbove && (
            <Box className="w-full px-2 py-2">
              <Box className="w-full border-t border-muted" />
            </Box>
          )}

          {/* Section Header */}
          {section.title && (
            <Box
              className="mx-4"
              paddingTop={sectionIndex > 0 ? 4 : 2}
              paddingBottom={2}
            >
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
              >
                {section.title}
              </Text>
            </Box>
          )}

          {/* Section Items */}
          {section.items.map((item) => {
            // Show chevron for route items or when explicitly requested (e.g. notifications)
            const showChevron = isRouteItem(item) || item.showChevron === true;
            return (
              <MenuItem
                key={item.id}
                iconName={item.iconName}
                iconSize={item.iconSize ?? IconSize.Lg}
                iconColor={item.iconColor ?? IconColor.IconAlternative}
                textVariant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                textColor={item.textColor}
                to={isRouteItem(item) ? item.to : undefined}
                state={isRouteItem(item) ? item.state : undefined}
                onClick={item.onClick}
                disabled={item.disabled}
                showInfoDot={item.showInfoDot}
                subtitle={item.subtitle}
                data-testid={item.id}
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
