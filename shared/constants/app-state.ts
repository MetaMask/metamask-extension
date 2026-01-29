import { NetworkClientId } from '@metamask/network-controller';
import { Hex } from 'viem';
import { TraceName } from '../lib/trace';
import { MetaMetricsEventName } from './metametrics';

export enum AccountOverviewTabKey {
  Tokens = 'tokens',
  Nfts = 'nfts',
  Activity = 'activity',
  DeFi = 'defi',
  Perps = 'perps',
}

export type AccountOverviewTab = `${AccountOverviewTabKey}`;

export const ACCOUNT_OVERVIEW_TAB_KEY_TO_METAMETRICS_EVENT_NAME_MAP = {
  [AccountOverviewTabKey.Tokens]: MetaMetricsEventName.TokenScreenOpened,
  [AccountOverviewTabKey.DeFi]: MetaMetricsEventName.DeFiScreenOpened,
  [AccountOverviewTabKey.Activity]: MetaMetricsEventName.ActivityScreenOpened,
  [AccountOverviewTabKey.Perps]: MetaMetricsEventName.PerpsScreenOpened,
} as const;

export const ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP = {
  [AccountOverviewTabKey.Tokens]: TraceName.AccountOverviewAssetListTab,
  [AccountOverviewTabKey.Nfts]: TraceName.AccountOverviewNftsTab,
  [AccountOverviewTabKey.Activity]: TraceName.AccountOverviewActivityTab,
  [AccountOverviewTabKey.DeFi]: TraceName.AccountOverviewDeFiTab,
  [AccountOverviewTabKey.Perps]: TraceName.AccountOverviewPerpsTab,
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
  variableName?: string;
  cardPlacement?: string;
};

export enum PasswordChangeToastType {
  Success = 'success',
  Errored = 'errored',
}

export enum ClaimSubmitToastType {
  Success = 'success',
  Errored = 'errored',
  DraftSaved = 'draft-saved',
  DraftSaveFailed = 'draft-save-failed',
  DraftDeleted = 'draft-deleted',
  DraftDeleteFailed = 'draft-delete-failed',
}

export type NetworkConnectionBanner =
  | { status: 'unknown' | 'available' }
  | {
      status: 'degraded' | 'unavailable';
      networkName: string;
      networkClientId: NetworkClientId;
      chainId: Hex;
      isInfuraEndpoint: boolean;
      /**
       * The index of an available Infura RPC endpoint in the network's
       * rpcEndpoints array. Only set for custom networks that have an
       * Infura endpoint available to switch to.
       */
      infuraEndpointIndex?: number;
    };
