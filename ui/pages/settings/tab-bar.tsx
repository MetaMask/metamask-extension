import React from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
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
import { transitionForward } from '../../components/ui/transition';

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

type RenderTabItemsOptions = {
  items: TabItem[];
  isActive: TabBarProps['isActive'];
  removeFullscreenStyles: boolean;
  onTabClick?: TabBarProps['onTabClick'];
  navigate: NavigateFunction;
};

function navigateToTab(
  navigate: NavigateFunction,
  key: string,
  shouldAnimateNavigation: boolean,
) {
  if (!shouldAnimateNavigation) {
    navigate(key);
    return;
  }

  transitionForward(() => navigate(key));
}

function getTabClickHandler(
  navigate: NavigateFunction,
  key: string,
  shouldAnimateNavigation: boolean,
  onTabClick?: TabBarProps['onTabClick'],
) {
  return (event?: React.MouseEvent) => {
    event?.preventDefault();

    if (onTabClick?.(key) === true) {
      return;
    }

    navigateToTab(navigate, key, shouldAnimateNavigation);
  };
}

function renderTabItems({
  items,
  isActive,
  removeFullscreenStyles,
  onTabClick,
  navigate,
}: RenderTabItemsOptions) {
  return items.map(({ key, content, iconName, dataTestId }) => {
    const active = isActive(key, content);
    const activeClass =
      active && !removeFullscreenStyles ? 'sm:bg-pressed' : '';
    const caretClass = removeFullscreenStyles
      ? 'rtl:rotate-180'
      : 'sm:hidden rtl:rotate-180';
    const handleClick = getTabClickHandler(
      navigate,
      key,
      removeFullscreenStyles,
      onTabClick,
    );

    return (
      <MenuItem
        key={key}
        to={key}
        iconName={iconName}
        iconColor={IconColor.IconAlternative}
        iconSize={IconSize.Lg}
        textVariant={TextVariant.BodyMd}
        className={`!rounded-none hover:bg-hover focus:outline-none focus:[outline:none] focus-visible:outline-none focus-visible:[outline:none] focus:shadow-none ${activeClass}`}
        data-testid={dataTestId}
        onClick={handleClick}
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
}

function renderTabSections(
  sections: TabSection[],
  options: Omit<RenderTabItemsOptions, 'items'>,
) {
  return sections.map(({ key, title, items }, sectionIndex) => (
    <Box key={key} flexDirection={BoxFlexDirection.Column} className="w-full">
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
      {renderTabItems({ ...options, items })}
    </Box>
  ));
}

const TabBar = ({
  tabs = [],
  sections = [],
  isActive,
  removeFullscreenStyles = false,
  onTabClick,
}: TabBarProps) => {
  const navigate = useNavigate();
  const tabItemOptions = {
    isActive,
    removeFullscreenStyles,
    onTabClick,
    navigate,
  };

  if (sections.length > 0) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="w-full h-full overflow-y-auto py-4"
        data-testid="settings-tab-bar-grouped"
      >
        {renderTabSections(sections, tabItemOptions)}
      </Box>
    );
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} className="w-full pt-2">
      {renderTabItems({ ...tabItemOptions, items: tabs })}
    </Box>
  );
};

export default TabBar;
