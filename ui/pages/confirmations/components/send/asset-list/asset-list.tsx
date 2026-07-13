import React, { useCallback, useContext } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  Box,
} from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { type Asset } from '../../../types/send';
import { useNavigateSendPage } from '../../../hooks/send/useNavigateSendPage';
import { useAssetSelectionMetrics } from '../../../hooks/send/metrics/useAssetSelectionMetrics';
import { SendContext } from '../../../context/send';
import { Asset as AssetComponent } from '../../UI/asset';
import { useScrollContainer } from '../../../../../contexts/scroll-container';

type AssetListProps = {
  tokens: Asset[];
  nfts: Asset[];
  allTokens: Asset[];
  allNfts: Asset[];
  onClearFilters?: () => void;
  hideNfts?: boolean;
  hideBalances?: boolean;
  onAssetSelect?: (asset: Asset) => void;
  emptyStateMessage?: string;
  disableMetrics?: boolean;
};

type ListItem =
  | { type: 'token'; asset: Asset }
  | { type: 'nft-header' }
  | { type: 'nft'; asset: Asset };

const ITEM_HEIGHT = 70;
const HEADER_HEIGHT = 40;
const noop = () => undefined;

export const AssetList = ({
  tokens,
  nfts,
  allTokens,
  allNfts,
  onClearFilters,
  hideNfts = false,
  hideBalances = false,
  onAssetSelect,
  emptyStateMessage,
  disableMetrics = false,
}: AssetListProps) => {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const { goToAmountRecipientPage } = useNavigateSendPage();
  // Use context directly so catalog pickers (e.g. ramps) can reuse this list
  // outside SendContextProvider when `onAssetSelect` is provided.
  const sendContext = useContext(SendContext);
  const { captureAssetSelected: captureAssetSelectedFromMetrics } =
    useAssetSelectionMetrics();
  const captureAssetSelected = disableMetrics
    ? noop
    : captureAssetSelectedFromMetrics;

  const effectiveNfts = hideNfts ? [] : nfts;
  const effectiveAllNfts = hideNfts ? [] : allNfts;

  const hasFilteredResults = tokens.length > 0 || effectiveNfts.length > 0;
  const hasAnyAssets = allTokens.length > 0 || effectiveAllNfts.length > 0;

  const handleAssetClick = useCallback(
    (asset: Asset) => {
      if (asset.disabled) {
        return;
      }

      if (onAssetSelect) {
        onAssetSelect(asset);
        return;
      }

      sendContext.updateAsset(asset);
      goToAmountRecipientPage();
      captureAssetSelected(asset);
    },
    [captureAssetSelected, goToAmountRecipientPage, onAssetSelect, sendContext],
  );

  const items: ListItem[] = [];

  tokens.forEach((token) => {
    items.push({ type: 'token', asset: token });
  });

  if (effectiveNfts.length > 0) {
    items.push({ type: 'nft-header' });
    effectiveNfts.forEach((nft) => {
      items.push({ type: 'nft', asset: nft });
    });
  }

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollContainerRef?.current || document.body,
    estimateSize: (index) =>
      items[index].type === 'nft-header' ? HEADER_HEIGHT : ITEM_HEIGHT,
    overscan: 10,
  });

  // Show "no results" message only if there are assets available but none match the search
  if (!hasFilteredResults && hasAnyAssets) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        margin={4}
        gap={3}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
        >
          {emptyStateMessage ?? t('noTokensMatchingYourFilters')}
        </Text>
        {onClearFilters && (
          <Button
            variant={ButtonVariant.Link}
            size={ButtonSize.Sm}
            onClick={onClearFilters}
            data-testid="clear-filters-button"
          >
            {t('clearFilters')}
          </Button>
        )}
      </Box>
    );
  }

  if (items.length === 0) {
    if (!emptyStateMessage) {
      return null;
    }

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        margin={4}
        gap={3}
        data-testid="asset-list-empty"
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
        >
          {emptyStateMessage}
        </Text>
      </Box>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className="relative w-full"
      style={{
        height: `${virtualizer.getTotalSize()}px`,
      }}
    >
      {virtualItems.map((virtualItem) => {
        const item = items[virtualItem.index];

        return (
          <div
            key={
              item.type === 'nft-header'
                ? String(virtualItem.key)
                : extractKey(item)
            }
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {item.type === 'nft-header' ? (
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textAlternative}
                marginInline={4}
                marginTop={2}
                marginBottom={2}
              >
                NFTs
              </Text>
            ) : (
              <AssetComponent
                asset={item.asset}
                onClick={() => handleAssetClick(item.asset)}
                hideBalances={hideBalances}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

function extractKey(item: { type: 'token' | 'nft'; asset: Asset }) {
  const { asset } = item;
  if (item.type === 'token') {
    return `${asset.address ?? asset.assetId}-${asset.chainId}`;
  }
  return `${asset.address}-${asset.chainId}-${asset.tokenId}`;
}
