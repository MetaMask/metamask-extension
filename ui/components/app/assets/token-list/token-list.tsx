import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { type CaipAssetType } from '@metamask/utils';
import { useHomeReady } from '../../../../pages/home/home-performance';
import { getSelectedAccountGroup } from '../../../../selectors/multichain-accounts/account-tree';
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
import { DustRedeemModal } from '../dust-redeem/dust-redeem-modal';
import { LowValueAssetsSection } from '../dust-redeem/low-value-assets-section';
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
    lowValueTokens,
    accountTokens,
  } = useTokenListData({ onTokenClick });
  const [isDustRedeemOpen, setIsDustRedeemOpen] = useState(false);
  const openDustRedeem = useCallback(() => setIsDustRedeemOpen(true), []);
  const closeDustRedeem = useCallback(() => setIsDustRedeemOpen(false), []);

  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  useHomeReady(Boolean(selectedAccountGroup) && !showLoadingSkeleton);

  const moneyTokenListCta = useMoneyTokenListCta(displayedTokens);

  const renderTokenListItem = useCallback(
    (info: { item: TokenListDisplayItem }) => {
      const { item } = info;
      if (item.type === 'low-value-toggle') {
        return (
          <LowValueAssetsSection
            count={item.count}
            isExpanded={isLowValueAssetsExpanded}
            onToggle={handleLowValueAssetsToggle}
            tokens={lowValueTokens}
            privacyMode={privacyMode}
            onRedeemClick={openDustRedeem}
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
      lowValueTokens,
      moneyTokenListCta,
      openDustRedeem,
      privacyMode,
      safeChains,
    ],
  );

  const dustRedeemModal = (
    <DustRedeemModal
      isOpen={isDustRedeemOpen}
      tokens={accountTokens}
      privacyMode={privacyMode}
      onClose={closeDustRedeem}
    />
  );

  if (showLoadingSkeleton) {
    return <TokenListLoadingSkeleton />;
  }

  const list = hasBalance ? (
    <VirtualizedList
      data={tokenListItems}
      estimatedItemSize={ASSET_CELL_HEIGHT}
      overscan={10}
      keyExtractor={getTokenListItemKey}
      renderItem={renderTokenListItem}
    />
  ) : (
    // Disable virtualization when empty balance state is shown
    <div className="token-list-non-virtualized">
      {tokenListItems.map((item, index) => (
        <div key={getTokenListItemKey(item, index)}>
          {renderTokenListItem({ item })}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {list}
      {dustRedeemModal}
    </>
  );
}

export default React.memo(TokenList);
