import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { TextFieldSearch } from '../../../component-library/text-field-search/deprecated';
import {
  BlockSize,
  BorderRadius,
  Size,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
// eslint-disable-next-line import/namespace
import { useSearchRequest } from '../../../../hooks/useSearchRequest';

const getTokens = (tokenList = {}) => Object.values(tokenList);

const createTokenSearchFuse = (tokenList) => {
  return new Fuse(getTokens(tokenList), {
    shouldSort: true,
    threshold: 0.45,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'symbol', weight: 0.5 },
    ],
  });
};
export default function TokenSearch({
  onSearch,
  error,
  tokenList,
  searchClassName,
  networkFilter,
  setSearchResults,
  chainId,
}) {
  const t = useI18nContext();
  const isTokenNetworkFilterEqualCurrentNetwork =
    Object.keys(networkFilter).length === 1;

  const filteredTokenList = useMemo(() => {
    if (isTokenNetworkFilterEqualCurrentNetwork) {
      const dataObject = tokenList?.[chainId]?.data || {};
      return Object.fromEntries(
        Object.entries(dataObject).map(([key, value]) => [
          key,
          { ...value, chainId },
        ]),
      );
    }
    return Object.entries(tokenList).flatMap(([networkId, { data }]) =>
      Object.values(data).map((item) => ({ ...item, chainId: networkId })),
    );
  }, [tokenList, isTokenNetworkFilterEqualCurrentNetwork, chainId]);

  const [searchQuery, setSearchQuery] = useState('');

  const [tokenSearchFuse, setTokenSearchFuse] = useState(
    createTokenSearchFuse(filteredTokenList),
  );

  useEffect(() => {
    setTokenSearchFuse(createTokenSearchFuse(filteredTokenList));
  }, [filteredTokenList]);

  // Always call the API search hook for performance comparison
  // eslint-disable-next-line no-unused-vars
  const apiSearchResult = useSearchRequest({
    chainIds: ['eip155:1'],
    query: searchQuery,
    limit: 50,
  });

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);

      // Always perform local search (original behavior)
      const startTime = performance.now();

      const fuseSearchResult = tokenSearchFuse.search(query);
      const addressSearchResult = getTokens(filteredTokenList).filter(
        (token) =>
          token.address &&
          query &&
          isEqualCaseInsensitive(token.address, query),
      );
      const results = [...addressSearchResult, ...fuseSearchResult];

      const duration = performance.now() - startTime;
      console.log(
        `Local search ==== "${query}": ${duration.toFixed(2)}ms, ${results.length} results`,
      );

      onSearch({ query, results });
    },
    [tokenSearchFuse, filteredTokenList, onSearch],
  );

  const clear = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, [setSearchResults]);

  useEffect(() => {
    clear();
  }, [isTokenNetworkFilterEqualCurrentNetwork, clear]);

  return (
    <TextFieldSearch
      className={searchClassName}
      placeholder={t('searchTokens')}
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
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
  tokenList: PropTypes.object.isRequired,
  searchClassName: PropTypes.string.isRequired,
  networkFilter: PropTypes.object.isRequired,
  setSearchResults: PropTypes.func.isRequired,
  chainId: PropTypes.string.isRequired,
};
