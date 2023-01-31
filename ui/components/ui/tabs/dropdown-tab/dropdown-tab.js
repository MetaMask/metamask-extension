import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Dropdown from '../../dropdown';

export const DropdownTab = (props) => {
  const {
    activeClassName,
    className,
    'data-testid': dataTestId,
    isActive,
    onClick,
    onChange,
    tabIndex,
    options,
    selectedOption,
  } = props;

  return (
    <li
      className={classnames('tab', className, {
        'tab--active': isActive,
        [activeClassName]: activeClassName && isActive,
      })}
      data-testid={dataTestId}
      onClick={(event) => {
        event.preventDefault();
        onClick(tabIndex);
      }}
    >
      <Dropdown
        options={options}
        selectedOption={selectedOption}
        onChange={onChange}
      />
    </li>
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
