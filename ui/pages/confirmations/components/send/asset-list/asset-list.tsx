import React, { useCallback, useMemo } from 'react';

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
import { VirtualizedList } from '../../../../../components/ui/virtualized-list/virtualized-list';

type AssetListProps = {
  tokens: Asset[];
  nfts: Asset[];
  allTokens: Asset[];
  allNfts: Asset[];
  onClearFilters?: () => void;
  hideNfts?: boolean;
  onAssetSelect?: (asset: Asset) => void;
};

type ListItem =
  | { type: 'token'; asset: Asset }
  | { type: 'nft-header' }
  | { type: 'nft'; asset: Asset };

const ITEM_HEIGHT = 70;

export const AssetList = ({
  tokens,
  nfts,
  allTokens,
  allNfts,
  onClearFilters,
  hideNfts = false,
  onAssetSelect,
}: AssetListProps) => {
  const t = useI18nContext();
  const { goToAmountRecipientPage } = useNavigateSendPage();
  const { updateAsset } = useSendContext();
  const { captureAssetSelected } = useAssetSelectionMetrics();

  const hasFilteredResults =
    tokens.length > 0 || (!hideNfts && nfts.length > 0);
  const hasAnyAssets =
    allTokens.length > 0 || (!hideNfts && allNfts.length > 0);

  const handleAssetClick = useCallback(
    (asset: Asset) => {
      if (onAssetSelect) {
        onAssetSelect(asset);
        return;
      }

      updateAsset(asset);
      goToAmountRecipientPage();
      captureAssetSelected(asset);
    },
    [updateAsset, goToAmountRecipientPage, captureAssetSelected, onAssetSelect],
  );

  const items = useMemo(() => {
    const listItems: ListItem[] = tokens.map((token) => ({
      type: 'token',
      asset: token,
    }));

    if (!hideNfts && nfts.length > 0) {
      listItems.push({ type: 'nft-header' });
      nfts.forEach((nft) => {
        listItems.push({ type: 'nft', asset: nft });
      });
    }

    return listItems;
  }, [tokens, nfts, hideNfts]);

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

  return (
    <VirtualizedList
      data={items}
      estimatedItemSize={ITEM_HEIGHT}
      overscan={10}
      keyExtractor={(item, index) =>
        item.type === 'nft-header' ? `nft-header-${index}` : extractKey(item)
      }
      renderItem={({ item }) =>
        item.type === 'nft-header' ? (
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
        )
      }
    />
  );
};

function extractKey(item: { type: 'token' | 'nft'; asset: Asset }) {
  const { asset } = item;
  if (item.type === 'token') {
    return `${asset.address ?? asset.assetId}-${asset.chainId}`;
  }
  return `${asset.address}-${asset.chainId}-${asset.tokenId}`;
}
