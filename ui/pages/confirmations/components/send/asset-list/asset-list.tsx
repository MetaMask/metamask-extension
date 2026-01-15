import React, { useCallback } from 'react';
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
import { useSendContext } from '../../../context/send';
import { Asset as AssetComponent } from '../../UI/asset';
import { useScrollContainer } from '../../../../../contexts/scroll-container';

type AssetListProps = {
  tokens: Asset[];
  nfts: Asset[];
  allTokens: Asset[];
  allNfts: Asset[];
  onClearFilters?: () => void;
};

type ListItem =
  | { type: 'token'; asset: Asset }
  | { type: 'nft-header' }
  | { type: 'nft'; asset: Asset };

const ITEM_HEIGHT = 70;
const HEADER_HEIGHT = 40;

export const AssetList = ({
  tokens,
  nfts,
  allTokens,
  allNfts,
  onClearFilters,
}: AssetListProps) => {
  const t = useI18nContext();
  const scrollContainerRef = useScrollContainer();
  const { goToAmountRecipientPage } = useNavigateSendPage();
  const { updateAsset } = useSendContext();
  const { captureAssetSelected } = useAssetSelectionMetrics();
  const hasFilteredResults = tokens.length > 0 || nfts.length > 0;
  const hasAnyAssets = allTokens.length > 0 || allNfts.length > 0;

  const handleAssetClick = useCallback(
    (asset: Asset) => {
      updateAsset(asset);
      goToAmountRecipientPage();
      captureAssetSelected(asset);
    },
    [updateAsset, goToAmountRecipientPage, captureAssetSelected],
  );

  const items: ListItem[] = [];

  tokens.forEach((token) => {
    items.push({ type: 'token', asset: token });
  });

  if (nfts.length > 0) {
    items.push({ type: 'nft-header' });
    nfts.forEach((nft) => {
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
          {t('noTokensMatchingYourFilters')}
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
    return null;
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
