import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import { I18nContext } from '../../../contexts/i18n';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import {
  Icon,
  IconName,
  IconSize,
  TextField,
} from '../../../components/component-library';
import { BlockSize, IconColor } from '../../../helpers/constants/design-system';

export default function SettingsSearch({
  onSearch,
  error,
  settingsRoutesList,
}) {
  const t = useContext(I18nContext);

  const [searchQuery, setSearchQuery] = useState('');

  const [searchIconColor, setSearchIconColor] = useState(IconColor.iconMuted);

  const settingsRoutesListArray = Object.values(settingsRoutesList);
  const settingsSearchFuse = new Fuse(settingsRoutesListArray, {
    shouldSort: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['tabMessage', 'sectionMessage', 'descriptionMessage'],
    getFn: (routeObject, path) => routeObject[path](t),
  });

  const handleSearch = (_searchQuery) => {
    const sanitizedSearchQuery = _searchQuery.trimStart();
    setSearchQuery(sanitizedSearchQuery);
    if (sanitizedSearchQuery === '') {
      setSearchIconColor(IconColor.iconMuted);
    } else {
      setSearchIconColor(IconColor.iconDefault);
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

  const renderStartAccessory = () => {
    return (
      <InputAdornment position="start" style={{ marginRight: '12px' }}>
        <Icon
          size={IconSize.Sm}
          name={IconName.Search}
          color={searchIconColor}
        />
      </InputAdornment>
    );
  };

  const renderEndAccessory = () => {
    return (
      <>
        {searchQuery && (
          <InputAdornment
            className="imageclosectn"
            position="end"
            onClick={() => handleSearch('')}
            style={{ cursor: 'pointer' }}
          >
            <Icon
              name={IconName.Close}
              color={IconColor.iconDefault}
              size={IconSize.Xs}
            />
          </InputAdornment>
        )}
      </>
    );
  };

  return (
    <TextField
      id="search-settings"
      placeholder={t('search')}
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      error={error}
      width={BlockSize.Full}
      autoFocus
      autoComplete="off"
      startAccessory={renderStartAccessory()}
      endAccessory={renderEndAccessory()}
      theme="bordered"
    />
  );
}

SettingsSearch.propTypes = {
  onSearch: PropTypes.func,
  error: PropTypes.string,
  settingsRoutesList: PropTypes.array,
};
