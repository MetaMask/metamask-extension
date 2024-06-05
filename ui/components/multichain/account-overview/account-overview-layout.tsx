import React from 'react';
import {
  AccountOverviewTabsOptions,
  AccountOverviewTabs,
} from './account-overview-tabs';

export type AccountOverviewLayoutOptions = AccountOverviewTabsOptions & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = (
  options: AccountOverviewLayoutOptions,
) => {
  const { children, ...tabsOptions } = options;

  return (
    <>
      <div className="home__balance-wrapper">{children}</div>

      <AccountOverviewTabs {...tabsOptions}></AccountOverviewTabs>
    </>
  );
};
