import React, { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Hex } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import ErrorBoundary from '../../app/error-boundary/error-boundary';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP,
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
  AccountOverviewTab,
} from '../../../../shared/constants/app-state';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { endTrace, trace } from '../../../../shared/lib/trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ASSET_ROUTE, DEFI_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTabState } from '../../../hooks/useTabState';
import { useSafeChains } from '../networks-form/use-safe-chains';
import {
  getDefaultHomeActiveTabName,
  getEnabledChainIds,
} from '../../../selectors';
import {
  getIsPerpsExperienceAvailable,
  getPerpsTabBadgeSeen,
} from '../../../selectors/perps';
import { selectEnabledNetworksAsCaipChainIds } from '../../../selectors/multichain/networks';
import {
  detectNfts,
  setDefaultHomeActiveTabName,
  setPerpsTabBadgeSeen,
} from '../../../store/actions';
import AssetList from '../../app/assets/asset-list';
import DeFiTab from '../../app/assets/defi-list/defi-tab';
import NftsTab from '../../app/assets/nfts/nfts-tab';
import { PerpsTab } from '../../app/perps/perps-tab';
import { Tab, Tabs } from '../../ui/tabs';
import { useABTest } from '../../../hooks/useABTest';
import {
  PERPS_TAB_BADGE_AB_KEY,
  PERPS_TAB_BADGE_VARIANTS,
  PERPS_TAB_BADGE_AB_TEST_EXPOSURE_METADATA,
} from '../../../../shared/lib/ab-testing/configs/perps-tab-badge';
import { useTokenBalances } from '../../../hooks/useTokenBalances';
import { ActivityList as ActivityListV3 } from '../../../pages/activity/activity-list';
import { RampsOrdersTab } from '../../../pages/activity/ramps-orders-tab';
import { ActivityList as ActivityListV2 } from '../activity-v2/activity-list';
import { usePrefetchTransactions } from '../activity-v2/useTransactionsQuery';
import { getIsActivityListRedesignEnabled } from '../../../selectors/activity/feature-flags';
import { transitionForward } from '../../ui/transition';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewTabsProps = AccountOverviewCommonProps & {
  showTokens: boolean;
  showTokensLinks?: boolean;
  showNfts: boolean;
  showActivity: boolean;
  showDefi?: boolean;
};

/**
 * Isolated component that starts/stops EVM token balance polling.
 *
 * This intentionally returns null and only runs a hook. While that may seem
 * like an anti-pattern, it is the correct React performance pattern here:
 * `useTokenBalances` internally calls `useSelector(getTokenBalances)`, which
 * subscribes the calling component to every token-balance state update
 * (every ~30 s). By placing the call in this tiny component instead of in
 * `AccountOverviewTabs`, only this component re-renders when balances change,
 * rather than the entire tabs subtree and all of its children.
 *
 * @param options - Component options.
 * @param options.chainIds - The chain IDs to poll balances for.
 */
const TokenBalancesPoller = ({ chainIds }: { chainIds: Hex[] }) => {
  useTokenBalances({ chainIds });
  return null;
};

