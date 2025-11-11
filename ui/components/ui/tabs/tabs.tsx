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
  activeTabKey,
  onTabClick,
  children,
  subHeader = null,
  tabListProps = {},
  tabContentProps = {},
  className = '',
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

  // If activeTabKey is provided (controlled mode), use it. Otherwise use internal state.
  const isControlled = activeTabKey !== undefined;
  const currentActiveIndex = isControlled
    ? Math.max(findChildByKey(activeTabKey), 0)
    : activeTabIndex;

  const handleTabClick = (tabIndex: number, tabKey: TKey): void => {
    if (tabIndex !== currentActiveIndex) {
      // Update internal state only in uncontrolled mode
      if (!isControlled) {
        setActiveTabIndex(tabIndex);
      }
      onTabClick?.(tabKey);
    }
  };

  const renderTabs = (): React.ReactNode => {
    const validChildren = getValidChildren;
    const numberOfTabs = validChildren.length;

    return validChildren.map((child, index) => {
      const { tabKey } = child.props;

      return React.cloneElement(child, {
        ...child.props,
        onClick: (idx: number) => handleTabClick(idx, tabKey),
        tabIndex: index,
        isActive: numberOfTabs > 1 && index === currentActiveIndex,
        key: tabKey,
      });
    });
  };

  const renderActiveTabContent = (): React.ReactNode => {
    const validChildren = getValidChildren;

    if (validChildren.length === 0) {
      return null;
    }

    if (currentActiveIndex >= validChildren.length || currentActiveIndex < 0) {
      throw new Error(`Tab at index '${currentActiveIndex}' does not exist`);
    }

    const activeChild = validChildren[currentActiveIndex];
    return activeChild?.props.children || null;
  };

  return (
    <Box className={twMerge('tabs', 'transform-gpu', className)} {...props}>
      <Box
        role="tablist"
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Start}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        gap={4}
        {...tabListProps}
      >
        {renderTabs()}
      </Box>
      {subHeader}
      <Box role="tabpanel" {...tabContentProps}>
        {renderActiveTabContent()}
      </Box>
    </Box>
  );
};
