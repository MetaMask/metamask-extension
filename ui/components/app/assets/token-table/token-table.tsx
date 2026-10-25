import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { CaipAssetType } from '@metamask/utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
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

const COLUMNS_CLASS_NAME =
  'grid grid-cols-[minmax(0,1fr)_120px_96px_minmax(0,160px)] items-center gap-4 px-4';

const TokenTableHeader = () => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      className={`${COLUMNS_CLASS_NAME} py-2 border-b border-b-muted`}
      data-testid="token-table-header"
    >
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
      >
        {t('token')}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
      >
        {t('price')}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
      >
        {t('24hChange')}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
        className="text-end"
      >
        {t('balance')}
      </Text>
    </Box>
  );
};

type TokenTableRowProps = {
  token: TokenWithFiatAmount;
  privacyMode: boolean;
  onClick?: () => void;
  safeChains?: SafeChain[];
};

const TokenTableRow = ({
  token,
  privacyMode,
  onClick,
  safeChains,
}: TokenTableRowProps) => {
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
          <TokenCellPrice token={displayToken} />
          <TokenCellPercentChange token={displayToken} />
          <Box className="flex min-w-0 flex-col">
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
  const {
    tokenListItems,
    showLoadingSkeleton,
    hasBalance,
    privacyMode,
    isLowValueAssetsExpanded,
    handleLowValueAssetsToggle,
    getTokenClickHandler,
  } = useTokenListData({ onTokenClick });

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
    <div data-testid="token-table">
      <TokenTableHeader />
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
