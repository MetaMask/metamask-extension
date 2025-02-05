import { ReactNode } from 'react';

export type TabsProps = {
  defaultActiveTabKey?: string;
  onTabClick?: (tabKey: string) => void;
  children: ReactNode;
  tabsClassName?: string;
  subHeader?: ReactNode;
  tabListProps?: Record<string, unknown>;
  tabContentProps?: Record<string, unknown>;
};

declare const Tabs: React.FC<TabsProps>;
export default Tabs;
