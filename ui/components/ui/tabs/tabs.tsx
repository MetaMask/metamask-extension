import React, { useState, useMemo } from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  twMerge,
} from '@metamask/design-system-react';
import { TabsProps, TabChild } from './tabs.types';

export const Tabs = <TKey extends string = string>({
  defaultActiveTabKey,
  onTabClick,
  children,
  tabsClassName = '',
  subHeader = null,
  tabListProps = {},
  tabContentProps = {},
  ...props
}: TabsProps<TKey>) => {
  // Helper function to get valid children, filtering out null/undefined/false values
  const getValidChildren = useMemo((): TabChild<TKey>[] => {
    return React.Children.toArray(children).filter(
      (child): child is TabChild<TKey> =>
        React.isValidElement(child) &&
        child.props &&
        typeof child.props.tabKey === 'string',
    );
  }, [children]);

  /**
   * Returns the index of the child with the given key
   *
   * @param tabKey
   */
  const findChildByKey = (tabKey?: TKey): number => {
    if (!tabKey) {
      return -1;
    }
    return getValidChildren.findIndex((child) => child.props.tabKey === tabKey);
  };

  const [activeTabIndex, setActiveTabIndex] = useState<number>(() =>
    Math.max(findChildByKey(defaultActiveTabKey), 0),
  );

  const handleTabClick = (tabIndex: number, tabKey: TKey): void => {
    if (tabIndex !== activeTabIndex) {
      setActiveTabIndex(tabIndex);
      onTabClick?.(tabKey);
    }
  };

  const renderTabs = (): React.ReactNode => {
    const validChildren = getValidChildren;
    const numberOfTabs = validChildren.length;

    return validChildren.map((child, index) => {
      const { tabKey } = child.props;
      const isSingleTab = numberOfTabs === 1;

      return React.cloneElement(child, {
        ...child.props,
        onClick: (idx: number) => handleTabClick(idx, tabKey),
        tabIndex: index,
        isActive: numberOfTabs > 1 && index === activeTabIndex,
        isSingleTab,
        key: tabKey,
      });
    });
  };

  const renderActiveTabContent = (): React.ReactNode => {
    const validChildren = getValidChildren;

    if (validChildren.length === 0) {
      return null;
    }

    if (activeTabIndex >= validChildren.length || activeTabIndex < 0) {
      throw new Error(`Tab at index '${activeTabIndex}' does not exist`);
    }

    const activeChild = validChildren[activeTabIndex];
    return activeChild?.props.children || null;
  };

  return (
    <Box
      className={twMerge('tabs', 'transform-gpu', props.className)}
      {...props}
    >
      <Box
        role="tablist"
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Start}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        gap={0}
        {...tabListProps}
        className={twMerge(
          'tabs__list',
          'top-0 z-[2]',
          tabsClassName,
          tabListProps?.className,
        )}
      >
        {renderTabs()}
      </Box>
      {subHeader}
      <Box
        role="tabpanel"
        {...tabContentProps}
        className={twMerge('tabs__content', tabContentProps?.className || '')}
      >
        {renderActiveTabContent()}
      </Box>
    </Box>
  );
};
