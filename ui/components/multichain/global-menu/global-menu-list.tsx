import React from 'react';
import { MenuItem } from '../../ui/menu';
import {
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
  IconColor,
  TextColor,
  TextVariant,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  BoxBorderColor,
} from '@metamask/design-system-react';
import {
  GlobalMenuListProps,
  MenuItemContentProps,
  isRouteItem,
} from './global-menu-list.types';

/**
 * Component that renders the content inside a menu item
 * Handles displaying the label, badge, and chevron icon
 */
const MenuItemContent = ({
  label,
  badge,
  showChevron,
  textColor,
}: MenuItemContentProps) => {
  const hasBadge = Boolean(badge);
  const needsWrapper = hasBadge || showChevron;

  if (!needsWrapper) {
    return <Text color={textColor}>{label}</Text>;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
    >
      <Text color={textColor}>{label}</Text>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
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

/**
 * GlobalMenuList component that displays menu items organized into sections
 * Uses MenuItem component directly, matching the pattern from global-menu.tsx
 *
 * @param props - The component props
 * @param props.sections - Sections to display in the menu
 * @param props.className - Optional className for styling
 */
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
        <Box
          key={section.id}
          flexDirection={BoxFlexDirection.Column}
        >
          {/* Section Separator - Show before section if it's not the first section */}
          {sectionIndex > 0 && (
            <Box
              borderColor={BoxBorderColor.BorderMuted}
              className="w-full"
              style={{ height: '1px', borderBottomWidth: 0 }}
            />
          )}

          {/* Section Header */}
          {section.title && (
            <Box
              paddingLeft={4}
              paddingRight={4}
              paddingTop={sectionIndex > 0 ? 4 : 2}
              paddingBottom={2}
            >
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                style={{ textTransform: 'uppercase' }}
              >
                {section.title}
              </Text>
            </Box>
          )}

          {/* Section Items */}
          {section.items.map((item) => {
            const showChevron = item.showChevron !== false;
            const textColor = item.textColor || TextColor.TextDefault;

            return (
              <MenuItem
                key={item.id}
                iconName={item.iconName}
                iconSize={IconSize.Lg}
                textVariant={TextVariant.BodyMd}
                to={isRouteItem(item) ? item.to : undefined}
                onClick={item.onClick}
                disabled={item.disabled}
                showInfoDot={item.showInfoDot}
                subtitle={item.subtitle}
                data-testid={`global-menu-item-${item.id}`}
              >
                <MenuItemContent
                  label={item.label}
                  badge={item.badge}
                  showChevron={showChevron}
                  textColor={textColor}
                />
              </MenuItem>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};
