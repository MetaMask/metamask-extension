import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  FontWeight,
  Text,
  TextFieldSearch,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
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

const CHAINLIST_ROW_COLORS = [
  'bg-success-default',
  'bg-warning-muted',
  'bg-icon-default',
  'bg-primary-default',
  'bg-info-muted',
  'bg-error-default',
  'bg-success-muted',
  'bg-primary-muted',
];

const CHAINLIST_PAGE_SIZE = 100;
const CHAINLIST_SCROLL_THRESHOLD_PX = 120;

type ChainlistNetworkPickerProps = {
  existingNetworkChainIds: Set<string>;
  onSelect: (network: ChainlistNetwork) => void;
};

export const ChainlistNetworkPicker = ({
  existingNetworkChainIds,
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
      if (getUsableUrls(network.rpc).length === 0) {
        return false;
      }

      if (!normalizedSearchValue) {
        return true;
      }

      return (
        network.name.toLowerCase().includes(normalizedSearchValue) ||
        String(network.chainId).includes(normalizedSearchValue)
      );
    });
  }, [safeChains, searchValue]);

  const visibleChainlistNetworks = useMemo(
    () => chainlistNetworks.slice(0, visibleNetworkCount),
    [chainlistNetworks, visibleNetworkCount],
  );
  const showNoSearchResults =
    searchValue.trim().length > 0 && chainlistNetworks.length === 0;

  useEffect(() => {
    setVisibleNetworkCount(CHAINLIST_PAGE_SIZE);
  }, [searchValue]);

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
          className="w-full rounded-xl bg-background-default"
          data-testid="networks-page-chainlist-search"
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={t('searchNetworkNameOrChainId')}
          size={TextFieldSize.Lg}
          value={searchValue}
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
        {visibleChainlistNetworks.map((network, index) => {
          const isExistingNetwork = existingNetworkChainIds.has(
            getHexChainId(network.chainId),
          );

          return (
            <button
              className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-hover active:bg-pressed ${
                isExistingNetwork ? 'bg-muted' : ''
              }`}
              data-testid="networks-page-chainlist-network"
              key={`${network.chainId}-${network.name}`}
              onClick={() => onSelect(network)}
              type="button"
            >
              <Box
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-text-default ${
                  CHAINLIST_ROW_COLORS[index % CHAINLIST_ROW_COLORS.length]
                }`}
              >
                {network.name.charAt(0).toUpperCase()}
              </Box>
              <Box className="min-w-0 flex-1">
                <Box className="flex min-w-0 items-center gap-2">
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    className="truncate"
                  >
                    {network.name}
                  </Text>
                  {isExistingNetwork ? (
                    <Box
                      className="shrink-0 rounded-full bg-muted px-2 py-0.5"
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
