import React, { useCallback } from 'react';

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

type AssetListProps = {
  tokens: Asset[];
  nfts: Asset[];
  allTokens: Asset[];
  allNfts: Asset[];
  onClearFilters?: () => void;
};

export const AssetList = ({
  tokens,
  nfts,
  allTokens,
  allNfts,
  onClearFilters,
}: AssetListProps) => {
  const t = useI18nContext();
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

  return (
    <>
      {tokens.map((token) => (
        <AssetComponent
          key={`${token.address}-${token.chainId}`}
          asset={token}
          onClick={() => handleAssetClick(token)}
        />
      ))}
      {nfts.length > 0 && (
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textAlternative}
          margin={4}
        >
          NFTs
        </Text>
      )}
      {nfts.map((nft) => (
        <AssetComponent
          key={`${nft.address}-${nft.chainId}-${nft.tokenId}`}
          asset={nft}
          onClick={() => handleAssetClick(nft)}
        />
      ))}
    </>
  );
};
