import React, { Component } from 'react'
import { inherits } from 'util'
import InputNumber from '../input-number.js'

export default GasModalCard

inherits(GasModalCard, Component)
function GasModalCard () {
  Component.call(this)
}

GasModalCard.prototype.render = function GasModalCard () {
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

