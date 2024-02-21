import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  BlockSize,
  FlexDirection,
  FlexWrap,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';
import Dropdown from '../../../dropdown';

export const DropdownTab = ({
  activeClassName,
  className,
  'data-testid': dataTestId,
  isActive,
  onClick,
  onChange,
  tabIndex,
  options,
  selectedOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);

  const selectOption = useCallback(
    (option) => {
      onChange(option);
    },
    [onChange],
  );

  const onTabClick = (event) => {
    event.preventDefault();
    onClick(tabIndex);
  };

  const selectedOptionName = options.find(
    (option) => option.value === selectedOption,
  )?.name;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef, isOpen]);

  return (
    <Box
      as="li"
      className={classnames(
        'tab',
        className,
        'transaction-insight-dropdown-wrapper',
        {
          'tab--active': isActive,
          [activeClassName]: activeClassName && isActive,
        },
      )}
      data-testid={dataTestId}
      onClick={onTabClick}
      dataTestId={dataTestId}
      flexDirection={FlexDirection.Row}
      flexWrap={FlexWrap.NoWrap}
      height={BlockSize.Full}
      style={{
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
      }}
      title={selectedOptionName}
    >
      <Dropdown
        className="transaction-insight-dropdown"
        onChange={(option) => selectOption(option)}
        options={options}
        selectedOption={selectedOption}
        title="Transaction Insights"
        style={{
          pointerEvents: isActive ? 'auto' : 'none',
        }}
      />
    </Box>
  );
};

DropdownTab.propTypes = {
  activeClassName: PropTypes.string,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  isActive: PropTypes.bool, // required, but added using React.cloneElement
  options: PropTypes.arrayOf(
    PropTypes.exact({
      name: PropTypes.string,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selectedOption: PropTypes.string,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  tabIndex: PropTypes.number, // required, but added using React.cloneElement
};

DropdownTab.defaultProps = {
  activeClassName: undefined,
  className: undefined,
  onChange: undefined,
  onClick: undefined,
  selectedOption: undefined,
};
