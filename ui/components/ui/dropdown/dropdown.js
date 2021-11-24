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
  /**
   * Add CSS class to the component
   */
  className: PropTypes.string,
  /**
   * Check if component disabled
   */
  disabled: PropTypes.bool,
  /**
   * Show title of the component
   */
  title: PropTypes.string,
  /**
   * On options change handler
   */
  onChange: PropTypes.func.isRequired,
  /**
   * Predefined options for component
   */
  options: PropTypes.arrayOf(
    PropTypes.exact({
      name: PropTypes.string,
      value: PropTypes.string.isRequired,
    }),
  ).isRequired,
  /**
   * Selected options of dropdown
   */
  selectedOption: PropTypes.string,
  /**
   * Add inline style for the component
   */
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
