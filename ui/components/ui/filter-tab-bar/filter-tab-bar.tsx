import React from 'react';
import { ButtonFilter, ButtonBaseSize } from '@metamask/design-system-react';

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
};

/**
 * A row of filter pills built on the design-system `ButtonFilter`. Renders a
 * single active tab driven by `selectedKey` and reports clicks through
 * `onSelect`. Caller owns the surrounding layout (e.g. a scrollable flex
 * row), so this can sit alongside other content like loading placeholders.
 *
 * @param props - The component props.
 * @param props.tabs - Ordered list of tabs to render.
 * @param props.selectedKey - Key of the currently selected tab.
 * @param props.onSelect - Called with the tab key when a tab is clicked.
 * @returns The rendered filter tabs.
 */
export const FilterTabBar = ({
  tabs,
  selectedKey,
  onSelect,
}: FilterTabBarProps) => (
  <>
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
  </>
);
