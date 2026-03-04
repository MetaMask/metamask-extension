import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  twMerge,
} from '@metamask/design-system-react';
import { TabsProps, TabChild } from './tabs.types';

function startTransition(
  direction: 'forward' | 'backward',
  update: () => void,
) {
  if (document.startViewTransition) {
    document.documentElement.dataset.tabTransitionDirection = direction;

    const transition = document.startViewTransition(update);

    transition.finished.then(() => {
      delete document.documentElement.dataset.tabTransitionDirection;
    });
  } else {
    update();
  }
}

export const Tabs = <TKey extends string = string>({
  activeTab,
  onTabClick,
  children,
  subHeader = null,
  tabListProps = {},
  tabContentProps = {},
  className = '',
  animated,
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
  const findChildByKey = useCallback(
    (tabKey?: TKey): number => {
      if (!tabKey) {
        return -1;
      }
      return getValidChildren.findIndex(
        (child) => child.props.tabKey === tabKey,
      );
    },
    [getValidChildren],
  );

  const [activeTabIndex, setActiveTabIndex] = useState<number>(() =>
    Math.max(findChildByKey(activeTab), 0),
  );

  useEffect(() => {
    const childIndex = findChildByKey(activeTab);
    if (childIndex >= 0 && activeTabIndex !== childIndex) {
      setActiveTabIndex(childIndex);
    }
  }, [activeTab, findChildByKey, activeTabIndex]);

  const handleTabClick = (tabIndex: number, tabKey: TKey): void => {
    if (tabIndex !== activeTabIndex) {
      const direction = tabIndex > activeTabIndex ? 'forward' : 'backward';

      const applyUpdate = () => {
        setActiveTabIndex(tabIndex);
        onTabClick?.(tabKey);
      };

      if (animated) {
        startTransition(direction, applyUpdate);
      } else {
        applyUpdate();
      }
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
        isActive: numberOfTabs > 1 && index === activeTabIndex,
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
      <Box
        role="tabpanel"
        {...tabContentProps}
        style={{
          ...tabContentProps?.style,
          ...(animated ? { viewTransitionName: 'tab-content' } : undefined),
        }}
      >
        {renderActiveTabContent()}
      </Box>
    </Box>
  );
};
