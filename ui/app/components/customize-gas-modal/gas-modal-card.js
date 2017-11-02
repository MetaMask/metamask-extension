const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const InputNumber = require('../input-number.js')
// const GasSlider = require('./gas-slider.js')

module.exports = GasModalCard

inherits(GasModalCard, Component)
function GasModalCard () {
  Component.call(this)
}

GasModalCard.prototype.render = function () {
  const {
    // memo,
    onChange,
    unitLabel,
    value,
    min,
    // max,
    step,
    title,
    copy,
  } = this.props

  return h('div.send-v2__gas-modal-card', [

    h('div.send-v2__gas-modal-card__title', {}, title),

    h('div.send-v2__gas-modal-card__copy', {}, copy),

    h(InputNumber, {
      unitLabel,
      step,
      // max,
      min,
      placeholder: '0',
      value,
      onChange,
    }),

    // h(GasSlider, {
    //   value,
    //   step,
    //   max,
    //   min,
    //   onChange,
    // }),

  ])

}

