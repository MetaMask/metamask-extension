import type { CaipAssetType } from '@metamask/utils';
import type { SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import type { TokenWithFiatAmount } from '../types';
import type { TokenTableSort } from '../util/sortAssetsWithPriority';

export type TokenTableProps = {
  onTokenClick: (
    chainId: string,
    address: string,
    assetId?: CaipAssetType,
  ) => void;
  safeChains?: SafeChain[];
};

export type SortColumn = TokenTableSort['column'];

export type SortableColumnHeaderProps = {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn | null;
  reversed: boolean;
  onSort: () => void;
  className?: string;
};

export type HeaderProps = {
  activeColumn: SortColumn | null;
  reversed: boolean;
  onSort: (column: SortColumn) => void;
};

export type HeaderColumn = {
  column: SortColumn;
  labelKey: 'token' | 'price' | '24hChange' | 'balance';
  className: string;
};

export type RowProps = {
  token: TokenWithFiatAmount;
  privacyMode: boolean;
  onClick?: () => void;
  safeChains?: SafeChain[];
};
