import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Dropdown = ({
  className,
  disabled,
  onChange,
  options,
  selectedOption,
  style,
  title,
}) => {
  const _onChange = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <select
      className={classnames('dropdown', className)}
      disabled={disabled}
      title={title}
      onChange={_onChange}
      style={style}
      value={selectedOption}
    >
      {options.map((option) => {
        return (
          <option key={option.value} value={option.value}>
            {option.name || option.value}
          </option>
        );
      })}
    </select>
  );
};

Dropdown.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  title: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.exact({
      name: PropTypes.string,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  selectedOption: PropTypes.string,
  style: PropTypes.object,
};

Dropdown.defaultProps = {
  className: undefined,
  disabled: false,
  title: undefined,
  selectedOption: null,
  style: undefined,
};

export default Dropdown;
