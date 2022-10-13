import React, { useState, useContext } from 'react';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { useSelector } from 'react-redux';
///: END:ONLY_INCLUDE_IN
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '../../../components/ui/text-field';
import { I18nContext } from '../../../contexts/i18n';
import SearchIcon from '../../../components/ui/icon/search-icon';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import { getSnapsRouteObjects } from '../../../selectors';
///: END:ONLY_INCLUDE_IN

export default function SettingsSearch({
  onSearch,
  error,
  settingsRoutesList,
}) {
  const t = useContext(I18nContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchIconColor, setSearchIconColor] = useState(
    'var(--color-icon-muted)',
  );

  const settingsRoutesListArray = Object.values(settingsRoutesList);
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  const snaps = useSelector(getSnapsRouteObjects);
  settingsRoutesListArray.push(...snaps);
  ///: END:ONLY_INCLUDE_IN
  const settingsSearchFuse = new Fuse(settingsRoutesListArray, {
    shouldSort: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['tabMessage', 'sectionMessage', 'descriptionMessage'],
    getFn: (routeObject, path) => routeObject[path](t),
  });

  const handleSearch = (_searchQuery) => {
    const sanitizedSearchQuery = _searchQuery.replace(
      /[^A-z0-9\s&]|[\\]/gu,
      '',
    );
    setSearchQuery(sanitizedSearchQuery);
    if (sanitizedSearchQuery === '') {
      setSearchIconColor('var(--color-icon-muted)');
    } else {
      setSearchIconColor('var(--color-icon-default)');
    }

    const fuseSearchResult = settingsSearchFuse.search(sanitizedSearchQuery);
    const addressSearchResult = settingsRoutesListArray.filter((routes) => {
      return (
        routes.tabMessage &&
        sanitizedSearchQuery &&
        isEqualCaseInsensitive(routes.tab, sanitizedSearchQuery)
      );
    });

    const results = [...addressSearchResult, ...fuseSearchResult];
    onSearch({ searchQuery: sanitizedSearchQuery, results });
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
            <i
              className="fa fa-times"
              style={{ color: 'var(--color-icon-default)' }}
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
