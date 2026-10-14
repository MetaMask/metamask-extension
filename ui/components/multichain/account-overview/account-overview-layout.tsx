import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TraceName, TraceOperation } from '#shared/lib/trace';
import { TraceCoordinator } from '#ui/hooks/useTraceCoordinator';
import { getSelectedAccountGroupNetworkGenerationKey } from '#ui/selectors/assets';
import { NetworkConnectionBanner } from '../../app/network-connection-banner';
import { MoneyAccountBalance } from '../../app/money/money-account-balance';
import {
  AccountOverviewTabsProps,
  AccountOverviewTabs,
} from './account-overview-tabs';
import { Carousel } from './carousel';

const homepageRequiredSignals = ['balance', 'tokens'];

export type AccountOverviewLayoutProps = AccountOverviewTabsProps & {
  children: React.ReactElement;
  'data-testid'?: string;
};

export const AccountOverviewLayout = ({
  children,
  'data-testid': dataTestId,
  ...tabsProps
}: AccountOverviewLayoutProps) => {
  const homepageTraceId = useSelector(
    getSelectedAccountGroupNetworkGenerationKey,
  );
  const heroRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.setAttribute('elementtiming', 'hero');
      requestAnimationFrame(() => {
        performance.mark('mm-hero-painted');
      });
    }
  }, []);

  return (
    <TraceCoordinator
      name={TraceName.HomepageReady}
      op={TraceOperation.HomepagePerformance}
      parentId={tabsProps.showTokens === false ? undefined : homepageTraceId}
      requiredSignals={homepageRequiredSignals}
    >
      <div
        ref={heroRef}
        className="account-overview__balance-wrapper flex flex-col p-4 gap-4"
        data-testid={dataTestId}
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
    </TraceCoordinator>
  );
};
