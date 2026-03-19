import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
  IconColor,
} from '@metamask/design-system-react';

type TabItem = {
  key: string;
  content: React.ReactNode;
  iconName: IconName;
};

type TabBarProps = {
  tabs: TabItem[];
  isActive: (key: string, content?: React.ReactNode) => boolean;
  onSelect?: (key: string) => void;
  /** When true, disables fullscreen styles (active background, hidden caret) */
  removeFullscreenStyles?: boolean;
};

const TabBar = ({
  tabs = [],
  onSelect,
  isActive,
  removeFullscreenStyles = false,
}: TabBarProps) => {
  return (
    <Box flexDirection={BoxFlexDirection.Column} className="w-full">
      {tabs.map(({ key, content, iconName }) => {
        const active = isActive(key, content);

        const activeClass = active && !removeFullscreenStyles
          ? 'sm:bg-background-muted'
          : 'sm:bg-transparent';
        const caretClass = removeFullscreenStyles
          ? 'ml-auto rtl:rotate-180'
          : 'sm:hidden ml-auto rtl:rotate-180';

        return (
          <Box
            key={key}
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            onClick={() => onSelect?.(key)}
            paddingVertical={3}
            paddingHorizontal={4}
            gap={4}
            className={`cursor-pointer ${activeClass}`}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
            >
              <Icon name={iconName} color={IconColor.IconAlternative} />
              <Text variant={TextVariant.BodyMd} className="whitespace-nowrap">
                {content}
              </Text>
            </Box>
            <Icon
              name={IconName.ArrowRight}
              size={IconSize.Sm}
              color={IconColor.IconAlternative}
              className={caretClass}
            />
          </Box>
        );
      })}
    </Box>
  );
};

export default TabBar;
