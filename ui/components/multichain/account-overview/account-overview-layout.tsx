import React from 'react';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>

      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
