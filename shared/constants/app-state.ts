import { TraceName } from '../lib/trace';

export enum AccountOverviewTabKey {
  Tokens = 'tokens',
  Nfts = 'nfts',
  DeFi = 'defi',
}

export type AccountOverviewTab = `${AccountOverviewTabKey}`;

export const ACCOUNT_OVERVIEW_TAB_KEY_TO_TRACE_NAME_MAP = {
  [AccountOverviewTabKey.Tokens]: TraceName.AccountOverviewAssetListTab,
  [AccountOverviewTabKey.Nfts]: TraceName.AccountOverviewNftsTab,
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

export enum ClaimSubmitToastType {
  Success = 'success',
  Errored = 'errored',
  DraftSaved = 'draft-saved',
  DraftSaveFailed = 'draft-save-failed',
  DraftDeleted = 'draft-deleted',
  DraftDeleteFailed = 'draft-delete-failed',
}

/**
 * Type of storage write error that occurred.
 * Used to show specific error messages in the storage error toast.
 */
export enum StorageWriteErrorType {
  /** A general storage write error */
  Default = 'default',
  /** Device is out of disk space */
  FileErrorNoSpace = 'file-error-no-space',
}
