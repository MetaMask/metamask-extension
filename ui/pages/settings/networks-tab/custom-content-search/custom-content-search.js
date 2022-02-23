import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '../../../../components/ui/text-field';
import { I18nContext } from '../../../../contexts/i18n';
import SearchIcon from '../../../../components/ui/search-icon';

export default function CustomContentSearch({ onSearch, error, networksList }) {
  const t = useContext(I18nContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchIconColor, setSearchIconColor] = useState('#9b9b9b');

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

  // eslint-disable-next-line no-shadow
  const handleSearch = async (searchQuery) => {
    setSearchQuery(searchQuery);
    if (searchQuery === '') {
      setSearchIconColor('#9b9b9b');
    } else {
      setSearchIconColor('#24292E');
    }

    // Ovde hoce da izlista samo one networke koje se pretrazuju, ali ne radi kako treba
    const fuseSearchResult = networksSearchFuse.search(searchQuery);
    const results = searchQuery ? [...fuseSearchResult] : networksListArray;
    await onSearch({ searchQuery, results });
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
      id="search-networks"
      placeholder={t('customContentSearch')}
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      error={error}
      fullWidth
      autoFocus
      autoComplete="off"
      style={{
        backgroundColor: '#fff',
        paddingInlineEnd: '16px',
        marginTop: '24px',
      }}
      startAdornment={renderStartAdornment()}
      endAdornment={renderEndAdornment()}
    />
  );
}

CustomContentSearch.propTypes = {
  onSearch: PropTypes.func,
  error: PropTypes.string,
  networksList: PropTypes.array,
};
