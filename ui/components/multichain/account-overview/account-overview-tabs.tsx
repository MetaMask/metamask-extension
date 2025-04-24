import React, { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { endTrace, trace } from '../../../../shared/lib/trace';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ASSET_ROUTE, DEFI_ROUTE } from '../../../helpers/constants/routes';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import NftsTab from '../../app/assets/nfts/nfts-tab';
import AssetList from '../../app/assets/asset-list';
import TransactionList from '../../app/transaction-list';
import { Tabs, Tab } from '../../ui/tabs';
import { Box } from '../../component-library';

import {
  ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP,
  ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP,
  AccountOverviewTabKey,
} from '../../../../shared/constants/app-state';
import { detectNfts } from '../../../store/actions';
import { getAllChainsToPoll } from '../../../selectors';
import DeFiTab from '../../app/assets/defi-list/defi-tab';
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

  const tabProps = useMemo(
    () => ({
      activeClassName: 'account-overview__tab--active',
      className: 'account-overview__tab',
    }),
    [],
  );

  const handleTabClick = useCallback(
    (tabName: AccountOverviewTabKey) => {
      onTabClick(tabName);
      if (tabName === AccountOverviewTabKey.Nfts) {
        dispatch(detectNfts(allChainIds));
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

  return (
    <Box style={{ flexGrow: '1' }}>
      <Tabs
        defaultActiveTabKey={defaultHomeActiveTabName}
        onTabClick={handleTabClick}
        tabsClassName="account-overview__tabs"
      >
        {showTokens && (
          <Tab
            name={t('tokens')}
            tabKey="tokens"
            data-testid="account-overview__asset-tab"
            {...tabProps}
          >
            <Box marginTop={2} marginBottom={2}>
              <AssetList
                showTokensLinks={showTokensLinks ?? true}
                onClickAsset={onClickAsset}
              />
            </Box>
          </Tab>
        )}
        {showDefi && (
          <Tab
            name={t('defi')}
            tabKey="defi"
            data-testid="account-overview__defi-tab"
            {...tabProps}
          >
            <Box marginTop={2}>
              <DeFiTab
                showTokensLinks={showTokensLinks ?? true}
                onClickAsset={onClickDeFi}
              />
            </Box>
          </Tab>
        )}

        {showNfts && (
          <Tab
            name={t('nfts')}
            tabKey="nfts"
            data-testid="account-overview__nfts-tab"
            {...tabProps}
          >
            <NftsTab />
          </Tab>
        )}

        {showActivity && (
          <Tab
            name={t('activity')}
            tabKey="activity"
            data-testid="account-overview__activity-tab"
            {...tabProps}
          >
            <TransactionList boxProps={{ paddingTop: 3 }} />
          </Tab>
        )}
      </Tabs>
    </Box>
  );
};
