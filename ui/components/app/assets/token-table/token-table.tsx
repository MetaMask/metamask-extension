import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getTokenSortConfig } from '../../../../selectors';
import { VirtualizedList } from '../../../ui/virtualized-list/virtualized-list';
import { AssetCellBadge } from '../asset-list/cells/asset-cell-badge';
import { ASSET_CELL_HEIGHT } from '../constants';
import { useTokenDisplayInfo } from '../hooks';
import {
  getTokenListItemKey,
  type TokenListDisplayItem,
  useTokenListData,
} from '../hooks/useTokenListData';
import { useTokenSortValues } from '../hooks/useTokenSortValues';
import type { TokenTableSort } from '../util/sortAssetsWithPriority';
import { NativeTokenScamWarningModal } from '../token-cell/native-token-scam-warning-modal';
import {
  TokenCellPercentChange,
  TokenCellPrice,
  TokenCellPrimaryDisplay,
  TokenCellSecondaryDisplay,
  TokenCellTitle,
} from '../token-cell/cells';
import { LowValueAssetsToggle } from '../token-list/low-value-assets-toggle';
import { TokenListLoadingSkeleton } from '../token-list/token-list-loading-skeleton';
import {
  COLUMNS_CLASS_NAME,
  HEADER_COLUMNS,
  PERCENT_CHANGE_CLASS_NAME,
  PRICE_AND_CHANGE_ITEM_CLASS_NAME,
} from './token-table.constants';
import type {
  SortColumn,
  SortableColumnHeaderProps,
  HeaderProps,
  TokenTableProps,
  RowProps,
} from './token-table.types';

export type { TokenTableProps };

const noSortValue = () => undefined;

// Gets the existing active sort column based on the TokenSortConfig
const getActiveSortColumn = (
  key?: string,
): Extract<SortColumn, 'token' | 'balance'> | null => {
  if (key === 'name' || key === 'title') {
    return 'token';
  }
  if (key === 'tokenFiatAmount') {
    return 'balance';
  }
  return null;
};

const SortableColumnHeader = ({
  label,
  column,
  activeColumn,
  reversed,
  onSort,
  className,
}: SortableColumnHeaderProps) => {
  const t = useI18nContext();
  const isActive = activeColumn === column;
  // Down is the default. For names that is A to Z. For numbers it is high to low
  const isSortedDescending = column === 'token' ? reversed : !reversed;
  const ariaLabel = isActive
    ? `${label}, ${t(isSortedDescending ? 'sortedDescending' : 'sortedAscending')}`
    : undefined;

  return (
    <button
      type="button"
      className={`w-full min-w-0 items-center gap-1 border-0 bg-transparent p-0 ${className ?? ''}`}
      data-testid={`token-table-sort-${column}`}
      aria-label={ariaLabel}
      onClick={onSort}
    >
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
      >
        {label}
      </Text>
      {isActive && (
        <Icon
          name={reversed ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
          aria-hidden="true"
          data-testid="token-table-sort-indicator"
          data-sort-direction={reversed ? 'up' : 'down'}
        />
      )}
    </button>
  );
};

const Header = ({ activeColumn, reversed, onSort }: HeaderProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      className={`${COLUMNS_CLASS_NAME} py-2 border-b border-b-muted`}
      data-testid="token-table-header"
    >
      {HEADER_COLUMNS.map((column) => (
        <SortableColumnHeader
          key={column.column}
          label={t(column.labelKey)}
          column={column.column}
          activeColumn={activeColumn}
          reversed={reversed}
          onSort={() => onSort(column.column)}
          className={column.className}
        />
      ))}
    </Box>
  );
};

const Row = ({ token, privacyMode, onClick, safeChains }: RowProps) => {
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const tokenDisplayInfo = useTokenDisplayInfo({ token });
  const displayToken = useMemo(
    () => ({ ...token, ...tokenDisplayInfo }),
    [token, tokenDisplayInfo],
  );

  if (!token.chainId) {
    return null;
  }

  return (
    <>
      <Box asChild>
        <a
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            if (!showScamWarningModal) {
              onClick?.();
            }
          }}
          className={`${COLUMNS_CLASS_NAME} ${onClick ? 'cursor-pointer hover:bg-hover' : ''}`}
          style={{ height: ASSET_CELL_HEIGHT }}
          data-testid="multichain-token-list-button"
        >
          <Box className="flex min-w-0 items-center gap-4">
            <AssetCellBadge
              chainId={token.chainId}
              isNative={token.isNative}
              tokenImage={displayToken.tokenImage}
              symbol={token.symbol}
              assetId={token.assetId}
            />
            <TokenCellTitle token={displayToken} />
          </Box>
          <Box className="flex min-w-0 flex-col items-end @2xl/token-table:contents">
            <Box className={PRICE_AND_CHANGE_ITEM_CLASS_NAME}>
              <TokenCellPrice token={displayToken} />
            </Box>
            <Box className={PERCENT_CHANGE_CLASS_NAME}>
              <TokenCellPercentChange token={displayToken} />
            </Box>
          </Box>
          <Box className="flex min-w-0 flex-col items-end">
            <TokenCellSecondaryDisplay
              token={displayToken}
              handleScamWarningModal={setShowScamWarningModal}
              privacyMode={privacyMode}
            />
            <TokenCellPrimaryDisplay
              token={displayToken}
              privacyMode={privacyMode}
            />
          </Box>
        </a>
      </Box>
      {showScamWarningModal && (
        <NativeTokenScamWarningModal
          token={token}
          safeChains={safeChains}
          onClose={() => setShowScamWarningModal(false)}
        />
      )}
    </>
  );
};

