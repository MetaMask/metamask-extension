import React, { useCallback } from 'react';
import { type CaipAssetType } from '@metamask/utils';
import TokenCell from '../token-cell';
import { ASSET_CELL_HEIGHT } from '../constants';
import { SafeChain } from '../../../multichain/networks-form/use-safe-chains';
import { VirtualizedList } from '../../../ui/virtualized-list/virtualized-list';
import { TOKEN_LIST_CELL_MUSD_OPTIONS } from '../../musd/musd-events';
import { useMoneyTokenListCta } from '../../../../hooks/money/useMoneyTokenListCta';
import {
  getTokenListItemKey,
  type TokenListDisplayItem,
  useTokenListData,
} from '../hooks/useTokenListData';
import { LowValueAssetsToggle } from './low-value-assets-toggle';
import { TokenListLoadingSkeleton } from './token-list-loading-skeleton';

type TokenListProps = {
  onTokenClick: (
    chainId: string,
    address: string,
    assetId?: CaipAssetType,
  ) => void;
  safeChains?: SafeChain[];
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function TokenList({ onTokenClick, safeChains }: TokenListProps) {
  const {
    tokenListItems,
    displayedTokens,
    showLoadingSkeleton,
    hasBalance,
    privacyMode,
    isLowValueAssetsExpanded,
    handleLowValueAssetsToggle,
    getTokenClickHandler,
  } = useTokenListData({ onTokenClick });

  const moneyTokenListCta = useMoneyTokenListCta(displayedTokens);

  const renderTokenListItem = useCallback(
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

      const { token } = item;

      return (
        <TokenCell
          token={token}
          privacyMode={privacyMode}
          onClick={getTokenClickHandler(token)}
          safeChains={safeChains}
          musd={TOKEN_LIST_CELL_MUSD_OPTIONS}
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

  // Disable virtualization when empty balance state is shown
  if (!hasBalance) {
    return (
      <div className="token-list-non-virtualized">
        {tokenListItems.map((item, index) => (
          <div key={getTokenListItemKey(item, index)}>
            {renderTokenListItem({ item })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <VirtualizedList
      data={tokenListItems}
      estimatedItemSize={ASSET_CELL_HEIGHT}
      overscan={10}
      keyExtractor={getTokenListItemKey}
      renderItem={renderTokenListItem}
    />
  );
}

export default React.memo(TokenList);
