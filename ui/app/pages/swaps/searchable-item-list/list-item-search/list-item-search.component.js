import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '../../../../components/ui/text-field';
import { usePrevious } from '../../../../hooks/usePrevious';

const renderAdornment = () => (
  <InputAdornment position="start" style={{ marginRight: '12px' }}>
    <img src="images/search.svg" width="17" height="17" alt="" />
  </InputAdornment>
);

export default function ListItemSearch({
  onSearch,
  error,
  listToSearch = [],
  fuseSearchKeys,
  searchPlaceholderText,
  defaultToAll,
}) {
  const fuseRef = useRef();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (newSearchQuery) => {
    setSearchQuery(newSearchQuery);
    const fuseSearchResult = fuseRef.current.search(newSearchQuery);
    onSearch({
      searchQuery: newSearchQuery,
      results:
        defaultToAll && newSearchQuery === '' ? listToSearch : fuseSearchResult,
    });
  };

  useEffect(() => {
    if (!fuseRef.current) {
      fuseRef.current = new Fuse(listToSearch, {
        shouldSort: true,
        threshold: 0.45,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: fuseSearchKeys,
      });
    }
  }, [fuseSearchKeys, listToSearch]);

  const previousListToSearch = usePrevious(listToSearch ?? []);
  useEffect(() => {
    if (
      fuseRef.current &&
      searchQuery &&
      previousListToSearch !== listToSearch
    ) {
      fuseRef.current.setCollection(listToSearch);
      const fuseSearchResult = fuseRef.current.search(searchQuery);
      onSearch({ searchQuery, results: fuseSearchResult });
    }
  }, [listToSearch, searchQuery, onSearch, previousListToSearch]);

  return (
    <TextField
      data-testid="search-list-items"
      className="searchable-item-list__search"
      placeholder={searchPlaceholderText}
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      error={error}
      fullWidth
      startAdornment={renderAdornment()}
      autoComplete="off"
      autoFocus
    />
  );
}

ListItemSearch.propTypes = {
  onSearch: PropTypes.func,
  error: PropTypes.string,
  listToSearch: PropTypes.array.isRequired,
  fuseSearchKeys: PropTypes.arrayOf(PropTypes.object).isRequired,
  searchPlaceholderText: PropTypes.string,
  defaultToAll: PropTypes.bool,
};
