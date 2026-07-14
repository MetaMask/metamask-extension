import React, { useState, useCallback, useEffect, useMemo } from 'react';

import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../../components/component-library';
import { useSendAssets } from '../../../hooks/send/useSendAssets';
import { useSendAssetFilter } from '../../../hooks/send/useSendAssetFilter';
import { useAssetSelectionMetrics } from '../../../hooks/send/metrics/useAssetSelectionMetrics';
import { AssetFilterMethod } from '../../../context/send-metrics';
import { AssetList } from '../asset-list';
import { AssetFilterInput } from '../asset-filter-input';
import { NetworkFilter } from '../network-filter';
import { type Asset as AssetType } from '../../../types/send';

const noop = () => undefined;

export type AssetProps = {
  hideNfts?: boolean;
  includeNoBalance?: boolean;
  onAssetSelect?: (asset: AssetType) => void;
  tokenFilter?: (assets: AssetType[]) => AssetType[];
  /**
   * When provided, these tokens are used instead of wallet tokens from
   * `useSendAssets`. Useful for catalog-style pickers (e.g. ramps).
   */
  tokens?: AssetType[];
  /**
   * Optional NFT list used with `tokens`. Defaults to an empty list when
   * `tokens` is provided.
   */
  nfts?: AssetType[];
  hideBalances?: boolean;
  disableMetrics?: boolean;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  onSearchQueryChange?: (searchQuery: string) => void;
  onSelectedChainIdChange?: (selectedChainId: string | null) => void;
};

type AssetPickerViewProps = Omit<
  AssetProps,
  'tokens' | 'nfts' | 'includeNoBalance'
> & {
  tokens: AssetType[];
  nfts: AssetType[];
};

const AssetPickerView = ({
  hideNfts = false,
  onAssetSelect,
  tokenFilter,
  tokens,
  nfts,
  hideBalances = false,
  disableMetrics = false,
  searchPlaceholder,
  emptyStateMessage,
  onSearchQueryChange,
  onSelectedChainIdChange,
}: AssetPickerViewProps) => {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const {
    addAssetFilterMethod: addAssetFilterMethodFromMetrics,
    removeAssetFilterMethod: removeAssetFilterMethodFromMetrics,
    setAssetListSize: setAssetListSizeFromMetrics,
  } = useAssetSelectionMetrics();

  const addAssetFilterMethod = disableMetrics
    ? noop
    : addAssetFilterMethodFromMetrics;
  const removeAssetFilterMethod = disableMetrics
    ? noop
    : removeAssetFilterMethodFromMetrics;
  const setAssetListSize = disableMetrics ? noop : setAssetListSizeFromMetrics;

  const filteredByCustomFilter = useMemo(() => {
    return tokenFilter ? tokenFilter(tokens) : tokens;
  }, [tokens, tokenFilter]);

  const effectiveNfts = hideNfts ? [] : nfts;

  const { filteredTokens, filteredNfts } = useSendAssetFilter({
    tokens: filteredByCustomFilter,
    nfts: effectiveNfts,
    selectedChainId,
    searchQuery,
  });

  useEffect(() => {
    const allAssets = [...tokens, ...nfts];
    setAssetListSize(allAssets.length.toString());
  }, [tokens, nfts, setAssetListSize]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedChainId(null);
    onSearchQueryChange?.('');
    onSelectedChainIdChange?.(null);
  }, [onSearchQueryChange, onSelectedChainIdChange]);

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      if (value === '') {
        removeAssetFilterMethod(AssetFilterMethod.Search);
      } else {
        addAssetFilterMethod(AssetFilterMethod.Search);
      }
      setSearchQuery(value);
      onSearchQueryChange?.(value);
    },
    [addAssetFilterMethod, onSearchQueryChange, removeAssetFilterMethod],
  );

  const handleSelectedChainIdChange = useCallback(
    (chainId: string | null) => {
      setSelectedChainId(chainId);
      onSelectedChainIdChange?.(chainId);
    },
    [onSelectedChainIdChange],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ flex: 1, height: '100%' }}
    >
      <AssetFilterInput
        searchQuery={searchQuery}
        onChange={handleSearchQueryChange}
        placeholder={searchPlaceholder}
      />
      <NetworkFilter
        tokens={filteredByCustomFilter}
        nfts={effectiveNfts}
        selectedChainId={selectedChainId}
        onChainIdChange={handleSelectedChainIdChange}
        disableMetrics={disableMetrics}
      />
      <AssetList
        tokens={filteredTokens}
        nfts={filteredNfts}
        allTokens={filteredByCustomFilter}
        allNfts={effectiveNfts}
        onClearFilters={handleClearFilters}
        hideNfts={hideNfts}
        hideBalances={hideBalances}
        onAssetSelect={onAssetSelect}
        emptyStateMessage={emptyStateMessage}
        disableMetrics={disableMetrics}
      />
    </Box>
  );
};

type SendWalletAssetPickerProps = Omit<AssetProps, 'tokens' | 'nfts'> & {
  includeNoBalance?: boolean;
};

const SendWalletAssetPicker = ({
  includeNoBalance = false,
  ...props
}: SendWalletAssetPickerProps) => {
  const sendAssets = useSendAssets({ includeNoBalance });

  return (
    <AssetPickerView
      {...props}
      tokens={sendAssets.tokens}
      nfts={sendAssets.nfts}
    />
  );
};

type CatalogAssetPickerProps = Omit<
  AssetProps,
  'tokens' | 'includeNoBalance'
> & {
  tokens: AssetType[];
};

const CatalogAssetPicker = ({
  tokens,
  nfts,
  ...props
}: CatalogAssetPickerProps) => {
  return <AssetPickerView {...props} tokens={tokens} nfts={nfts ?? []} />;
};

/**
 * Asset picker used by send and catalog flows (e.g. ramps).
 * When `tokens` is provided, wallet asset hooks are skipped.
 * @param props
 */
export const Asset = (props: AssetProps = {}) => {
  if (props.tokens !== undefined) {
    return (
      <CatalogAssetPicker {...props} tokens={props.tokens} nfts={props.nfts} />
    );
  }

  return <SendWalletAssetPicker {...props} />;
};
