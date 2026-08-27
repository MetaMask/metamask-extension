import React, { useCallback } from 'react';
import { NetworkConnectionBanner } from '../../app/network-connection-banner';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';
import { Carousel } from './carousel';

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
  'data-testid'?: string;
};

export const AccountOverviewLayout = ({
  children,
  'data-testid': dataTestId,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  const heroRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.setAttribute('elementtiming', 'hero');
      requestAnimationFrame(() => {
        performance.mark('mm-hero-painted');
      });
    }
  }, []);

  return (
    <>
      <div
        ref={heroRef}
        className="account-overview__balance-wrapper flex flex-col p-4 gap-4"
        data-testid={dataTestId}
      >
        <NetworkConnectionBanner />

        {children}

        <Carousel />
      </div>

      <AccountOverviewTabs {...tabsProps} />
    </>
  );
};
