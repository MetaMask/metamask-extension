import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  twMerge,
} from '@metamask/design-system-react';
import { getBrowserName } from '../../../../shared/lib/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { TabsProps, TabChild } from './tabs.types';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

async function startTransition(
  direction: 'forward' | 'backward',
  update: () => void,
  panel: HTMLElement | null,
) {
  if (document.startViewTransition && getBrowserName() !== PLATFORM_FIREFOX) {
    document.documentElement.dataset.tabTransitionDirection = direction;
    // Name the panel only during the tab switch; a persistent name would also be
    // captured by unrelated (e.g. page) transitions, where it overflows.
    if (panel) {
      panel.style.viewTransitionName = 'tab-content';
    }

    const transition = document.startViewTransition(update);

    try {
      await transition.finished;
    } finally {
      delete document.documentElement.dataset.tabTransitionDirection;
      if (panel) {
        panel.style.viewTransitionName = '';
      }
    }
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
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

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
    if (childIndex >= 0) {
      setActiveTabIndex(childIndex);
    }
  }, [activeTab, findChildByKey]);

  const clampedIndex =
    getValidChildren.length > 0
      ? clamp(activeTabIndex, 0, getValidChildren.length - 1)
      : 0;

  useLayoutEffect(() => {
    const childIndex = findChildByKey(activeTab);
    const index = childIndex >= 0 ? childIndex : clampedIndex;
    const tabs = tabListRef.current?.querySelectorAll('[role="tab"]');

    tabs?.[index]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest',
    });
  }, [activeTab, findChildByKey, clampedIndex]);

  const handleTabClick = (tabIndex: number, tabKey: TKey): void => {
    if (tabIndex !== clampedIndex) {
      const direction = tabIndex > clampedIndex ? 'forward' : 'backward';

      const applyUpdate = () => {
        onTabClick?.(tabKey);
        setActiveTabIndex(tabIndex);
      };

      if (animated) {
        startTransition(direction, applyUpdate, tabContentRef.current);
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
        isActive: numberOfTabs > 1 && index === clampedIndex,
        key: tabKey,
      });
    });
  };

  const renderActiveTabContent = (): React.ReactNode => {
    const validChildren = getValidChildren;

    if (validChildren.length === 0) {
      return null;
    }

    const activeChild = validChildren[clampedIndex];
    return activeChild?.props.children || null;
  };

  return (
    <Box className={twMerge('tabs', 'transform-gpu', className)} {...props}>
      <Box
        ref={tabListRef}
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
      <Box ref={tabContentRef} role="tabpanel" {...tabContentProps}>
        {renderActiveTabContent()}
      </Box>
    </Box>
  );
};
