import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
import { getCurrentNetwork } from '../../../../selectors';

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
}) {
  const t = useI18nContext();
  const isTokenNetworkFilterEqualCurrentNetwork =
    Object.keys(networkFilter).length === 1;

  const { chainId } = useSelector(getCurrentNetwork);

  const filteredTokenList = useMemo(() => {
    if (isTokenNetworkFilterEqualCurrentNetwork) {
      return tokenList?.[chainId]?.data;
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

  const handleSearch = (newSearchQuery) => {
    setSearchQuery(newSearchQuery);
    const fuseSearchResult = tokenSearchFuse.search(newSearchQuery);
    const addressSearchResult = getTokens(filteredTokenList).filter((token) => {
      return (
        token.address &&
        newSearchQuery &&
        isEqualCaseInsensitive(token.address, newSearchQuery)
      );
    });
    const results = [...addressSearchResult, ...fuseSearchResult];
    onSearch({ newSearchQuery, results });
  };

  const clear = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    clear();
  }, [isTokenNetworkFilterEqualCurrentNetwork]);

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
};
