import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CaipAssetType, Hex } from '@metamask/utils';
import { Box, TextButton, TextButtonSize } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';
import LoadingScreen from '../../../components/ui/loading-screen';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { Asset, type AssetType } from '../../../components/app/asset-picker';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
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

  const mappedTokens = useMemo(() => {
    const topTokens = filterRampsTokensByEnabledNetworks(
      controllerTokens?.topTokens,
      networksByCaipChainId,
    );
    const allTokens = filterRampsTokensByEnabledNetworks(
      controllerTokens?.allTokens,
      networksByCaipChainId,
    );
    // null = not loaded yet (bootstrap fetch pending); [] = genuinely empty.
    const tokensNotYetLoaded = controllerTokens === null && !tokensError;

    return {
      topTokens: mapRampsTokensToSendAssets(topTokens, networksByCaipChainId),
      allTokens: mapRampsTokensToSendAssets(allTokens, networksByCaipChainId),
      isLoading: tokensLoading || tokensNotYetLoaded,
      error: tokensError,
    };
  }, [controllerTokens, tokensLoading, tokensError, networksByCaipChainId]);

  return mappedTokens;
}

/**
 * Ramps buy-flow token selection screen.
 *
 * Token catalog hydration is owned by `RampsBootstrap` (same pattern as
 * mobile). This screen is read-only against controller state.
 *
 * Entry navigation uses `useRampsNavigation.goToBuy` so selection shares the
 * same buy gate and selected-token preload as other Buy entry points.
 */
export function RampsTokenSelectionScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { goToBuy } = useRampsNavigation();
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

      goToBuy({
        assetId: asset.assetId as CaipAssetType,
        chainId: asset.chainId as Hex | undefined,
      }).catch(() => undefined);
    },
    [goToBuy],
  );

  const handleExpandTokens = useCallback(() => {
    setShowAllTokens(true);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const title = t('swapSelectToken');

  if (error) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-token-selection-error"
        backButtonTestId="ramps-token-selection-back"
      >
        <RampsSelectionCenteredMessage message={t('rampsErrorLoadingTokens')} />
      </RampsSelectionPage>
    );
  }

  return (
    <RampsSelectionPage
      title={title}
      onBack={handleBack}
      testId="ramps-token-selection-screen"
      backButtonTestId="ramps-token-selection-back"
    >
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
            size={TextButtonSize.BodyMd}
            onClick={handleExpandTokens}
            data-testid="ramps-show-all-tokens"
          >
            {t('rampsShowAllTokens')}
          </TextButton>
        </Box>
      )}
    </RampsSelectionPage>
  );
}

export default RampsTokenSelectionScreen;
