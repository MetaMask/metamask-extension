import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '../../../../components/ui/text-field';
import { I18nContext } from '../../../../contexts/i18n';
import SearchIcon from '../../../../components/ui/icon/search-icon';
import { Icon, IconName } from '../../../../components/component-library';

export default function CustomContentSearch({
  onSearch,
  error,
  networksList,
  searchQueryInput,
}) {
  const t = useContext(I18nContext);
  const [searchIconColor, setSearchIconColor] = useState(
    'var(--color-icon-muted)',
  );

  const networksListArray = Object.values(networksList);
  const networksSearchFuse = new Fuse(networksListArray, {
    shouldSort: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['label', 'labelKey'],
  });

  const handleSearch = async (searchQuery) => {
    if (searchQuery === '') {
      setSearchIconColor('var(--color-icon-muted)');
    } else {
      setSearchIconColor('var(--color-icon-alternative)');
    }

    const fuseSearchResult = networksSearchFuse.search(searchQuery);
    const results = searchQuery ? [...fuseSearchResult] : networksListArray;
    await onSearch({ searchQuery, results });
  };

  const renderStartAdornment = () => {
    return (
      <InputAdornment position="start">
        <SearchIcon color={searchIconColor} />
      </InputAdornment>
    );
  };

  const renderEndAdornment = () => {
    return (
      <>
        {searchQueryInput && (
          <InputAdornment
            className="imageclosectn"
            position="end"
            onClick={() => handleSearch('')}
          >
            <Icon name={IconName.Close} className="networks-tab__imageclose" />
          </InputAdornment>
        )}
      </>
    );
  };

  return (
    <TextField
      id="search-networks"
      data-testid="search-networks"
      placeholder={t('customContentSearch')}
      type="text"
      value={searchQueryInput}
      onChange={(e) => handleSearch(e.target.value)}
      error={error}
      fullWidth
      autoFocus
      autoComplete="off"
      classes={{
        inputRoot: 'networks-tab__networks-list__custom-search-network',
      }}
      startAdornment={renderStartAdornment()}
      endAdornment={renderEndAdornment()}
    />
  );
}

CustomContentSearch.propTypes = {
  /**
   * The function searches the list of networks depending on
   * the entered parameter and returns the entire list of
   * networks when the user clicks on 'X' on the search tab
   */
  onSearch: PropTypes.func,
  /**
   * An error message is displayed when a user searches for a specific
   * network on the search tab and that network does not exist
   * in the networks list
   */
  error: PropTypes.string,
  /**
   * The list of networks available for search.
   */
  networksList: PropTypes.array,
  /**
   * Search for a specific network(s) by label or labelKey
   */
  searchQueryInput: PropTypes.string,
};