export const AccountOverviewTabs = ({
  showTokens,
  showTokensLinks,
  showNfts,
  showActivity,
  showDefi,
}: AccountOverviewTabsProps) => {
  const persistedTab = useSelector(getDefaultHomeActiveTabName);
  const [urlTab, setActiveTabKey] = useTabState();
  const activeTabKey = urlTab || persistedTab;

  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const selectedChainIds = useSelector(getEnabledChainIds);
  const isActivityListRedesignEnabled = useSelector(
    getIsActivityListRedesignEnabled,
  );
  const prefetchTransactions = usePrefetchTransactions();

  const perpsTabBadgeSeen = useSelector(getPerpsTabBadgeSeen);
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);

  // Track exposure only when the Perps tab is shown, gated on availability (not
  // dismissal) so control and treatment record symmetrically once per session.
  const { variant: perpsTabBadgeVariant } = useABTest(
    PERPS_TAB_BADGE_AB_KEY,
    PERPS_TAB_BADGE_VARIANTS,
    PERPS_TAB_BADGE_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: isPerpsExperienceAvailable },
  );
  const showPerpsTabBadge =
    isPerpsExperienceAvailable &&
    perpsTabBadgeVariant.showBadge &&
    !perpsTabBadgeSeen;

  useEffect(() => {
    if (activeTabKey in ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP) {
      setDefaultHomeActiveTabName(activeTabKey);
    }
  }, [activeTabKey]);

  // Whether the persisted/url active tab resolves to a tab that is actually
  // rendered. Membership only — render order is irrelevant here.
  const renderedTabKeys: AccountOverviewTab[] = [
    ...(showTokens ? [AccountOverviewTabKey.Tokens] : []),
    ...(isPerpsExperienceAvailable ? [AccountOverviewTabKey.Perps] : []),
    ...(showDefi ? [AccountOverviewTabKey.DeFi] : []),
    ...(showNfts ? [AccountOverviewTabKey.Nfts] : []),
    ...(showActivity ? [AccountOverviewTabKey.Activity] : []),
    AccountOverviewTabKey.Orders,
  ];
  // Perps is the effective active tab when it is explicitly selected, or when
  // the active tab isn't rendered and Tabs clamps to the first rendered tab.
  // Perps is that first tab whenever Tokens (the only tab that can precede it)
  // is hidden and the Perps experience is available.
  const perpsIsEffectiveActiveTab =
    activeTabKey === AccountOverviewTabKey.Perps ||
    (!renderedTabKeys.includes(activeTabKey) &&
      !showTokens &&
      isPerpsExperienceAvailable);

  // Mark the badge seen whenever Perps is the effective active tab — covers
  // clicking in, landing directly on Perps (persisted default or ?tab=perps),
  // and the clamped-active case above; a click handler alone would miss the last
  // two. Gated on showPerpsTabBadge so control/seen/unavailable (badge never
  // visible) never marks it seen.
  useEffect(() => {
    if (showPerpsTabBadge && perpsIsEffectiveActiveTab) {
      dispatch(setPerpsTabBadgeSeen(true));
    }
  }, [showPerpsTabBadge, perpsIsEffectiveActiveTab, dispatch]);

  const networkFilterForMetrics = useSelector(
    selectEnabledNetworksAsCaipChainIds,
  );

  // EVM token-balance polling is handled by TokenBalancesPoller (rendered below).
  // Keeping it in an isolated child prevents balance updates from re-rendering
  // this entire subtree every ~30 s.

  const handleTabClick = useCallback(
    (tabName: AccountOverviewTab) => {
      if (activeTabKey in ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP) {
        endTrace({
          name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[activeTabKey],
        });
      }

      setActiveTabKey(tabName);

      if (tabName === AccountOverviewTabKey.Nfts) {
        dispatch(detectNfts(selectedChainIds));
      }
      // For ActivityListV3, ActivityScreenOpened is deferred to the list
      // component so it can include accurate is_empty / pending_transactions
      // after all data sources have loaded. For ActivityListV2 there is no
      // equivalent deferred tracking, so fire immediately on click.
      if (
        tabName in ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP &&
        (tabName !== AccountOverviewTabKey.Activity ||
          !isActivityListRedesignEnabled)
      ) {
        trackEvent({
          category: MetaMetricsEventCategory.Home,
          event:
            ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP[
              tabName as keyof typeof ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP
            ],
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            network_filter: networkFilterForMetrics,
          },
        });
      }
      if (tabName in ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP) {
        trace({
          name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[tabName],
        });
      }
    },
    [
      activeTabKey,
      isActivityListRedesignEnabled,
      networkFilterForMetrics,
      setActiveTabKey,
      dispatch,
      selectedChainIds,
      trackEvent,
    ],
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
      <TokenBalancesPoller chainIds={selectedChainIds as Hex[]} />
      <Tabs<AccountOverviewTab>
        animated
        activeTab={activeTabKey}
        onTabClick={handleTabClick}
        tabListProps={{
          className:
            'mx-4 overflow-x-auto overscroll-x-contain [scrollbar-width:none] tablist-fade',
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
              />
            </ErrorBoundary>
          </Tab>
        )}

        {isPerpsExperienceAvailable && (
          <Tab
            name={
              showPerpsTabBadge ? (
                <Box
                  asChild
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={1}
                >
                  <span>
                    {t('perps')}
                    <Box
                      asChild
                      flexDirection={BoxFlexDirection.Row}
                      alignItems={BoxAlignItems.Center}
                      backgroundColor={BoxBackgroundColor.PrimaryMuted}
                      paddingLeft={2}
                      paddingRight={2}
                      className="rounded-sm"
                      data-testid="perps-tab-new-badge"
                    >
                      <span>
                        <Text
                          asChild
                          variant={TextVariant.BodySm}
                          color={TextColor.PrimaryDefault}
                        >
                          <span>{t('perpsFilterNew')}</span>
                        </Text>
                      </span>
                    </Box>
                  </span>
                </Box>
              ) : (
                t('perps')
              )
            }
            tabKey={AccountOverviewTabKey.Perps}
            data-testid="account-overview__perps-tab"
          >
            <PerpsTab />
          </Tab>
        )}

        {showDefi && (
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
              <NftsTab />
            </ErrorBoundary>
          </Tab>
        )}

        {showActivity && (
          <Tab
            name={t('activity')}
            tabKey={AccountOverviewTabKey.Activity}
            data-testid="account-overview__activity-tab"
            onMouseEnter={prefetchTransactions}
          >
            <ErrorBoundary key="activity">
              {isActivityListRedesignEnabled ? (
                <ActivityListV3 />
              ) : (
                <ActivityListV2 />
              )}
            </ErrorBoundary>
          </Tab>
        )}

        <Tab
          name="Orders"
          tabKey={AccountOverviewTabKey.Orders}
          data-testid="account-overview__orders-tab"
        >
          <ErrorBoundary key="orders">
            <RampsOrdersTab />
          </ErrorBoundary>
        </Tab>
      </Tabs>
    </>
  );
};
