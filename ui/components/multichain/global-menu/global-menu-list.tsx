import React from 'react';
import { MenuItem } from '../../ui/menu';
import { Box, Text, Icon, IconName, IconSize } from '../../component-library';
import {
  Display,
  FlexDirection,
  BlockSize,
  BorderColor,
  TextVariant,
  TextColor,
  IconColor,
  AlignItems,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { GlobalMenuSection, isRouteItem } from './global-menu-list.types';
import { NotificationsTagCounter } from '../notifications-tag-counter';

type GlobalMenuListProps = {
  /**
   * Sections to display in the menu
   */
  sections: GlobalMenuSection[];
  /**
   * Optional className for styling
   */
  className?: string;
};

/**
 * GlobalMenuList component that displays menu items organized into sections
 * Uses MenuItem component directly, matching the pattern from global-menu.tsx
 */
export const GlobalMenuList = ({
  sections,
  className = '',
}: GlobalMenuListProps) => {
  return (
    <Box
      className={`global-menu-list ${className}`}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      {sections.map((section, sectionIndex) => (
        <Box
          key={sectionIndex}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
        >
          {/* Section Separator - Show before section if it's not the first section */}
          {sectionIndex > 0 && (
            <Box
              borderColor={BorderColor.borderMuted}
              width={BlockSize.Full}
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
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
                style={{ textTransform: 'uppercase' }}
              >
                {section.title}
              </Text>
            </Box>
          )}

          {/* Section Items */}
          {section.items.map((item) => {
            const showChevron = item.showChevron !== false;
            const hasBadge = Boolean(item.badge);
            const iconColor = item.iconColor ?? IconColor.iconAlternative;
            const textColor = item.textColor ?? TextColor.textDefault;

            // Render content with badge/chevron on right
            const renderContent = () => {
              // If there's a badge or chevron, wrap in Box for flex layout
              if (hasBadge || showChevron) {
                return (
                  <Box
                    display={Display.Flex}
                    flexDirection={FlexDirection.Row}
                    alignItems={AlignItems.center}
                    justifyContent={JustifyContent.spaceBetween}
                  >
                    <Text color={textColor}>{item.label}</Text>
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                      alignItems={AlignItems.center}
                      gap={2}
                    >
                      {hasBadge &&
                        (typeof item.badge === 'number' ? (
                          <NotificationsTagCounter />
                        ) : (
                          item.badge
                        ))}
                      {showChevron && (
                        <Icon
                          name={IconName.ArrowRight}
                          size={IconSize.Sm}
                          color={IconColor.iconAlternative}
                        />
                      )}
                    </Box>
                  </Box>
                );
              }

              // Otherwise just render the label
              return <Text color={textColor}>{item.label}</Text>;
            };

            return (
              <MenuItem
                key={item.id}
                iconName={item.iconName}
                iconColor={iconColor}
                iconSize={IconSize.Lg}
                textVariant={TextVariant.bodyMd}
                to={isRouteItem(item) ? item.to : undefined}
                onClick={item.onClick}
                disabled={item.disabled}
                showInfoDot={item.showInfoDot}
                subtitle={item.subtitle}
                data-testid={`global-menu-item-${item.id}`}
              >
                {renderContent()}
              </MenuItem>
            );
          })}
        </Box>
      ))}
    </Box>
  );
};
