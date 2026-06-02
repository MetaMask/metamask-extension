import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { TextFieldSearch } from '../../../component-library/text-field-search/deprecated';
import {
  BlockSize,
  BorderRadius,
  Size,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { searchTokens } from '../../../../../shared/lib/token-search/token-search-api';
import { getAssetImageUrl } from '../../../../../shared/lib/asset-utils';

const SEARCH_DEBOUNCE_MS = 300;

const toCaip2Network = (networkId) => {
  if (!networkId) {
    return null;
  }
  // Non-EVM networks are already expressed as CAIP-2 chain ids (e.g. "solana:…").
  if (networkId.includes(':')) {
    return networkId;
  }
  const decimal = parseInt(networkId, 16);
  return Number.isNaN(decimal) ? null : `eip155:${decimal}`;
};

// Re-derive the network id used by the asset list from a CAIP-2 namespace.
// EVM namespaces are converted back to a hex chain id ("eip155:1" → "0x1");
// non-EVM namespaces are returned as-is (e.g. "solana:5eyk…").
const caip2NamespaceToNetworkId = (namespace, fallbackNetworkId) => {
  if (!namespace) {
    return fallbackNetworkId;
  }
  const [chainNamespace, reference] = namespace.split(':');
  if (chainNamespace === 'eip155' && reference) {
    return `0x${parseInt(reference, 10).toString(16)}`;
  }
  return namespace;
};

export default function TokenSearch({
  onSearch,
  error,
  searchClassName,
  networkFilter,
  setSearchResults,
  chainId,
}) {
  const t = useI18nContext();
  const isTokenNetworkFilterEqualCurrentNetwork =
    Object.keys(networkFilter).length === 1;

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const abortRef = useRef(null);

  // `onSearch` is recreated on every parent render; keep it in a ref so the
  // search effect does not re-run (and re-trigger requests) on each render.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  const networks = useMemo(() => {
    if (isTokenNetworkFilterEqualCurrentNetwork) {
      const caip2 = toCaip2Network(chainId);
      return caip2 ? [caip2] : [];
    }
    return Object.keys(networkFilter).map(toCaip2Network).filter(Boolean);
  }, [isTokenNetworkFilterEqualCurrentNetwork, chainId, networkFilter]);

  const clear = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, [setSearchResults]);

  useEffect(() => {
    clear();
  }, [isTokenNetworkFilterEqualCurrentNetwork, clear]);

  // Run the API search whenever the debounced query (or network scope) changes.
  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();

    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (!trimmedQuery) {
      setSearchResults([]);
      onSearchRef.current({ newSearchQuery: debouncedSearchQuery, results: [] });
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    searchTokens({
      query: trimmedQuery,
      networks: networks.length > 0 ? networks : undefined,
      first: 12,
      signal: controller.signal,
    })
      .then((response) => {
        if (controller.signal.aborted) {
          return;
        }

        // Map the API result to the shape TokenList expects:
        // { address, symbol, name, decimals, iconUrl, chainId }
        const results = response.data.map((token) => {
          // assetId looks like "eip155:1/erc20:0xABC…" or "solana:…/token:…".
          const [namespace, assetRef] = token.assetId.split('/');
          // The token reference (contract address for EVM) is everything after
          // the asset-type prefix ("erc20:", "token:", …).
          const address = assetRef?.includes(':')
            ? assetRef.slice(assetRef.indexOf(':') + 1)
            : assetRef;

          const tokenChainId = caip2NamespaceToNetworkId(namespace, chainId);

          // The search endpoint frequently omits `iconUrl`; fall back to the
          // static asset-icon URL derived from the CAIP asset id.
          const iconUrl =
            token.iconUrl ||
            getAssetImageUrl(token.assetId, tokenChainId) ||
            undefined;

          return {
            address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            iconUrl,
            chainId: tokenChainId,
          };
        });

        setSearchResults(results);
        onSearchRef.current({ newSearchQuery: debouncedSearchQuery, results });
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }
        setSearchResults([]);
        onSearchRef.current({ newSearchQuery: debouncedSearchQuery, results: [] });
      });

    return () => controller.abort();
  }, [debouncedSearchQuery, networks, chainId, setSearchResults]);

  return (
    <TextFieldSearch
      className={searchClassName}
      placeholder={t('searchTokens')}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      error={error}
      autoFocus
      autoComplete={false}
      width={BlockSize.Full}
      size={Size.LG}
      paddingRight={2}
      borderRadius={BorderRadius.LG}
      clearButtonOnClick={clear}
      clearButtonProps={{
        size: Size.SM,
      }}
    />
  );
}

TokenSearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
  error: PropTypes.object,
  searchClassName: PropTypes.string.isRequired,
  networkFilter: PropTypes.object.isRequired,
  setSearchResults: PropTypes.func.isRequired,
  chainId: PropTypes.string.isRequired,
};
