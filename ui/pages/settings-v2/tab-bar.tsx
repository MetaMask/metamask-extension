import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextVariant,
  BoxAlignItems,
  BoxJustifyContent,
  FontWeight,
} from '@metamask/design-system-react';
import MenuItem from '../../components/ui/menu/menu-item';

type TabItem = {
  key: string;
  content: React.ReactNode;
  iconName: IconName;
};

type TabBarProps = {
  tabs: TabItem[];
  isActive: (key: string, content?: React.ReactNode) => boolean;
  /** When true, disables fullscreen styles (active background, hidden caret) */
  removeFullscreenStyles?: boolean;
};

const TabBar = ({
  tabs = [],
  isActive,
  removeFullscreenStyles = false,
}: TabBarProps) => {
  return (
    <Box flexDirection={BoxFlexDirection.Column} className="w-full">
      {tabs.map(({ key, content, iconName }) => {
        const active = isActive(key, content);

        const activeClass =
          active && !removeFullscreenStyles ? 'sm:bg-background-muted' : '';

        const caretClass = removeFullscreenStyles
          ? 'rtl:rotate-180'
          : 'sm:hidden rtl:rotate-180';

        return (
          <MenuItem
            key={key}
            to={key}
            iconName={iconName}
            iconColor={IconColor.IconAlternative}
            iconSize={IconSize.Lg}
            textVariant={TextVariant.BodyMd}
            className={`!rounded-none ${activeClass}`}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Between}
              className="w-full"
            >
              <Text
                fontWeight={FontWeight.Medium}
                className="whitespace-nowrap"
              >
                {content}
              </Text>
              <Icon
                name={IconName.ArrowRight}
                size={IconSize.Sm}
                color={IconColor.IconAlternative}
                className={caretClass}
              />
            </Box>
          </MenuItem>
        );
      })}
    </Box>
  );
};

export default TabBar;
