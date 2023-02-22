import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { filter } from 'lodash';
import Box from '../../../components/ui/box';
import {
  DISPLAY,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import { TextFieldSearch } from '../../../components/component-library';
import ItemList from '../searchable-item-list/item-list';
import { isValidHexAddress } from '../../../../shared/modules/hexstring-utils';

let timeoutIdForSearch;

export default function ListWithSearch({
  selectedItem,
  itemsToSearch = [],
  listTitle,
  maxListItems,
  onClickItem,
  onOpenImportTokenModalClick,
  Placeholder,
  hideRightLabels,
  hideItemIf,
  listContainerClassName,
}) {
  const itemListRef = useRef();

  const [search, setSearch] = useState(selectedItem?.symbol);
  const [items, setItems] = useState(itemsToSearch);

  const handleSearch = async (newSearchQuery) => {
    setSearch(newSearchQuery);
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
        return setItems(itemsToSearch);
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
      setItems(results);
    }, 350);
  };

  useEffect(() => {
    handleSearch(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSearch]);

  const handleOnClear = () => {
    setSearch('');
  };

  return (
    <>
      <Box
        style={{ gridColumnStart: 1, gridColumnEnd: 3 }}
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <TextFieldSearch
          id="icon-search"
          marginBottom={4}
          onChange={(e) => handleSearch(e.target.value)}
          clearButtonOnClick={handleOnClear}
          value={search}
          placeholder="Enter token name or paste address"
        />
      </Box>
      <ItemList
        searchQuery={search}
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
    </>
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
  hideItemIf: PropTypes.func,
  listContainerClassName: PropTypes.string,
  selectedItem: PropTypes.object,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func,
};
