import PropTypes from 'prop-types'
import React, { Component } from 'react'
import InputNumber from '../input-number.js'

export default class GasModalCard extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    copy: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    unitLabel: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    step: PropTypes.number,
    min: PropTypes.number,
  }

  render () {
    const {
      onChange,
      unitLabel,
      value,
      min,
      step,
      title,
      copy,
    } = this.props

    return (
      <div className="send-v2__gas-modal-card">
        <div className="send-v2__gas-modal-card__title">{title}</div>
        <div className="send-v2__gas-modal-card__copy">{copy}</div>
        <InputNumber
          unitLabel={unitLabel}
          step={step}
          min={min}
          placeholder="0"
          value={value}
          onChange={onChange}
        />
      </div>
    )
  }
}
