import React, { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
  getAllChainsToPoll,
  getIsMultichainAccountsState2Enabled,
} from '../../../selectors';
import { detectNfts, updateIncomingTransactions } from '../../../store/actions';
import AssetList from '../../app/assets/asset-list';
import DeFiTab from '../../app/assets/defi-list/defi-tab';
import { useAssetListTokenDetection } from '../../app/assets/hooks';
import NftsTab from '../../app/assets/nfts/nfts-tab';
import TransactionList from '../../app/transaction-list';
import UnifiedTransactionList from '../../app/transaction-list/unified-transaction-list.component';
import { Box } from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewTabsProps = AccountOverviewCommonProps & {
  showTokens: boolean;
  showTokensLinks?: boolean;
  showNfts: boolean;
  showActivity: boolean;
  showDefi?: boolean;
};

export const AccountOverviewTabs = ({
  onTabClick,
  defaultHomeActiveTabName,
  showTokens,
  showTokensLinks,
  showNfts,
  showActivity,
  showDefi,
}: AccountOverviewTabsProps) => {
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();
  const allChainIds = useSelector(getAllChainsToPoll);

  useAssetListTokenDetection();

  const handleTabClick = useCallback(
    (tabName: AccountOverviewTabKey) => {
      onTabClick(tabName);
      if (tabName === AccountOverviewTabKey.Nfts) {
        dispatch(detectNfts(allChainIds));
      }
      if (tabName === AccountOverviewTabKey.Activity) {
        dispatch(updateIncomingTransactions());
      }
      trackEvent({
        category: MetaMetricsEventCategory.Home,
        event: ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP[tabName],
      });
      if (defaultHomeActiveTabName) {
        endTrace({
          name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[
            defaultHomeActiveTabName
          ],
        });
      }
      trace({
        name: ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP[tabName],
      });
    },
    [onTabClick],
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
    <Tabs<AccountOverviewTabKey>
      defaultActiveTabKey={defaultHomeActiveTabName ?? undefined}
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
  );
};