/**
 * Token table for the fullscreen design. Lists the same tokens as `TokenList`,
 * laid out as columns.
 *
 * TODO: Match the final design (columns, sorting from the header, and
 * the mUSD / Money token CTAs that `TokenList` shows).
 *
 * @param props - The component props.
 * @param props.onTokenClick - Called when a token row is opened.
 * @param props.safeChains - Known chains, used by the native token warning.
 */
export const TokenTable = ({ onTokenClick, safeChains }: TokenTableProps) => {
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const preferenceKey = `${tokenSortConfig?.key ?? ''}:${tokenSortConfig?.order ?? ''}`;
  const [headerSort, setHeaderSort] = useState<{
    column: SortColumn;
    reversed: boolean;
  } | null>(null);
  const [headerSortPreferenceKey, setHeaderSortPreferenceKey] =
    useState(preferenceKey);
  if (headerSortPreferenceKey !== preferenceKey) {
    setHeaderSortPreferenceKey(preferenceKey);
    setHeaderSort(null);
  }
  const activeColumn =
    headerSort?.column ?? getActiveSortColumn(tokenSortConfig?.key);
  const reversed = headerSort?.reversed ?? false;

  const handleSort = useCallback(
    (column: SortColumn) => {
      setHeaderSort({
        column,
        reversed: column === activeColumn ? !reversed : false,
      });
    },
    [activeColumn, reversed],
  );

  const getSortValue = useTokenSortValues(
    headerSort?.column === 'price' || headerSort?.column === 'change'
      ? headerSort.column
      : null,
  );
  const sortOverride = useMemo((): TokenTableSort | null => {
    if (headerSort === null) {
      return null;
    }

    const { column, reversed: headerReversed } = headerSort;
    if (column === 'price' || column === 'change') {
      return {
        column,
        reversed: headerReversed,
        getValue: getSortValue ?? noSortValue,
      };
    }

    return { column, reversed: headerReversed };
  }, [getSortValue, headerSort]);
  const {
    tokenListItems,
    showLoadingSkeleton,
    hasBalance,
    privacyMode,
    isLowValueAssetsExpanded,
    handleLowValueAssetsToggle,
    getTokenClickHandler,
  } = useTokenListData({
    onTokenClick,
    sortOverride,
  });

  const renderRow = useCallback(
    (info: { item: TokenListDisplayItem }) => {
      const { item } = info;
      if (item.type === 'low-value-toggle') {
        return (
          <LowValueAssetsToggle
            count={item.count}
            isExpanded={isLowValueAssetsExpanded}
            onClick={handleLowValueAssetsToggle}
          />
        );
      }

      return (
        <Row
          token={item.token}
          privacyMode={privacyMode}
          onClick={getTokenClickHandler(item.token)}
          safeChains={safeChains}
        />
      );
    },
    [
      getTokenClickHandler,
      handleLowValueAssetsToggle,
      isLowValueAssetsExpanded,
      privacyMode,
      safeChains,
    ],
  );

  if (showLoadingSkeleton) {
    return <TokenListLoadingSkeleton />;
  }

  return (
    <div data-testid="token-table" className="@container/token-table">
      <Header
        activeColumn={activeColumn}
        reversed={reversed}
        onSort={handleSort}
      />
      {/* Virtualization is disabled for the empty balance state, as in TokenList. */}
      {hasBalance ? (
        <VirtualizedList
          data={tokenListItems}
          estimatedItemSize={ASSET_CELL_HEIGHT}
          overscan={10}
          keyExtractor={getTokenListItemKey}
          renderItem={renderRow}
        />
      ) : (
        <div className="token-list-non-virtualized">
          {tokenListItems.map((item, index) => (
            <div key={getTokenListItemKey(item, index)}>
              {renderRow({ item })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
