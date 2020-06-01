import React, { useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const CHECKBOX_STATE = {
  CHECKED: 'CHECKED',
  INDETERMINATE: 'INDETERMINATE',
  UNCHECKED: 'UNCHECKED',
}

export const { CHECKED, INDETERMINATE, UNCHECKED } = CHECKBOX_STATE

const CheckBox = ({ className, disabled, id, onClick, checked }) => {
  if (typeof checked === 'boolean') {
    checked = checked
      ? CHECKBOX_STATE.CHECKED
      : CHECKBOX_STATE.UNCHECKED
  }
  const ref = useRef(null)
  useLayoutEffect(() => {
    ref.current.indeterminate = checked === CHECKBOX_STATE.INDETERMINATE
  }, [checked])

  return (
    <input
      checked={checked === CHECKBOX_STATE.CHECKED}
      className={classnames('check-box', className, {
        'far fa-square': checked === CHECKBOX_STATE.UNCHECKED,
        'fa fa-check-square check-box__checked': checked === CHECKBOX_STATE.CHECKED,
        'fa fa-minus-square check-box__indeterminate': checked === CHECKBOX_STATE.INDETERMINATE,
      })}
      disabled={disabled}
      id={id}
      onClick={
        onClick
          ? (event) => {
            event.preventDefault()
            onClick()
          }
          : null
      }
      readOnly
      ref={ref}
      type="checkbox"
    />
  )
}

CheckBox.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func,
  checked: PropTypes.oneOf([...Object.keys(CHECKBOX_STATE), true, false]).isRequired,
}

CheckBox.defaultProps = {
  className: undefined,
  disabled: false,
  id: undefined,
}

export default CheckBox
