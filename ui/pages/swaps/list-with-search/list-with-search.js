import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { filter } from 'lodash';
import log from 'loglevel';

import Box from '../../../components/ui/box';
import {
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
  TextVariant,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { TextFieldSearch, Text } from '../../../components/component-library';
import ItemList from '../searchable-item-list/item-list';
import { isValidHexAddress } from '../../../../shared/modules/hexstring-utils';
import { I18nContext } from '../../../contexts/i18n';
import { fetchToken } from '../swaps.util';
import { getCurrentChainId } from '../../../selectors/selectors';

let timeoutIdForSearch;

export default function ListWithSearch({
  itemsToSearch = [],
  listTitle,
  maxListItems,
  onClickItem,
  onOpenImportTokenModalClick,
  shouldSearchForImports,
  Placeholder,
  hideRightLabels,
  hideItemIf,
  listContainerClassName,
  searchQuery,
  setSearchQuery,
}) {
  const itemListRef = useRef();
  const t = useContext(I18nContext);

  const [items, setItems] = useState(itemsToSearch);
  const chainId = useSelector(getCurrentChainId);

  /**
   * Search a custom token for import based on a contract address.
   *
   * @param {string} contractAddress
   */
  const handleSearchTokenForImport = async (contractAddress) => {
    try {
      const token = await fetchToken(contractAddress, chainId);
      if (token) {
        token.primaryLabel = token.symbol;
        token.secondaryLabel = token.name;
        token.notImported = true;
        setItems([token]);
        return;
      }
    } catch (e) {
      log.error('Token not found, show 0 results.', e);
    }
    setItems([]); // No token for import found.
  };

  const handleSearch = async (newSearchQuery) => {
    setSearchQuery(newSearchQuery);
    if (timeoutIdForSearch) {
      clearTimeout(timeoutIdForSearch);
    }
    timeoutIdForSearch = setTimeout(async () => {
      timeoutIdForSearch = null;
      const trimmedNewSearchQuery = newSearchQuery.trim();
      const trimmedNewSearchQueryUpperCase =
        trimmedNewSearchQuery.toUpperCase();
      const trimmedNewSearchQueryLowerCase =
        trimmedNewSearchQuery.toLowerCase();
      if (!trimmedNewSearchQuery) {
        setItems(itemsToSearch);
        return;
      }
      const validHexAddress = isValidHexAddress(trimmedNewSearchQuery);
      let filteredItems = [];
      if (validHexAddress) {
        // E.g. DAI token: 0x6b175474e89094c44da98b954eedeac495271D0f
        const foundItem = itemsToSearch.find((item) => {
          return item.address === trimmedNewSearchQueryLowerCase;
        });
        if (foundItem) {
          filteredItems.push(foundItem);
        }
      } else {
        filteredItems = filter(itemsToSearch, function (item) {
          return item.symbol.includes(trimmedNewSearchQueryUpperCase);
        });
      }
      const results = newSearchQuery === '' ? itemsToSearch : filteredItems;
      if (shouldSearchForImports && results.length === 0 && validHexAddress) {
        await handleSearchTokenForImport(trimmedNewSearchQuery);
        return;
      }
      setItems(results);
    }, 350);
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery]);

  const handleOnClear = () => {
    setSearchQuery('');
  };

  return (
    <Box className="list-with-search" width={BlockSize.Full} tabIndex="0">
      <Box
        style={{ gridColumnStart: 1, gridColumnEnd: 3 }}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <TextFieldSearch
          id="list-with-search__text-search"
          marginBottom={4}
          onChange={(e) => handleSearch(e.target.value)}
          clearButtonOnClick={handleOnClear}
          value={searchQuery}
          placeholder={t('enterTokenNameOrAddress')}
          inputProps={{ marginRight: 0 }}
          className="list-with-search__text-search"
          autoFocus
          tabIndex="0"
        />
      </Box>
      {items?.length > 0 && (
        <ItemList
          searchQuery={searchQuery}
          results={items}
          onClickItem={onClickItem}
          onOpenImportTokenModalClick={onOpenImportTokenModalClick}
          Placeholder={Placeholder}
          listTitle={listTitle}
          maxListItems={maxListItems}
          containerRef={itemListRef}
          hideRightLabels={hideRightLabels}
          hideItemIf={hideItemIf}
          listContainerClassName={listContainerClassName}
        />
      )}
      {items?.length === 0 && (
        <Box
          marginTop={1}
          marginBottom={5}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('swapNoTokensAvailable', [searchQuery])}
          </Text>
        </Box>
      )}
    </Box>
  );
}

ListWithSearch.propTypes = {
  itemsToSearch: PropTypes.array,
  onClickItem: PropTypes.func,
  onOpenImportTokenModalClick: PropTypes.func,
  Placeholder: PropTypes.func,
  listTitle: PropTypes.string,
  maxListItems: PropTypes.number,
  hideRightLabels: PropTypes.bool,
  shouldSearchForImports: PropTypes.bool,
  hideItemIf: PropTypes.func,
  listContainerClassName: PropTypes.string,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func,
};
