import React, { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { Hex } from '@metamask/utils';
import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP,
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { endTrace, trace } from '../../../../shared/lib/trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ASSET_ROUTE, DEFI_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useSafeChains } from '../../../pages/settings/networks-tab/networks-form/use-safe-chains';
import {
  getChainIdsToPoll,
  getIsMultichainAccountsState2Enabled,
} from '../../../selectors';
import { detectNfts } from '../../../store/actions';
import AssetList from '../../app/assets/asset-list';
import DeFiTab from '../../app/assets/defi-list/defi-tab';
import NftsTab from '../../app/assets/nfts/nfts-tab';
import TransactionList from '../../app/transaction-list';
import UnifiedTransactionList from '../../app/transaction-list/unified-transaction-list.component';
import { Box } from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import { useTokenBalances } from '../../../hooks/useTokenBalances';
import { AccountOverviewCommonProps } from './common';
import { AssetListTokenDetection } from './asset-list-token-detection';

export type AccountOverviewTabsProps = AccountOverviewCommonProps & {
  showTokens: boolean;
  showTokensLinks?: boolean;
  showNfts: boolean;
  showActivity: boolean;
  showDefi?: boolean;
};

// Map query param values to AccountOverviewTabKey
const QUERY_PARAM_TO_TAB_KEY: Record<string, AccountOverviewTabKey> = {
  tokens: AccountOverviewTabKey.Tokens,
  nft: AccountOverviewTabKey.Nfts,
  defi: AccountOverviewTabKey.DeFi,
  activity: AccountOverviewTabKey.Activity,
};

// Map AccountOverviewTabKey to query param values
const TAB_KEY_TO_QUERY_PARAM: Record<AccountOverviewTabKey, string> = {
  [AccountOverviewTabKey.Tokens]: 'tokens',
  [AccountOverviewTabKey.Nfts]: 'nft',
  [AccountOverviewTabKey.DeFi]: 'defi',
  [AccountOverviewTabKey.Activity]: 'activity',
};

export const AccountOverviewTabs = ({
  showTokens,
  showTokensLinks,
  showNfts,
  showActivity,
  showDefi,
}: AccountOverviewTabsProps) => {
  const history = useHistory();
  const [searchParams, setSearchParams] = useSearchParams();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const selectedChainIds = useSelector(getChainIdsToPoll);

  // EVM specific tokenBalance polling, updates state via polling loop per chainId
  useTokenBalances({
    chainIds: selectedChainIds as Hex[],
  });

  // Get active tab from query parameter
  const activeTabFromQuery = useMemo(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam in QUERY_PARAM_TO_TAB_KEY) {
      return QUERY_PARAM_TO_TAB_KEY[tabParam];
    }
    // Default to tokens tab
    return AccountOverviewTabKey.Tokens;
  }, [searchParams]);

  // Track the previous active tab for tracing
  const [previousTab, setPreviousTab] =
    React.useState<AccountOverviewTabKey | null>(activeTabFromQuery);

  const handleTabClick = useCallback(
    (tabName: AccountOverviewTabKey) => {
      // Update URL query parameter
      setSearchParams({ tab: TAB_KEY_TO_QUERY_PARAM[tabName] });

      // Detect NFTs when switching to NFT tab
      if (tabName === AccountOverviewTabKey.Nfts) {
        dispatch(detectNfts(selectedChainIds));
      }

      // Track metrics
      if (tabName in ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP) {
        trackEvent({
          category: MetaMetricsEventCategory.Home,
          event:
            ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP[
              tabName as keyof typeof ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP
            ],
        });
      }

      // End trace for previous tab
      if (previousTab) {
        endTrace({
          name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[previousTab],
        });
      }

      // Start trace for new tab
      trace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[tabName],
      });

      // Update previous tab
      setPreviousTab(tabName);
    },
    [setSearchParams, dispatch, selectedChainIds, trackEvent, previousTab],
  );

  const onClickAsset = useCallback(
    (chainId: string, asset: string) =>
      history.push(`${ASSET_ROUTE}/${chainId}/${encodeURIComponent(asset)}`),
    [history],
  );
  const onClickDeFi = useCallback(
    (chainId: string, protocolId: string) =>
      history.push(
        `${DEFI_ROUTE}/${chainId}/${encodeURIComponent(protocolId)}`,
      ),
    [history],
  );

  const { safeChains } = useSafeChains();

  const isBIP44FeatureFlagEnabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const showUnifiedTransactionList = isBIP44FeatureFlagEnabled;

  return (
    <>
      <AssetListTokenDetection />

      <Tabs<AccountOverviewTabKey>
        activeTabKey={activeTabFromQuery}
        onTabClick={handleTabClick}
        tabListProps={{
          className: 'px-4',
        }}
      >
        {showTokens && (
          <Tab
            name={t('tokens')}
            tabKey={AccountOverviewTabKey.Tokens}
            data-testid="account-overview__asset-tab"
          >
            <Box marginBottom={2}>
              <AssetList
                showTokensLinks={showTokensLinks ?? true}
                onClickAsset={onClickAsset}
                safeChains={safeChains}
              />
            </Box>
          </Tab>
        )}
        {showDefi && (
          <Tab
            name={t('defi')}
            tabKey={AccountOverviewTabKey.DeFi}
            data-testid="account-overview__defi-tab"
          >
            <Box>
              <DeFiTab
                showTokensLinks={showTokensLinks ?? true}
                onClickAsset={onClickDeFi}
                safeChains={safeChains}
              />
            </Box>
          </Tab>
        )}

        {showNfts && (
          <Tab
            name={t('nfts')}
            tabKey={AccountOverviewTabKey.Nfts}
            data-testid="account-overview__nfts-tab"
          >
            <NftsTab />
          </Tab>
        )}

        {showActivity && (
          <Tab
            name={t('activity')}
            tabKey={AccountOverviewTabKey.Activity}
            data-testid="account-overview__activity-tab"
          >
            {showUnifiedTransactionList ? (
              <UnifiedTransactionList />
            ) : (
              <TransactionList />
            )}
          </Tab>
        )}
      </Tabs>
    </>
  );
};
