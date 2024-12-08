import { TraceName } from '../lib/trace';
import { MetaMetricsEventName } from './metametrics';

export enum AccountOverviewTabKey {
  Tokens = 'tokens',
  Nfts = 'nfts',
  Activity = 'activity',
}

export const ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP = {
  [AccountOverviewTabKey.Tokens]: MetaMetricsEventName.TokenScreenOpened,
  [AccountOverviewTabKey.Nfts]: MetaMetricsEventName.NftScreenOpened,
  [AccountOverviewTabKey.Activity]: MetaMetricsEventName.ActivityScreenOpened,
} as const;

export const ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP = {
  [AccountOverviewTabKey.Tokens]: TraceName.AccountOverviewAssetListTab,
  [AccountOverviewTabKey.Nfts]: TraceName.AccountOverviewNftsTab,
  [AccountOverviewTabKey.Activity]: TraceName.AccountOverviewActivityTab,
} as const;
