import React, { useState } from 'react'
import PropTypes from 'prop-types'
import DropdownSearchList from '../dropdown-search-list'
import TextField from '../../../components/ui/text-field'

export default function DropdownInputPair ({
  itemsToSearch = [],
  onInputChange = null,
  inputValue = null,
  onSelect = null,
  leftValue = '',
  selectedItem = null,
  SearchListPlaceholder,
  maxListItems,
  selectPlaceHolderText,
  loading,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const onTextFieldChange = (event) => {
    event.stopPropagation()
    onInputChange(event.target.value)
  }

  return (
    <div className="dropdown-input-pair">
      <DropdownSearchList
        itemsToSearch={itemsToSearch}
        SearchListPlaceholder={SearchListPlaceholder}
        searchListClassName="token__search-token"
        fuseSearchKeys={[{ name: 'name', weight: 0.499 }, { name: 'symbol', weight: 0.499 }, { name: 'address', weight: 0.002 }]}
        maxListItems={maxListItems}
        onOpen={open}
        onClose={close}
        onSelect={onSelect}
        className={isOpen && 'dropdown-input-pair__list--full-width'}
        externallySelectedItem={selectedItem}
        selectPlaceHolderText={selectPlaceHolderText}
        selectorClosedClassName="dropdown-input-pair__selector--closed"
        loading={loading}
        defaultToAll
      />
      {!isOpen && (
        <TextField
          className="dropdown-input-pair__input"
          type="number"
          placeholder={ 0 }
          onChange={onTextFieldChange}
          fullWidth
          margin="dense"
          value={ inputValue }
          error=""
        />
      )}
      {
        !isOpen && leftValue && <div className="dropdown-input-pair__left-value">≈ {leftValue}</div>
      }
    </div>
  )
}

DropdownInputPair.propTypes = {
  itemsToSearch: PropTypes.array,
  onInputChange: PropTypes.func,
  inputValue: PropTypes.number,
  onSelect: PropTypes.func,
  leftValue: PropTypes.string,
  selectedItem: PropTypes.object,
  SearchListPlaceholder: PropTypes.func,
  maxListItems: PropTypes.number,
  selectPlaceHolderText: PropTypes.string,
  loading: PropTypes.bool,
}
