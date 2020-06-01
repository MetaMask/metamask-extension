import PropTypes from 'prop-types'
import React from 'react'

export default function ReadOnlyInput (props) {
  const {
    wrapperClass = '',
    inputClass = '',
    value,
    textarea,
    onClick,
  } = props

  const InputType = textarea ? 'textarea' : 'input'

  return (
    <div className={wrapperClass}>
      <InputType
        className={inputClass}
        value={value}
        readOnly
        onFocus={(event) => event.target.select()}
        onClick={onClick}
      />
    </div>
  )
}

ReadOnlyInput.propTypes = {
  wrapperClass: PropTypes.string,
  inputClass: PropTypes.string,
  value: PropTypes.string,
  textarea: PropTypes.bool,
  onClick: PropTypes.func,
}
