import React, { useState, useRef, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import ItemList from './item-list';
import ListItemSearch from './list-item-search';

export default function SearchableItemList({
  className,
  defaultToAll,
  fuseSearchKeys,
  itemSelectorError,
  itemsToSearch = [],
  listTitle,
  maxListItems,
  onClickItem,
  onOpenImportTokenModalClick,
  Placeholder,
  searchPlaceholderText,
  hideRightLabels,
  hideItemIf,
  listContainerClassName,
  shouldSearchForImports,
  searchQuery,
  setSearchQuery,
}) {
  const itemListRef = useRef();

  const initialResultsState = useMemo(() => {
    return defaultToAll ? itemsToSearch : [];
  }, [defaultToAll, itemsToSearch]);
  const [results, setResults] = useState(initialResultsState);
  useEffect(() => {
    if (!searchQuery) {
      // Only if there is no searchQuery we want to show all tokens.
      setResults(initialResultsState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResultsState.length, searchQuery]);

  return (
    <div className={className}>
      <ListItemSearch
        listToSearch={itemsToSearch}
        fuseSearchKeys={fuseSearchKeys}
        onSearch={({
          searchQuery: newSearchQuery = '',
          results: newResults = [],
        }) => {
          setSearchQuery(newSearchQuery);
          setResults(newResults);
        }}
        error={itemSelectorError}
        searchPlaceholderText={searchPlaceholderText}
        defaultToAll={defaultToAll}
        shouldSearchForImports={shouldSearchForImports}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <ItemList
        searchQuery={searchQuery}
        results={results}
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
    </div>
  );
}

SearchableItemList.propTypes = {
  itemSelectorError: PropTypes.string,
  itemsToSearch: PropTypes.array,
  onClickItem: PropTypes.func,
  onOpenImportTokenModalClick: PropTypes.func,
  Placeholder: PropTypes.func,
  className: PropTypes.string,
  searchPlaceholderText: PropTypes.string,
  fuseSearchKeys: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      weight: PropTypes.number,
    }),
  ),
  listTitle: PropTypes.string,
  defaultToAll: PropTypes.bool,
  maxListItems: PropTypes.number,
  hideRightLabels: PropTypes.bool,
  hideItemIf: PropTypes.func,
  listContainerClassName: PropTypes.string,
  shouldSearchForImports: PropTypes.bool,
  searchQuery: PropTypes.func,
  setSearchQuery: PropTypes.func,
};
