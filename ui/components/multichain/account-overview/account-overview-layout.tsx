import React, { useCallback } from 'react';
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
  const heroRef = useCallback((node: HTMLDivElement | null) => {
    node?.setAttribute('elementtiming', 'hero');
  }, []);

  return (
    <>
      <div
        ref={heroRef}
        className="account-overview__balance-wrapper flex flex-col p-4 gap-4"
      >
        <NetworkConnectionBanner />

        {children}

        <Carousel />
      </div>

      <AccountOverviewTabs {...tabsProps} />
    </>
  );
};
