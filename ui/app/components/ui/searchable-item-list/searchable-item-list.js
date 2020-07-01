import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ItemList from './item-list'
import ListItemSearch from './list-item-search'

export default function SearchableItemList ({
  itemSelectorError = '',
  onClickItem = null,
  Placeholder = null,
  className = '',
  itemsToSearch = [],
  searchPlaceholderText,
  fuseSearchKeys = [],
  listTitle = '',
  defaultToAll = false,
  maxListItems = undefined,
}) {
  const [results, setResults] = useState(defaultToAll ? itemsToSearch : [])
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className={className}>
      <ListItemSearch
        listToSearch={itemsToSearch}
        fuseSearchKeys={fuseSearchKeys}
        onSearch={({ searchQuery: newSearchQuery = '', results: newResults = [] }) => {
          setSearchQuery(newSearchQuery)
          setResults(newResults)
        }}
        error={itemSelectorError}
        searchPlaceholderText={searchPlaceholderText}
        defaultToAll={defaultToAll}
      />
      <ItemList
        searchQuery={searchQuery}
        results={results}
        onClickItem={onClickItem}
        Placeholder={Placeholder}
        listTitle={listTitle}
        maxListItems={maxListItems}
      />
    </div>
  )
}

SearchableItemList.propTypes = {
  itemSelectorError: PropTypes.string,
  itemsToSearch: PropTypes.array,
  onClickItem: PropTypes.func,
  Placeholder: PropTypes.element,
  className: PropTypes.string,
  searchPlaceholderText: PropTypes.string,
  fuseSearchKeys: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    weight: PropTypes.number,
  })),
  listTitle: PropTypes.string,
  defaultToAll: PropTypes.bool,
  maxListItems: PropTypes.number,
}
