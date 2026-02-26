import React from 'react';
import { NetworkConnectionBanner } from '../../app/network-connection-banner';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';
import { Carousel } from './carousel';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
};

export const AccountOverviewLayout = ({
  children,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  return (
    <>
      <div
        className="account-overview__balance-wrapper flex flex-col p-4 gap-4"
        // @ts-expect-error Element Timing API attribute (Chrome-specific, not in React types)
        elementtiming="hero"
      >
        <NetworkConnectionBanner />

        {children}

        <Carousel />
      </div>

      <AccountOverviewTabs {...tabsProps} />
    </>
  );
};
