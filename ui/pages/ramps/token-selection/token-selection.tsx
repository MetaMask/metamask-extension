import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CaipAssetType, Hex } from '@metamask/utils';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import { useRampsAnalytics } from '../../../hooks/ramps/useRampsAnalytics';
import { useRampsScreenViewed } from '../../../hooks/ramps/useRampsScreenViewed';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../shared/lib/selectors/networks';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { Asset, type AssetType } from '../../../components/app/asset-picker';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionCenteredSpinner,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
import { RampsTokenUnavailableInfo } from './components/ramps-token-unavailable-info';
import { ScrollNearBottom } from './components/scroll-near-bottom';
import {
  filterRampsTokensByEnabledNetworks,
  mapRampsTokensToSendAssets,
} from './utils/mapRampsTokensToSendAssets';

// Number of additional catalog tokens revealed each time the user scrolls to
// the bottom of the list. Keep it large enough that one page (~70px per row)
// pushes the scroll position well past the 200px near-bottom threshold in
// `ScrollNearBottom`, so one scroll gesture reveals at most one page.
const TOKENS_PER_PAGE = 50;

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
  const { trackTokenSelected } = useRampsAnalytics();
  const { topTokens, allTokens, isLoading, error } =
    useRampsTokenSelectionData();

  useRampsScreenViewed('Token Selection');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [revealedTokenCount, setRevealedTokenCount] = useState(0);

  const isSearching = Boolean(searchQuery.trim());
  const isNetworkFilterActive = selectedChainId !== null;

  // Tokens listed beyond the top tokens. Deduplicated against `topTokens`
  // so scrolling never renders a token twice regardless of catalog order.
  const extraTokens = useMemo(() => {
    const topTokenIds = new Set(topTokens.map((token) => token.assetId));
    return allTokens.filter((token) => !topTokenIds.has(token.assetId));
  }, [allTokens, topTokens]);

  const sourceTokens = useMemo(() => {
    if (isSearching || isNetworkFilterActive) {
      return allTokens;
    }

    if (revealedTokenCount === 0) {
      return topTokens;
    }

    return [...topTokens, ...extraTokens.slice(0, revealedTokenCount)];
  }, [
    allTokens,
    extraTokens,
    isNetworkFilterActive,
    isSearching,
    revealedTokenCount,
    topTokens,
  ]);

  const emptyStateMessage = useMemo(() => {
    if (isSearching) {
      return t('noTokensMatchSearch');
    }

    if (isNetworkFilterActive) {
      return t('noTokensMatchingYourFilters');
    }

    return t('rampsNoTokensAvailable');
  }, [isNetworkFilterActive, isSearching, t]);

  const canLoadMore =
    !isSearching &&
    !isNetworkFilterActive &&
    revealedTokenCount < extraTokens.length;

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  // Tokens flagged `disabled` by the catalog (tokenSupported === false) cannot
  // be bought in the user's region / via any available provider. Surface an
  // info button that explains why, instead of only greying the row out
  // (Figma "Token unavailable" dialog, TRAM-3710/TRAM-3961).
  const renderUnavailableInfo = useCallback((asset: AssetType) => {
    if (!asset.disabled) {
      return null;
    }

    return <RampsTokenUnavailableInfo />;
  }, []);

  const endRenderers = useMemo(
    () => [renderUnavailableInfo],
    [renderUnavailableInfo],
  );

  const handleAssetSelect = useCallback(
    (asset: AssetType) => {
      if (asset.disabled || !asset.assetId) {
        return;
      }

      // currencyDestination is the full CAIP-19 assetId (matching mobile's
      // `ramps-token-selected` emission — same value as tokenCaip19).
      trackTokenSelected({
        tokenCaip19: asset.assetId,
        tokenSymbol: asset.symbol,
        currencyDestination: asset.assetId,
        currencyDestinationSymbol: asset.symbol,
        currencyDestinationNetwork: asset.networkName,
      });

      goToBuy({
        assetId: asset.assetId as CaipAssetType,
        chainId: asset.chainId as Hex | undefined,
      }).catch(() => undefined);
    },
    [goToBuy, trackTokenSelected],
  );

  const handleRevealMoreTokens = useCallback(() => {
    setRevealedTokenCount((count) =>
      Math.min(count + TOKENS_PER_PAGE, extraTokens.length),
    );
  }, [extraTokens.length]);

  const title = t('swapSelectToken');

  let testId = 'ramps-token-selection-screen';
  let body: React.ReactNode;

  if (isLoading) {
    testId = 'ramps-token-selection-loading';
    body = <RampsSelectionCenteredSpinner />;
  } else if (error) {
    testId = 'ramps-token-selection-error';
    body = (
      <RampsSelectionCenteredMessage message={t('rampsErrorLoadingTokens')} />
    );
  } else {
    body = (
      <ScrollContainer
        className="flex-1 overflow-y-auto"
        data-testid="ramps-token-selection-scroll-container"
      >
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
          endRenderers={endRenderers}
        />
        <ScrollNearBottom
          onNearBottom={handleRevealMoreTokens}
          enabled={canLoadMore}
          observedLength={sourceTokens.length}
        />
      </ScrollContainer>
    );
  }

  return (
    <RampsSelectionPage
      title={title}
      onBack={handleBack}
      testId={testId}
      backButtonTestId="ramps-token-selection-back"
    >
      {body}
    </RampsSelectionPage>
  );
}

export default RampsTokenSelectionScreen;
