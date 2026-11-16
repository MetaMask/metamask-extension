import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '../../app/error-boundary/error-boundary';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
  AccountOverviewTab,
} from '../../../../shared/constants/app-state';
import { endTrace, trace } from '../../../../shared/lib/trace';
import { ASSET_ROUTE, DEFI_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTabState } from '../../../hooks/useTabState';
import { useSafeChains } from '../networks-form/use-safe-chains';
import {
  getDefaultHomeActiveTabName,
  getEnabledChainIds,
  getIsDefiPositionsEnabled,
} from '../../../selectors';
import {
  detectNfts,
  setDefaultHomeActiveTabName,
} from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import AssetList from '../../app/assets/asset-list';
import DeFiTab from '../../app/assets/defi-list/defi-tab';
import NftsTab from '../../app/assets/nfts/nfts-tab';
import { Tab, Tabs } from '../../ui/tabs';
import { transitionForward } from '../../ui/transition';
import { ScreenViewedEntryPoint } from '../../../../shared/constants/metametrics';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewTabsProps = AccountOverviewCommonProps & {
  showTokensLinks?: boolean;
  showTokens?: boolean;
  showNfts?: boolean;
  showDefi?: boolean;
};

export const AccountOverviewTabs = ({
  showTokensLinks,
  showTokens = true,
  showNfts = true,
  showDefi = true,
}: AccountOverviewTabsProps) => {
  const persistedTab = useSelector(getDefaultHomeActiveTabName);
  const [urlTab, setActiveTabKey] = useTabState();
  const activeTabKey = urlTab || persistedTab;

  const navigate = useNavigate();
  const location = useLocation();

  // Tracks how the currently active tab was reached so screen-viewed events
  // can distinguish a bottom-nav click (arriving at home) from a subtab click.
  const [tabEntryPoint, setTabEntryPoint] = useState<
    ScreenViewedEntryPoint | undefined
  >(
    location.state?.entryPoint === ScreenViewedEntryPoint.BottomNavClick
      ? ScreenViewedEntryPoint.BottomNavClick
      : undefined,
  );

  const t = useI18nContext();
  const dispatch = useDispatch();
  const selectedChainIds = useSelector(getEnabledChainIds);
  const defiPositionsEnabled = useSelector(getIsDefiPositionsEnabled);

  useEffect(() => {
    if (activeTabKey in ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP) {
      setDefaultHomeActiveTabName(activeTabKey);
    }
  }, [activeTabKey]);

  const handleTabClick = useCallback(
    (tabName: AccountOverviewTab) => {
      if (activeTabKey in ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP) {
        endTrace({
          name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[activeTabKey],
        });
      }

      setTabEntryPoint(ScreenViewedEntryPoint.SubtabClick);
      setActiveTabKey(tabName);

      if (tabName === AccountOverviewTabKey.Nfts) {
        dispatch(detectNfts(selectedChainIds));
      }
      if (tabName in ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP) {
        trace({
          name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[tabName],
        });
      }
    },
    [activeTabKey, setActiveTabKey, dispatch, selectedChainIds],
  );

  const onClickAsset = useCallback(
    (chainId: string, asset: string) =>
      transitionForward(() =>
        navigate(`${ASSET_ROUTE}/${chainId}/${encodeURIComponent(asset)}`),
      ),
    [navigate],
  );
  const onClickDeFi = useCallback(
    (chainId: string, protocolId: string) =>
      transitionForward(() =>
        navigate(`${DEFI_ROUTE}/${chainId}/${encodeURIComponent(protocolId)}`),
      ),
    [navigate],
  );

  const { safeChains } = useSafeChains();

  return (
    <>
      <Tabs<AccountOverviewTab>
        animated
        activeTab={activeTabKey}
        onTabClick={handleTabClick}
        tabListProps={{
          className:
            'px-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] tablist-fade border-b border-b-transparent transition-[border-color] duration-200 ease-out stuck-top-border',
        }}
        tabListWrapperProps={{
          className:
            'sticky top-0 z-10 bg-background-default [container-name:overview-tabs] [container-type:scroll-state]',
        }}
      >
        {showTokens && (
          <Tab
            name={t('tokens')}
            tabKey={AccountOverviewTabKey.Tokens}
            data-testid="account-overview__asset-tab"
          >
            <ErrorBoundary key="tokens">
              <AssetList
                showTokensLinks={showTokensLinks ?? true}
                onClickAsset={onClickAsset}
                safeChains={safeChains}
                entryPoint={tabEntryPoint}
              />
            </ErrorBoundary>
          </Tab>
        )}

        {showDefi && defiPositionsEnabled && (
          <Tab
            name={t('defi')}
            tabKey={AccountOverviewTabKey.DeFi}
            data-testid="account-overview__defi-tab"
          >
            <ErrorBoundary key="defi">
              <DeFiTab
                showTokensLinks={showTokensLinks ?? true}
                onClickAsset={onClickDeFi}
                safeChains={safeChains}
                entryPoint={tabEntryPoint}
              />
            </ErrorBoundary>
          </Tab>
        )}

        {showNfts && (
          <Tab
            name={t('nfts')}
            tabKey={AccountOverviewTabKey.Nfts}
            data-testid="account-overview__nfts-tab"
          >
            <ErrorBoundary key="nfts">
              <NftsTab entryPoint={tabEntryPoint} />
            </ErrorBoundary>
          </Tab>
        )}
      </Tabs>
    </>
  );
};
