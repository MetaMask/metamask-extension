import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const Dropdown = ({ className, disabled, name, onChange, options, selectedOption, style }) => {
  const _onChange = useCallback(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      onChange(event.target.value)
    },
    [onChange],
  )

  return (
    <select
      className={classnames('dropdown', className)}
      disabled={disabled}
      name={name}
      onChange={_onChange}
      style={style}
      value={selectedOption}
    >
      {
        options.map((option) => {
          return (
            <option
              key={option.value}
              value={option.value}
            >
              { option.name || option.value }
            </option>
          )
        })
      }
    </select>
  )
}

Dropdown.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  name: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.exact({
      name: PropTypes.string,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedOption: PropTypes.string,
  style: PropTypes.object,
}

Dropdown.defaultProps = {
  className: undefined,
  disabled: false,
  name: undefined,
  selectedOption: null,
  style: undefined,
}

export default Dropdown
