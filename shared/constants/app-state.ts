import { TraceName } from '../lib/trace';
import { MetaMetricsEventName } from './metametrics';

export enum AccountOverviewTabKey {
  Tokens = 'tokens',
  Nfts = 'nfts',
  Activity = 'activity',
  DeFi = 'defi',
}

export const ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP = {
  [AccountOverviewTabKey.Tokens]: MetaMetricsEventName.TokenScreenOpened,
  [AccountOverviewTabKey.DeFi]: MetaMetricsEventName.DeFiScreenOpened,
  [AccountOverviewTabKey.Nfts]: MetaMetricsEventName.NftScreenOpened,
  [AccountOverviewTabKey.Activity]: MetaMetricsEventName.ActivityScreenOpened,
} as const;

export const ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP = {
  [AccountOverviewTabKey.Tokens]: TraceName.AccountOverviewAssetListTab,
  [AccountOverviewTabKey.Nfts]: TraceName.AccountOverviewNftsTab,
  [AccountOverviewTabKey.Activity]: TraceName.AccountOverviewActivityTab,
  [AccountOverviewTabKey.DeFi]: TraceName.AccountOverviewDeFiTab,
} as const;

export type CarouselSlide = {
  id: string;
  title: string;
  description: string;
  image: string;
  dismissed?: boolean;
  href?: string;
  undismissable?: boolean;
  startDate?: string;
  endDate?: string;
  priorityPlacement?: boolean;
};

export enum PasswordChangeToastType {
  Success = 'success',
  Errored = 'errored',
}
