import { NetworkClientId } from '@metamask/network-controller';
import { Hex } from 'viem';
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
}

export type NetworkConnectionBanner =
  | { status: 'unknown' | 'available' }
  | {
      status: 'degraded' | 'unavailable';
      networkName: string;
      networkClientId: NetworkClientId;
      chainId: Hex;
      isInfuraEndpoint: boolean;
    };

/**
 * Seedless onboarding migration versions.
 * - DataType (1): Assigns PrimarySrp/ImportedSrp/ImportedPrivateKey to legacy secrets
 */
export enum SeedlessOnboardingMigrationVersion {
  DataType = 1,
}
