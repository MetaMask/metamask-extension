import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { NetworkConnectionBanner } from '../../app/network-connection-banner';
import { MoneyAccountBalance } from '../../app/money/money-account-balance';
import { useTrace } from '#ui/hooks/useTrace';
import { getSelectedAccountGroup } from '#ui/selectors/multichain-accounts/account-tree';
import { getAllEnabledNetworksForAllNamespaces } from '#ui/selectors/multichain/networks';
import { selectAccountGroupBalanceIsLoadedForEmptyState } from '#ui/selectors/assets';
import { TraceName, TraceOperation } from '#shared/lib/trace';
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
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const balanceIsLoaded = useSelector(
    selectAccountGroupBalanceIsLoadedForEmptyState,
  );
  const allEnabledNetworksForAllNamespaces = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );
  const generationKey = `${selectedAccountGroup ?? 'none'}:${allEnabledNetworksForAllNamespaces.join(',')}`;

  useTrace({
    name: TraceName.HomepageReady,
    op: TraceOperation.HomepagePerformance,
    enabled: Boolean(selectedAccountGroup),
    generationKey,
    // TokenList is ready when tokens exist or balances are loaded.
    ready: balanceIsLoaded,
    data: { success: true },
  });

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
