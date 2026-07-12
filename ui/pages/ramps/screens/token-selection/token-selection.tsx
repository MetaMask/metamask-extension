import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
  TextButton,
  TextButtonSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useRampsController } from '../../../../hooks/ramps/useRampsController';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { ScrollContainer } from '../../../../contexts/scroll-container';
import { Asset, type AssetType } from '../../../../components/app/asset-picker';
import RampsTokenSelectionHeader from './components/ramps-token-selection-header';
import {
  filterRampsTokensByEnabledNetworks,
  mapRampsTokensToSendAssets,
} from './utils/mapRampsTokensToSendAssets';

function useRampsTokenSelectionData() {
  const {
    tokens: controllerTokens,
    tokensLoading,
    tokensError,
  } = useRampsController();
  const networksByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  return useMemo(() => {
    const topTokens = filterRampsTokensByEnabledNetworks(
      controllerTokens?.topTokens,
      networksByCaipChainId,
    );
    const allTokens = filterRampsTokensByEnabledNetworks(
      controllerTokens?.allTokens,
      networksByCaipChainId,
    );
    const hasAttemptedLoad =
      tokensLoading || controllerTokens !== null || tokensError !== null;

    return {
      topTokens: mapRampsTokensToSendAssets(topTokens, networksByCaipChainId),
      allTokens: mapRampsTokensToSendAssets(allTokens, networksByCaipChainId),
      isLoading: tokensLoading || (!hasAttemptedLoad && !tokensError),
      error: tokensError,
    };
  }, [controllerTokens, tokensLoading, tokensError, networksByCaipChainId]);
}

/**
 * Ramps buy-flow token selection screen.
 *
 * Route registration and entry-point navigation are tracked in TRAM-3711.
 */
export function RampsTokenSelectionScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { setSelectedToken } = useRampsController();
  const { topTokens, allTokens, isLoading, error } =
    useRampsTokenSelectionData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [showAllTokens, setShowAllTokens] = useState(false);

  const isSearching = Boolean(searchQuery.trim());
  const isNetworkFilterActive = selectedChainId !== null;
  const sourceTokens = useMemo(() => {
    if (isSearching || showAllTokens || isNetworkFilterActive) {
      return allTokens;
    }
    return topTokens;
  }, [allTokens, isNetworkFilterActive, isSearching, showAllTokens, topTokens]);

  const emptyStateMessage = useMemo(() => {
    if (isSearching) {
      return t('noTokensMatchSearch');
    }

    if (isNetworkFilterActive) {
      return t('noTokensMatchingYourFilters');
    }

    return t('rampsNoTokensAvailable');
  }, [isNetworkFilterActive, isSearching, t]);

  const canExpandTokenList =
    !isSearching &&
    !isNetworkFilterActive &&
    !showAllTokens &&
    allTokens.length > topTokens.length;

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleAssetSelect = useCallback(
    (asset: AssetType) => {
      if (asset.disabled || !asset.assetId) {
        return;
      }

      setSelectedToken(asset.assetId);
      navigate(-1);
    },
    [navigate, setSelectedToken],
  );

  const handleExpandTokens = useCallback(() => {
    setShowAllTokens(true);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Box
        className="flex h-full flex-col bg-background-default"
        flexDirection={BoxFlexDirection.Column}
        data-testid="ramps-token-selection-error"
      >
        <RampsTokenSelectionHeader
          title={t('swapSelectToken')}
          onBack={handleBack}
        />
        <Box
          className="flex-1 px-4 py-8"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          gap={2}
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('rampsErrorLoadingTokens')}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className="flex h-full flex-col bg-background-default"
      flexDirection={BoxFlexDirection.Column}
      data-testid="ramps-token-selection-screen"
    >
      <RampsTokenSelectionHeader
        title={t('swapSelectToken')}
        onBack={handleBack}
      />

      <ScrollContainer className="flex-1 overflow-y-auto">
        <Asset
          tokens={sourceTokens}
          nfts={[]}
          hideNfts
          hideBalances
          disableMetrics
          searchPlaceholder={t('enterTokenNameOrAddress')}
          emptyStateMessage={emptyStateMessage}
          onAssetSelect={handleAssetSelect}
          onSearchQueryChange={setSearchQuery}
          onSelectedChainIdChange={setSelectedChainId}
        />
      </ScrollContainer>

      {canExpandTokenList && (
        <Box className="border-t border-border-muted px-4 py-3">
          <TextButton
            size={TextButtonSize.Md}
            onClick={handleExpandTokens}
            data-testid="ramps-show-all-tokens"
          >
            {t('rampsShowAllTokens')}
          </TextButton>
        </Box>
      )}
    </Box>
  );
}

export default RampsTokenSelectionScreen;
