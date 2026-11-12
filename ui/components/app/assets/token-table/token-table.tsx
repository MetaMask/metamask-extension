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
import type { CaipAssetType } from '@metamask/utils';
import { useAnalytics } from '../../../../hooks/useAnalytics';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  useMoneyTokenListCta,
  type MoneyTokenListCta as MoneyTokenListCtaConfig,
} from '../../../../hooks/money/useMoneyTokenListCta';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsTokenSortLocation,
  MetaMetricsTokenSortPreference,
  MetaMetricsUserTrait,
} from '../../../../../shared/constants/metametrics';
import { getTokenSortConfig } from '../../../../selectors';
import { VirtualizedList } from '../../../ui/virtualized-list/virtualized-list';
import type { SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { AssetCellBadge } from '../asset-list/cells/asset-cell-badge';
import { ASSET_CELL_HEIGHT } from '../constants';
import { useTokenDisplayInfo } from '../hooks';
import {
  getTokenListItemKey,
  type TokenListDisplayItem,
  useTokenListData,
} from '../hooks/useTokenListData';
import { useTokenSortOverride } from '../hooks/useTokenSortOverride';
import type {
  TokenTableHeaderSort,
  TokenTableSort,
} from '../util/sortAssetsWithPriority';
import { MoneyTokenListCta } from '../../money/money-token-list-cta';
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
import type { TokenWithFiatAmount } from '../types';

export type TokenTableProps = {
  onTokenClick: (
    chainId: string,
    address: string,
    assetId?: CaipAssetType,
  ) => void;
  safeChains?: SafeChain[];
};

type TokenTableRowProps = {
  token: TokenWithFiatAmount;
  privacyMode: boolean;
  onClick?: () => void;
  safeChains?: SafeChain[];
  moneyCta?: MoneyTokenListCtaConfig;
};

type TokenTableHeaderProps = {
  activeColumn: SortColumn | null;
  reversed: boolean;
  onSort: (column: SortColumn) => void;
};

type SortColumn = TokenTableSort['column'];

const TOKEN_SORT_PREFERENCE_BY_COLUMN: Record<
  SortColumn,
  MetaMetricsTokenSortPreference
> = {
  token: MetaMetricsTokenSortPreference.Title,
  balance: MetaMetricsTokenSortPreference.TokenFiatAmount,
  price: MetaMetricsTokenSortPreference.Price,
  change: MetaMetricsTokenSortPreference.PercentChange,
};

type SortableColumnHeaderProps = {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn | null;
  reversed: boolean;
  onSort: () => void;
  className?: string;
};

type HeaderColumn = {
  column: SortColumn;
  labelKey: 'token' | 'price' | '24hChange' | 'balance';
  className: string;
};

// Measures the table, not the viewport: the side nav has already taken 320px
// by the time `lg` would apply. Below `@2xl` (42rem of this table) the price
// cell stacks the 24h change under the price. At `@2xl` they are separate columns.
const COLUMNS_CLASS_NAME =
  'grid w-full grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))] items-center gap-4 px-4 @2xl/token-table:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]';

const PRICE_AND_CHANGE_ITEM_CLASS_NAME =
  'min-w-0 @2xl/token-table:justify-self-end';

const PERCENT_CHANGE_CLASS_NAME = `${PRICE_AND_CHANGE_ITEM_CLASS_NAME} @2xl/token-table:[&_.mm-text]:text-l-body-md`;

const HEADER_COLUMNS: HeaderColumn[] = [
  { column: 'token', labelKey: 'token', className: 'flex' },
  { column: 'price', labelKey: 'price', className: 'flex justify-end' },
  {
    column: 'change',
    labelKey: '24hChange',
    className: 'hidden justify-end @2xl/token-table:inline-flex',
  },
  { column: 'balance', labelKey: 'balance', className: 'flex justify-end' },
];

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

const TokenTableHeader = ({
  activeColumn,
  reversed,
  onSort,
}: TokenTableHeaderProps) => {
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

const TokenTableRow = ({
  token,
  privacyMode,
  onClick,
  safeChains,
  moneyCta,
}: TokenTableRowProps) => {
  const [showScamWarningModal, setShowScamWarningModal] = useState(false);
  const tokenDisplayInfo = useTokenDisplayInfo({ token });
  const displayToken = useMemo(
    () => ({ ...token, ...tokenDisplayInfo }),
    [token, tokenDisplayInfo],
  );
  const showMoneyCta = Boolean(moneyCta?.shouldShow(token));

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
              {showMoneyCta && moneyCta ? (
                <MoneyTokenListCta cta={moneyCta} token={token} />
              ) : (
                <TokenCellPercentChange token={displayToken} />
              )}
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
 * @param props - The component props.
 * @param props.onTokenClick - Called when a token row is opened.
 * @param props.safeChains - Known chains, used by the native token warning.
 */
export const TokenTable = ({ onTokenClick, safeChains }: TokenTableProps) => {
  const { trackEvent, createEventBuilder } = useAnalytics();
  const tokenSortConfig = useSelector(getTokenSortConfig);
  const preferenceKey = `${tokenSortConfig?.key ?? ''}:${tokenSortConfig?.order ?? ''}`;
  const [headerSort, setHeaderSort] = useState<TokenTableHeaderSort | null>(
    null,
  );
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
      const nextReversed = column === activeColumn ? !reversed : false;
      setHeaderSort({ column, reversed: nextReversed });
      trackEvent(
        createEventBuilder(MetaMetricsEventName.TokenSortPreference)
          .addCategory(MetaMetricsEventCategory.Settings)
          .addProperties({
            [MetaMetricsUserTrait.TokenSortPreference]:
              TOKEN_SORT_PREFERENCE_BY_COLUMN[column],
            location: MetaMetricsTokenSortLocation.TokenColumnHeader,
          })
          .build(),
      );
    },
    [activeColumn, createEventBuilder, reversed, trackEvent],
  );

  const sortOverride = useTokenSortOverride(headerSort);
  const {
    tokenListItems,
    displayedTokens,
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
  const moneyTokenListCta = useMoneyTokenListCta(displayedTokens);

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
        <TokenTableRow
          token={item.token}
          privacyMode={privacyMode}
          onClick={getTokenClickHandler(item.token)}
          safeChains={safeChains}
          moneyCta={moneyTokenListCta}
        />
      );
    },
    [
      getTokenClickHandler,
      handleLowValueAssetsToggle,
      isLowValueAssetsExpanded,
      moneyTokenListCta,
      privacyMode,
      safeChains,
    ],
  );

  if (showLoadingSkeleton) {
    return <TokenListLoadingSkeleton />;
  }

  return (
    <div data-testid="token-table" className="@container/token-table">
      <TokenTableHeader
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
