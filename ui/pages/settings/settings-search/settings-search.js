import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '../../../components/ui/text-field';
import { I18nContext } from '../../../contexts/i18n';
import SearchIcon from '../../../components/ui/search-icon';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';

export default function SettingsSearch({
  onSearch,
  error,
  settingsRoutesList,
}) {
  const t = useContext(I18nContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchIconColor, setSearchIconColor] = useState('#9b9b9b');

  const settingsRoutesListArray = Object.values(settingsRoutesList);
  const settingsSearchFuse = new Fuse(settingsRoutesListArray, {
    shouldSort: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['tab', 'section', 'description'],
  });

  // eslint-disable-next-line no-shadow
  const handleSearch = (searchQuery) => {
    setSearchQuery(searchQuery);
    if (searchQuery === '') {
      setSearchIconColor('#9b9b9b');
    } else {
      setSearchIconColor('#24292E');
    }
    const fuseSearchResult = settingsSearchFuse.search(searchQuery);
    const addressSearchResult = settingsRoutesListArray.filter((routes) => {
      return (
        routes.tab &&
        searchQuery &&
        isEqualCaseInsensitive(routes.tab, searchQuery)
      );
    });

    const results = [...addressSearchResult, ...fuseSearchResult];
    onSearch({ searchQuery, results });
  };

  const renderStartAdornment = () => {
    return (
      <InputAdornment position="start" style={{ marginRight: '12px' }}>
        <SearchIcon color={searchIconColor} />
      </InputAdornment>
    );
  };

  const renderEndAdornment = () => {
    return (
      <>
        {searchQuery && (
          <InputAdornment
            className="imageclosectn"
            position="end"
            onClick={() => handleSearch('')}
            style={{ cursor: 'pointer' }}
          >
            <img
              className="imageclose"
              src="images/close-gray.svg"
              width="17"
              height="17"
              alt=""
            />
          </InputAdornment>
        )}
      </>
    );
  };

  return (
    <TextField
      id="search-settings"
      placeholder={t('searchSettings')}
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      error={error}
      fullWidth
      autoFocus
      autoComplete="off"
      style={{ backgroundColor: '#fff' }}
      startAdornment={renderStartAdornment()}
      endAdornment={renderEndAdornment()}
    />
  );
}

SettingsSearch.propTypes = {
  onSearch: PropTypes.func,
  error: PropTypes.string,
  settingsRoutesList: PropTypes.array,
};
