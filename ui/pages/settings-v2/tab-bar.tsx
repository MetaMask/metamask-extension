import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Text,
  TextColor,
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
  dataTestId?: string;
};

type TabSection = {
  key: string;
  title: React.ReactNode;
  items: TabItem[];
};

type TabBarProps = {
  tabs?: TabItem[];
  sections?: TabSection[];
  isActive: (key: string, content?: React.ReactNode) => boolean;
  /** When true, disables fullscreen styles (active background, hidden caret) */
  removeFullscreenStyles?: boolean;
  /** Called when a tab is clicked. Return `true` to prevent the default Link navigation. */
  onTabClick?: (key: string) => boolean | void;
};

const TabBar = ({
  tabs = [],
  sections = [],
  isActive,
  removeFullscreenStyles = false,
  onTabClick,
}: TabBarProps) => {
  const renderItems = (items: TabItem[]) =>
    items.map(({ key, content, iconName, dataTestId }) => {
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
          className={`!rounded-none focus:outline-none focus:[outline:none] focus-visible:outline-none focus-visible:[outline:none] focus:shadow-none ${activeClass}`}
          data-testid={dataTestId}
          onClick={
            onTabClick
              ? (e?: React.MouseEvent) => {
                  if (onTabClick(key) === true) {
                    e?.preventDefault();
                  }
                }
              : undefined
          }
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            className="w-full"
          >
            <Text fontWeight={FontWeight.Medium} className="whitespace-nowrap">
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
    });

  if (sections.length > 0) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="w-full h-full overflow-y-auto py-4"
        data-testid="settings-v2-tab-bar-grouped"
      >
        {sections.map(({ key, title, items }, sectionIndex) => (
          <Box
            key={key}
            flexDirection={BoxFlexDirection.Column}
            className="w-full"
          >
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
                {title}
              </Text>
            </Box>
            {renderItems(items)}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} className="w-full pt-2">
      {renderItems(tabs)}
    </Box>
  );
};

export default TabBar;
