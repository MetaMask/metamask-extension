import React, { useCallback } from 'react';
import { NetworkConnectionBanner } from '../../app/network-connection-banner';
import { MoneyAccountBalance } from '../../app/money/money-account-balance';
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
      >
        <NetworkConnectionBanner />

        {children}

        {/*
          Renders nothing unless there is a Money Account with a balance to
          show, which is every user until the Money keyring is registered. Sits
          below the hero balance and above the carousel, mirroring where mobile
          puts it on the wallet home.
        */}
        <MoneyAccountBalance />

        <Carousel />
      </div>

      <AccountOverviewTabs {...tabsProps} />
    </>
  );
};
