import React from 'react';
import {
  Box,
  ButtonFilter,
  ButtonBaseSize,
  twMerge,
} from '@metamask/design-system-react';

export type FilterTab = {
  /** Stable, unique identifier for the tab. Returned via `onSelect`. */
  key: string;
  /** Visible label rendered inside the filter button. */
  label: string;
  /** Optional test id applied to the underlying button. */
  testId?: string;
};

export type FilterTabBarProps = {
  /** Ordered list of tabs to render. */
  tabs: FilterTab[];
  /** Key of the currently selected tab. */
  selectedKey: string;
  /** Called with the tab key when a tab is clicked. */
  onSelect: (key: string) => void;
  /** Optional class names applied to the scrollable wrapper. */
  className?: string;
};

/**
 * A horizontally scrollable row of filter pills built on the design-system
 * `ButtonFilter`. Renders a single active tab driven by `selectedKey` and
 * reports clicks through `onSelect`.
 *
 * @param props - The component props.
 * @param props.tabs - Ordered list of tabs to render.
 * @param props.selectedKey - Key of the currently selected tab.
 * @param props.onSelect - Called with the tab key when a tab is clicked.
 * @param props.className - Optional class names applied to the scrollable wrapper.
 * @returns The rendered filter tab bar.
 */
export const FilterTabBar = ({
  tabs,
  selectedKey,
  onSelect,
  className,
}: FilterTabBarProps) => (
  <Box
    className={twMerge(
      'flex flex-row gap-2 overflow-x-auto px-4 py-1',
      className,
    )}
  >
    {tabs.map((tab) => (
      <ButtonFilter
        key={tab.key}
        isActive={tab.key === selectedKey}
        size={ButtonBaseSize.Sm}
        onClick={() => onSelect(tab.key)}
        className="flex-shrink-0"
        data-testid={tab.testId}
      >
        {tab.label}
      </ButtonFilter>
    ))}
  </Box>
);
