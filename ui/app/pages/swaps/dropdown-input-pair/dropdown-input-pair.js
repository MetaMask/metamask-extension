import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import DropdownSearchList from '../dropdown-search-list';
import TextField from '../../../components/ui/text-field';

const characterWidthMap = {
  '1': 5.86,
  '2': 10.05,
  '3': 10.45,
  '4': 11.1,
  '5': 10,
  '6': 10.06,
  '7': 9.17,
  '8': 10.28,
  '9': 10.06,
  '0': 11.22,
  '.': 4.55,
};

const getInputWidth = (value) => {
  const valueString = String(value);
  const charArray = valueString.split('');
  return charArray.reduce(
    (inputWidth, _char) => inputWidth + characterWidthMap[_char],
    12,
  );
};
export default function DropdownInputPair({
  itemsToSearch = [],
  onInputChange,
  inputValue = '',
  onSelect,
  leftValue,
  selectedItem,
  SearchListPlaceholder,
  maxListItems,
  selectPlaceHolderText,
  loading,
  hideItemIf,
  listContainerClassName,
  autoFocus,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const inputRef = useRef();
  const onTextFieldChange = (event) => {
    event.stopPropagation();
    // Automatically prefix value with 0. if user begins typing .
    const valueToUse = event.target.value === '.' ? '0.' : event.target.value;

    // Regex that validates strings with only numbers, 'x.', '.x', and 'x.x'
    const regexp = /^(\.\d+|\d+(\.\d+)?|\d+\.)$/u;
    // If the value is either empty or contains only numbers and '.' and only has one '.', update input to match
    if (valueToUse === '' || regexp.test(valueToUse)) {
      onInputChange(valueToUse);
    } else {
      // otherwise, use the previously set inputValue (effectively denying the user from inputting the last char)
      // or an empty string if we do not yet have an inputValue
      onInputChange(inputValue || '');
    }
  };
  const [applyTwoLineStyle, setApplyTwoLineStyle] = useState(null);
  useEffect(() => {
    setApplyTwoLineStyle(
      (inputRef?.current?.getBoundingClientRect()?.width || 0) +
        getInputWidth(inputValue || '') >
        137,
    );
  }, [inputValue, inputRef]);

  return (
    <div className="dropdown-input-pair">
      <DropdownSearchList
        itemsToSearch={itemsToSearch}
        SearchListPlaceholder={SearchListPlaceholder}
        fuseSearchKeys={[
          { name: 'name', weight: 0.499 },
          { name: 'symbol', weight: 0.499 },
          { name: 'address', weight: 0.002 },
        ]}
        maxListItems={maxListItems}
        onOpen={open}
        onClose={close}
        onSelect={onSelect}
        className={isOpen ? 'dropdown-input-pair__list--full-width' : ''}
        externallySelectedItem={selectedItem}
        selectPlaceHolderText={selectPlaceHolderText}
        selectorClosedClassName="dropdown-input-pair__selector--closed"
        listContainerClassName={listContainerClassName}
        loading={loading}
        hideItemIf={hideItemIf}
        defaultToAll
      />
      {!isOpen && (
        <TextField
          className={classnames('dropdown-input-pair__input', {
            'dropdown-input-pair__two-line-input': applyTwoLineStyle,
          })}
          type="text"
          placeholder="0"
          onChange={onTextFieldChange}
          fullWidth
          margin="dense"
          value={inputValue}
          autoFocus={autoFocus}
        />
      )}
      {!isOpen && leftValue && (
        <div
          className={classnames('dropdown-input-pair__left-value', {
            'dropdown-input-pair__left-value--two-lines': applyTwoLineStyle,
          })}
          ref={inputRef}
        >
          ≈ {leftValue}
        </div>
      )}
    </div>
  );
}

DropdownInputPair.propTypes = {
  itemsToSearch: PropTypes.array,
  onInputChange: PropTypes.func,
  inputValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onSelect: PropTypes.func,
  leftValue: PropTypes.string,
  selectedItem: PropTypes.object,
  SearchListPlaceholder: PropTypes.func,
  maxListItems: PropTypes.number,
  selectPlaceHolderText: PropTypes.string,
  loading: PropTypes.bool,
  hideItemIf: PropTypes.func,
  listContainerClassName: PropTypes.string,
  autoFocus: PropTypes.bool,
};
