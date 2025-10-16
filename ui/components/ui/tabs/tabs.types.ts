import React from 'react';
import { type BoxProps, type TextProps } from '@metamask/design-system-react';

export type TabProps<TKey extends string = string> = Omit<
  TextProps,
  'children' | 'onClick' | 'ref'
> & {
  /** CSS class name for the tab container */
  className?: string;
  /** Test id for the tab element */
  'data-testid'?: string;
  /** Whether the tab is currently active (set by parent Tabs component) */
  isActive?: boolean;
  /** Display name for the tab */
  name: React.ReactNode;
  /** Unique key to identify the tab */
  tabKey: TKey;
  /** Click handler called with the tab index (set by parent Tabs component) */
  onClick?: (tabIndex: number) => void;
  /** Tab index in the list (set by parent Tabs component) */
  tabIndex?: number;
  /** Content to render when this tab is active */
  children?: React.ReactNode;
  /** Props to pass to the Text component used for the tab button */
  textProps?: Partial<TextProps>;
  /** Whether the tab is disabled */
  disabled?: boolean;
};

export type TabChild<TKey extends string = string> = {
  props: TabProps<TKey>;
} & React.ReactElement<TabProps<TKey>>;

export type TabsProps<TKey extends string = string> = Omit<
  BoxProps,
  'children' | 'ref'
> & {
  /** Key of the tab that should be active by default */
  defaultActiveTabKey?: TKey;
  /** Callback called when a tab is clicked */
  onTabClick?: (tabKey: TKey) => void;
  /** Tab components to render */
  children: React.ReactNode;
  /** Additional content to render between tabs and content */
  subHeader?: React.ReactNode;
  /** Props to pass to the tab list container */
  tabListProps?: Omit<BoxProps, 'children' | 'ref'>;
  /** Props to pass to the tab content container */
  tabContentProps?: Omit<BoxProps, 'children' | 'ref'>;
  /** CSS class name for the tabs container */
  className?: string;
};

export type TabsHandle<TKey extends string = string> = {
  /** Get the currently active tab index */
  getActiveTabIndex: () => number;
  /** Set the active tab by key */
  setActiveTabByKey: (tabKey: TKey) => void;
  /** Set the active tab by index */
  setActiveTabByIndex: (index: number) => void;
};
