import React, { useState } from 'react'
import PropTypes from 'prop-types'
import ItemList from './item-list'
import ListItemSearch from './list-item-search'

export default function SearchableItemList ({
  itemSelectorError = '',
  onToggleItem = null,
  Placeholder = null,
  className = '',
  itemsToSearch = [],
  searchPlaceholderText,
  fuseSearchKeys = [],
  listTitle = '',
}) {
  const [results, setResults] = useState([])

  return (
    <div className={className}>
      <ListItemSearch
        listToSearch={itemsToSearch}
        fuseSearchKeys={fuseSearchKeys}
        onSearch={({ results = [] }) => setResults(results)}
        error={itemSelectorError}
        searchPlaceholderText={searchPlaceholderText}
      />
      <ItemList
        results={results}
        onToggleItem={onToggleItem}
        Placeholder={Placeholder}
        listTitle={listTitle}
      />
    </div>
  )
}

SearchableItemList.propTypes = {
  itemSelectorError: PropTypes.string,
  itemsToSearch: PropTypes.array,
  onToggleItem: PropTypes.func,
  Placeholder: PropTypes.element,
  className: PropTypes.string,
  searchPlaceholderText: PropTypes.string,
  fuseSearchKeys: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    weight: PropTypes.number,
  })),
  listTitle: PropTypes.string,
}
