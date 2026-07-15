import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AvatarNetwork,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  FontWeight,
  Text,
  TextButton,
  TextFieldSearch,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../shared/constants/network';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import {
  type SafeChain,
  useSafeChains,
} from '../../components/multichain/networks-form/use-safe-chains';
import { useI18nContext } from '../../hooks/useI18nContext';
import { NoSearchResult } from './no-search-result';

export type ChainlistNetwork = SafeChain & {
  chain?: string;
  chainId: string | number;
  explorers?: { url?: string }[];
};

export const getHexChainId = (chainId: string | number) =>
  `0x${Number(chainId).toString(16)}`.toLowerCase();

export const getUsableUrls = (urls: string[] = []) =>
  urls.filter((url) => {
    if (!url || url.includes('${')) {
      return false;
    }

    try {
      const { protocol } = new URL(url);
      return protocol === 'https:';
    } catch {
      return false;
    }
  });

const CHAINLIST_PAGE_SIZE = 100;
const CHAINLIST_SCROLL_THRESHOLD_PX = 120;

type ChainlistNetworkPickerProps = {
  existingNetworkChainIds: Set<string>;
  existingNetworkNamesByChainId: Record<string, string>;
  onSelect: (network: ChainlistNetwork, searchQuery?: string) => void;
};

export const ChainlistNetworkPicker = ({
  existingNetworkChainIds,
  existingNetworkNamesByChainId,
  onSelect,
}: ChainlistNetworkPickerProps) => {
  const t = useI18nContext();
  const [searchValue, setSearchValue] = useState('');
  const [visibleNetworkCount, setVisibleNetworkCount] =
    useState(CHAINLIST_PAGE_SIZE);
  const { safeChains } = useSafeChains();

  const chainlistNetworks = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    return ((safeChains ?? []) as ChainlistNetwork[]).filter((network) => {
      const existingNetworkName =
        existingNetworkNamesByChainId[getHexChainId(network.chainId)];
      if (getUsableUrls(network.rpc).length === 0) {
        return false;
      }

      if (!normalizedSearchValue) {
        return true;
      }

      return (
        network.name.toLowerCase().includes(normalizedSearchValue) ||
        existingNetworkName?.toLowerCase().includes(normalizedSearchValue) ||
        String(network.chainId).includes(normalizedSearchValue)
      );
    });
  }, [existingNetworkNamesByChainId, safeChains, searchValue]);

  const visibleChainlistNetworks = useMemo(
    () => chainlistNetworks.slice(0, visibleNetworkCount),
    [chainlistNetworks, visibleNetworkCount],
  );
  const showNoSearchResults =
    searchValue.trim().length > 0 && chainlistNetworks.length === 0;

  useEffect(() => {
    setVisibleNetworkCount(CHAINLIST_PAGE_SIZE);
  }, [searchValue]);

  const handleLearnHowToStaySafe = useCallback(() => {
    global.platform.openTab({ url: ZENDESK_URLS.UNKNOWN_NETWORK });
  }, []);

  const handleChainlistScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom > CHAINLIST_SCROLL_THRESHOLD_PX) {
        return;
      }

      setVisibleNetworkCount((currentCount) =>
        Math.min(currentCount + CHAINLIST_PAGE_SIZE, chainlistNetworks.length),
      );
    },
    [chainlistNetworks.length],
  );

  return (
    <Box className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background-default">
      <Box className="px-4 pb-4">
        <TextFieldSearch
          clearButtonOnClick={() => setSearchValue('')}
          clearButtonProps={{ ariaLabel: t('clear') }}
          className="mm-text-field-search w-full rounded-full border border-border-muted bg-background-default"
          data-testid="networks-page-chainlist-search"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={t('searchNetworkNameOrChainId')}
          size={TextFieldSize.Lg}
          value={searchValue}
        />
        <BannerAlert
          className="mt-4"
          severity={BannerAlertSeverity.Info}
          data-testid="networks-page-chainlist-source-banner"
          description={t('chainlistNetworkDataSourceBanner', [
            <TextButton
              key="chainlist-learn-how-to-stay-safe"
              onClick={handleLearnHowToStaySafe}
            >
              {t('chainlistLearnHowToStaySafe')}
            </TextButton>,
          ])}
        />
      </Box>
      <Box
        className="min-h-0 flex-1 overflow-y-auto"
        data-testid="networks-page-chainlist-network-list"
        onScroll={handleChainlistScroll}
      >
        {showNoSearchResults ? (
          <NoSearchResult dataTestId="networks-page-chainlist-no-results" />
        ) : null}
        {visibleChainlistNetworks.map((network) => {
          const isExistingNetwork = existingNetworkChainIds.has(
            getHexChainId(network.chainId),
          );
          const displayName =
            existingNetworkNamesByChainId[getHexChainId(network.chainId)] ??
            network.name;
          const networkImageUrl =
            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
              getHexChainId(
                network.chainId,
              ) as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
            ];

          return (
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover active:bg-pressed"
              data-testid="networks-page-chainlist-network"
              key={`${network.chainId}-${network.name}`}
              onClick={() => onSelect(network, searchValue.trim() || undefined)}
            >
              {networkImageUrl ? (
                <AvatarNetwork
                  className="shrink-0 rounded-lg"
                  name={displayName}
                  size="md"
                  src={networkImageUrl}
                />
              ) : (
                <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-text-default">
                  {displayName.charAt(0).toUpperCase()}
                </Box>
              )}
              <Box className="min-w-0 flex-1">
                <Box className="flex min-w-0 items-center gap-2">
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    className="truncate"
                  >
                    {displayName}
                  </Text>
                  {isExistingNetwork ? (
                    <Box
                      className="shrink-0 rounded bg-muted px-2 py-0.5"
                      data-testid="networks-page-chainlist-added-pill"
                    >
                      <Text
                        variant={TextVariant.BodySm}
                        className="text-text-alternative"
                      >
                        {t('added')}
                      </Text>
                    </Box>
                  ) : null}
                </Box>
                <Text
                  variant={TextVariant.BodyMd}
                  className="truncate text-text-alternative"
                >
                  {t('chainlistNetworkDetails', [
                    network.nativeCurrency.symbol,
                    String(network.chainId),
                  ])}
                </Text>
              </Box>
            </button>
          );
        })}
      </Box>
    </Box>
  );
};
