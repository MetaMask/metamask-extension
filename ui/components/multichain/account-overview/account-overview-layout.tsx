import React, { useEffect } from 'react';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
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
  useEffect(() => {
    endTrace({ name: TraceName.AccountListItem });
  }, []);

  return (
    <>
      <div className="account-overview__balance-wrapper">{children}</div>

      <AccountOverviewTabs {...tabsProps}></AccountOverviewTabs>
    </>
  );
};
