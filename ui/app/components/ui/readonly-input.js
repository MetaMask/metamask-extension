<<<<<<< HEAD
const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = ReadOnlyInput

inherits(ReadOnlyInput, Component)
function ReadOnlyInput () {
  Component.call(this)
}

ReadOnlyInput.prototype.render = function () {
=======
import PropTypes from 'prop-types'
import React from 'react'

export default function ReadOnlyInput (props) {
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  const {
    wrapperClass = '',
    inputClass = '',
    value,
    textarea,
    onClick,
  } = props

  const inputType = textarea ? 'textarea' : 'input'

<<<<<<< HEAD
  return h('div', {className: wrapperClass}, [
    h(inputType, {
      className: inputClass,
      value,
      readOnly: true,
      onFocus: event => event.target.select(),
      onClick,
    }),
  ])
=======
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
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
}

ReadOnlyInput.propTypes = {
  wrapperClass: PropTypes.string,
  inputClass: PropTypes.string,
  value: PropTypes.string,
  textarea: PropTypes.bool,
  onClick: PropTypes.func,
}
