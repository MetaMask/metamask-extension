import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RampsToken } from '@metamask/ramps-controller';
import { type CaipChainId } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  TextButton,
  TextButtonSize,
  TextFieldSearch,
  TextFieldSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useRampsController } from '../../../../hooks/ramps/useRampsController';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import LoadingScreen from '../../../../components/ui/loading-screen';
import { getRampsNetworkDetailsForCaipChainId } from './utils/getRampsNetworkDetailsForCaipChainId';
import { RampsNetworkFilterBar } from './components/ramps-network-filter-bar';
import { RampsTokenListItem } from './components/ramps-token-list-item';
import RampsTokenSelectionHeader from './components/ramps-token-selection-header';
import { useRampsSearchTokenResults } from './hooks/useRampsSearchTokenResults';

function useRampsChainNetworkDetails() {
  const allNetworkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  return useMemo(() => {
    const map = new Map<
      string,
      { networkName: string; networkImage: string }
    >();

    Object.entries(allNetworkConfigurationsByCaipChainId).forEach(
      ([caipChainId, network]) => {
        map.set(
          caipChainId,
          getRampsNetworkDetailsForCaipChainId(
            caipChainId as CaipChainId,
            network.name,
          ),
        );
      },
    );

    return map;
  }, [allNetworkConfigurationsByCaipChainId]);
}

function filterTokensByEnabledNetworks(
  tokens: RampsToken[] | undefined,
  networksByCaipChainId: Record<string, unknown>,
): RampsToken[] {
  if (!tokens) {
    return [];
  }

  return tokens.filter(
    (token) =>
      Boolean(token.chainId) &&
      networksByCaipChainId[token.chainId as CaipChainId] !== undefined,
  );
}

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
    const topTokens = filterTokensByEnabledNetworks(
      controllerTokens?.topTokens,
      networksByCaipChainId,
    );
    const allTokens = filterTokensByEnabledNetworks(
      controllerTokens?.allTokens,
      networksByCaipChainId,
    );

    return {
      topTokens,
      allTokens,
      isLoading: tokensLoading,
      error: tokensError,
    };
  }, [controllerTokens, tokensLoading, tokensError, networksByCaipChainId]);
}

export function RampsTokenSelectionScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const chainNetworkNameAndImageMap = useRampsChainNetworkDetails();
  const { setSelectedToken } = useRampsController();
  const { topTokens, allTokens, isLoading, error } =
    useRampsTokenSelectionData();

  const [searchString, setSearchString] = useState('');
  const [networkFilter, setNetworkFilter] = useState<CaipChainId | null>(null);
  const [showAllTokens, setShowAllTokens] = useState(false);

  const isSearching = Boolean(searchString.trim());
  const sourceTokens = useMemo(() => {
    if (isSearching || showAllTokens) {
      return allTokens;
    }
    return topTokens;
  }, [allTokens, isSearching, showAllTokens, topTokens]);

  const networkNameByChainId = useMemo(() => {
    const map = new Map<string, string>();
    chainNetworkNameAndImageMap.forEach(({ networkName }, chainId) => {
      map.set(chainId, networkName);
    });
    return map;
  }, [chainNetworkNameAndImageMap]);

  const searchResults = useRampsSearchTokenResults({
    tokens: sourceTokens,
    networkFilter,
    searchString,
    networkNameByChainId,
  });

  const uniqueNetworks = useMemo(() => {
    const seen = new Set<string>();
    const networks: {
      chainId: CaipChainId;
      name: string;
      image?: string;
    }[] = [];

    for (const token of sourceTokens) {
      if (!token.chainId || seen.has(token.chainId)) {
        continue;
      }

      seen.add(token.chainId);
      const details =
        chainNetworkNameAndImageMap.get(token.chainId) ??
        getRampsNetworkDetailsForCaipChainId(token.chainId as CaipChainId);
      networks.push({
        chainId: token.chainId as CaipChainId,
        name: details.networkName,
        image: details.networkImage,
      });
    }

    return networks;
  }, [chainNetworkNameAndImageMap, sourceTokens]);

  const canExpandTokenList =
    !isSearching && !showAllTokens && allTokens.length > topTokens.length;

  const emptyStateMessage = useMemo(() => {
    if (isSearching) {
      return t('noTokensMatchSearch');
    }

    if (networkFilter) {
      return t('noTokensMatchingYourFilters');
    }

    return t('rampsNoTokensAvailable');
  }, [isSearching, networkFilter, t]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSelectToken = useCallback(
    (assetId: string) => {
      setSelectedToken(assetId);
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

      <RampsNetworkFilterBar
        networks={uniqueNetworks}
        selectedChainId={networkFilter}
        onChange={setNetworkFilter}
      />

      <Box className="w-full px-4 pb-3">
        <TextFieldSearch
          size={TextFieldSize.Md}
          placeholder={t('enterTokenNameOrAddress')}
          value={searchString}
          onChange={(event) => setSearchString(event.target.value)}
          clearButtonOnClick={() => setSearchString('')}
          clearButtonProps={{ ariaLabel: t('clear') }}
          className="w-full rounded-lg"
          data-testid="ramps-token-search"
          inputProps={{
            'data-testid': 'ramps-token-search-input',
          }}
        />
      </Box>

      <Box
        className="flex-1 overflow-y-auto"
        flexDirection={BoxFlexDirection.Column}
      >
        {searchResults.map((token) => {
          const networkDetails =
            chainNetworkNameAndImageMap.get(token.chainId) ??
            getRampsNetworkDetailsForCaipChainId(token.chainId as CaipChainId);

          return (
            <RampsTokenListItem
              key={token.assetId}
              token={token}
              networkImage={networkDetails.networkImage}
              onSelect={handleSelectToken}
            />
          );
        })}

        {searchResults.length === 0 && (
          <Box
            className="px-4 py-8"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={2}
            data-testid="ramps-token-selection-empty"
          >
            <Icon
              name={IconName.Search}
              size={IconSize.Lg}
              color={IconColor.IconMuted}
            />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {emptyStateMessage}
            </Text>
          </Box>
        )}
      </Box>

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
