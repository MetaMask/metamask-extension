import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import Fuse from 'fuse.js'
import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '../../text-field'

const generateFuseKeys = (keys) => {
  const weight = 1 / keys.length
  return keys.map((key) => ({ name: key, weight }))
}

function usePrevious (value) {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

let fuse

export default function ListItemSearch ({
  onSearch = null,
  error = '',
  listToSearch = [],
  searchByKeys = [],
  fuseSearchKeys = null,
  searchPlaceholderText = '',
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (newSearchQuery) => {
    setSearchQuery(newSearchQuery)
    const fuseSearchResult = fuse.search(newSearchQuery)
    onSearch({ searchQuery: newSearchQuery, results: fuseSearchResult })
  }

  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      fuse = new Fuse(listToSearch, {
        shouldSort: true,
        threshold: 0.1,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: fuseSearchKeys || generateFuseKeys(searchByKeys),
      })
    }
  }, [ searchByKeys, fuseSearchKeys, listToSearch ])

  const previous = usePrevious({ listToSearch }) || []
  useEffect(() => {
    if (didMountRef.current && searchQuery && previous.listToSearch !== listToSearch) {
      fuse.setCollection(listToSearch)
      const fuseSearchResult = fuse.search(searchQuery)
      onSearch({ searchQuery, results: fuseSearchResult })
    }
  }, [ listToSearch, searchQuery, onSearch, previous.listToSearch ])


  const renderAdornment = () => (
    <InputAdornment
      position="start"
      style={{ marginRight: '12px' }}
    >
      <img src="images/search.svg" />
    </InputAdornment>
  )

  return (
    <TextField
      id="search-list-items"
      placeholder={searchPlaceholderText}
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      error={error}
      fullWidth
      startAdornment={renderAdornment()}
    />
  )
}

ListItemSearch.propTypes = {
  onSearch: PropTypes.func,
  error: PropTypes.string,
  listToSearch: PropTypes.array.required,
  searchByKeys: PropTypes.arrayOf(PropTypes.string),
  fuseSearchKeys: PropTypes.arrayOf(PropTypes.object),
  searchPlaceholderText: PropTypes.string,
}
