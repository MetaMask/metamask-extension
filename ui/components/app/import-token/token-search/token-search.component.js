import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import { TextFieldSearch } from '../../../component-library/text-field-search/deprecated';
import { BlockSize, Size } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const getTokens = (tokenList) => Object.values(tokenList);

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
}) {
  const t = useI18nContext();

  const [searchQuery, setSearchQuery] = useState('');

  const [tokenSearchFuse, setTokenSearchFuse] = useState(
    createTokenSearchFuse(tokenList),
  );

  useEffect(() => {
    setTokenSearchFuse(createTokenSearchFuse(tokenList));
  }, [tokenList]);

  const handleSearch = (newSearchQuery) => {
    setSearchQuery(newSearchQuery);
    const fuseSearchResult = tokenSearchFuse.search(newSearchQuery);
    const addressSearchResult = getTokens(tokenList).filter((token) => {
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
  };

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
};
