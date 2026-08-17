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
import { isViewTransitionSupported } from '../transition';
import { TabsProps, TabChild } from './tabs.types';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

// Identifies the most recently started tab transition so a superseded one's
// cleanup doesn't tear down state the newer transition just set up.
let latestTabTransitionId = 0;

async function startTransition(
  direction: 'forward' | 'backward',
  update: () => void,
  panel: HTMLElement | null,
) {
  if (!isViewTransitionSupported()) {
    update();
    return;
  }

  latestTabTransitionId += 1;
  const transitionId = latestTabTransitionId;
  document.documentElement.dataset.tabTransitionDirection = direction;
  // Name the panel only during the tab switch; a persistent name would also be
  // captured by unrelated (e.g. page) transitions, where it overflows.
  if (panel) {
    panel.style.viewTransitionName = 'tab-content';
  }

  const transition = document.startViewTransition(update);

  try {
    await transition.finished;
  } catch {
    // A rapid switch aborts the in-flight transition, rejecting
    // `finished`. That's expected — swallow it to avoid unhandled rejection.
  } finally {
    // Skip cleanup if a newer transition has taken over
    if (transitionId === latestTabTransitionId) {
      delete document.documentElement.dataset.tabTransitionDirection;
      if (panel) {
        panel.style.viewTransitionName = '';
      }
    }
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

  /**
   * Returns indices of tabs that are not disabled, for keyboard navigation.
   */
  const getEnabledTabIndices = (): number[] => {
    return getValidChildren.reduce<number[]>((indices, child, index) => {
      if (!child.props.disabled) {
        indices.push(index);
      }
      return indices;
    }, []);
  };

  /**
   * Focuses the tab button at the given index within the tab list.
   *
   * @param index - Zero-based index of the tab to focus.
   */
  const focusTabAtIndex = (index: number): void => {
    const tabs =
      tabListRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs?.[index]?.focus();
  };

  /**
   * Activates and focuses the tab at the given index if it is enabled.
   * Follows the WAI-ARIA Tabs "automatic activation" pattern used by
   * Chakra UI and Radix UI: arrow keys both move focus and select the tab.
   *
   * @param index - Zero-based index of the tab to activate.
   * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
   */
  const activateTabByIndex = (index: number): void => {
    const child = getValidChildren[index];
    if (!child || child.props.disabled) {
      return;
    }

    handleTabClick(index, child.props.tabKey);
    focusTabAtIndex(index);
  };

  /**
   * Keyboard handler for the tab list (WAI-ARIA Tabs pattern).
   * - ArrowRight / ArrowLeft: move to next / previous enabled tab (wraps)
   * - Home / End: first / last enabled tab
   * Disabled tabs are skipped.
   *
   * @param event - Keyboard event from the tablist.
   * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
   * @see https://chakra-ui.com/docs/components/tabs
   * @see https://www.radix-ui.com/primitives/docs/components/tabs
   */
  const handleTabListKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ): void => {
    const enabledIndices = getEnabledTabIndices();
    if (enabledIndices.length === 0) {
      return;
    }

    let currentEnabledPos = enabledIndices.indexOf(clampedIndex);
    if (currentEnabledPos === -1) {
      // Active tab may be disabled; fall back to the nearest enabled tab
      // before the active index, or the first enabled tab.
      currentEnabledPos = enabledIndices.findLastIndex(
        (index) => index < clampedIndex,
      );
      if (currentEnabledPos === -1) {
        currentEnabledPos = 0;
      }
    }

    let nextIndex: number | undefined;

    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault();
        const nextPos = (currentEnabledPos + 1) % enabledIndices.length;
        nextIndex = enabledIndices[nextPos];
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const nextPos =
          (currentEnabledPos - 1 + enabledIndices.length) %
          enabledIndices.length;
        nextIndex = enabledIndices[nextPos];
        break;
      }
      case 'Home': {
        event.preventDefault();
        nextIndex = enabledIndices[0];
        break;
      }
      case 'End': {
        event.preventDefault();
        nextIndex = enabledIndices.at(-1);
        break;
      }
      default:
        return;
    }

    if (nextIndex !== undefined) {
      activateTabByIndex(nextIndex);
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
    return (
      <React.Fragment key={activeChild.props.tabKey}>
        {activeChild.props.children}
      </React.Fragment>
    );
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
        onKeyDown={handleTabListKeyDown}
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
